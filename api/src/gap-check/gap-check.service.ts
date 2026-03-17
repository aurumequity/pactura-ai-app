import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import Anthropic from '@anthropic-ai/sdk';
import { FirebaseService } from '../common/firebase/firebase.service';
import { buildPrompt, VALID_FRAMEWORKS, type FrameworkKey } from './framework-prompts';
import type { GapCheckDto, GapItem } from './gap-check.types';

@Injectable()
export class GapCheckService {
  private readonly anthropic = new Anthropic();

  constructor(private readonly firebase: FirebaseService) {}

  private async assertMembership(orgId: string, uid: string) {
    const memberRef = this.firebase.firestore
      .collection('orgs')
      .doc(orgId)
      .collection('memberships')
      .doc(uid);
    const snap = await memberRef.get();
    if (!snap.exists || snap.data()?.status !== 'active') {
      throw new ForbiddenException('Not a member of this org');
    }
  }

  async runGapCheck(
    orgId: string,
    docId: string,
    uid: string,
    dto: GapCheckDto,
  ): Promise<{ framework: FrameworkKey; gaps: GapItem[] }> {
    await this.assertMembership(orgId, uid);

    // Validate framework
    if (!VALID_FRAMEWORKS.includes(dto.framework)) {
      throw new BadRequestException(
        `Invalid framework. Must be one of: ${VALID_FRAMEWORKS.join(', ')}`,
      );
    }

    // Fetch document record
    const docRef = this.firebase.firestore
      .collection('orgs')
      .doc(orgId)
      .collection('documents')
      .doc(docId);

    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      throw new NotFoundException('Document not found');
    }

    const storagePath = docSnap.data()?.storagePath as string | undefined;
    if (!storagePath) {
      throw new BadRequestException('Document has no associated file');
    }

    // Download PDF from Storage as buffer
    const bucket = admin
      .storage()
      .bucket(`${process.env.FIREBASE_PROJECT_ID}.appspot.com`);

    const [buffer] = await bucket.file(storagePath).download();
    const base64Pdf = buffer.toString('base64');

    // Call Claude with PDF as base64 document block
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64Pdf,
              },
            },
            {
              type: 'text',
              text: buildPrompt(dto.framework),
            },
          ],
        },
      ],
    });

    // Parse Claude's JSON response
    const rawText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('');

    let gaps: GapItem[];
    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      gaps = JSON.parse(cleaned) as GapItem[];
    } catch {
      console.error('Failed to parse Claude response:', rawText);
      throw new InternalServerErrorException(
        'Failed to parse compliance analysis from AI response',
      );
    }

    // Persist results to Firestore under complianceGaps.<framework>
    await docRef.update({
      [`complianceGaps.${dto.framework}`]: {
        framework: dto.framework,
        runAt: admin.firestore.FieldValue.serverTimestamp(),
        gaps,
      },
    });

    return { framework: dto.framework, gaps };
  }
}
