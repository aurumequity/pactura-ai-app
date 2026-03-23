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
import type { AuditSummary, FrameworkCallout } from './audit-summary.types';
import type { GapCheckResult, GapItem } from '../gap-check/gap-check.types';

@Injectable()
export class AuditSummaryService {
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

  async generateAuditSummary(
    orgId: string,
    docId: string,
    uid: string,
  ): Promise<AuditSummary> {
    await this.assertMembership(orgId, uid);

    // Fetch document record
    const docRef = this.firebase.firestore
      .collection('orgs')
      .doc(orgId)
      .collection('documents')
      .doc(docId);

    const docSnap = await docRef.get();
    if (!docSnap.exists) throw new NotFoundException('Document not found');

    const docData = docSnap.data();
    const complianceGaps = docData?.complianceGaps as
      | Record<string, GapCheckResult>
      | undefined;

    if (!complianceGaps || Object.keys(complianceGaps).length === 0) {
      throw new BadRequestException(
        'No gap check results found. Run a compliance gap check first.',
      );
    }

    // Build framework callouts from stored gap data
    const frameworkCallouts: FrameworkCallout[] = Object.entries(
      complianceGaps,
    ).map(([framework, result]) => {
      const gaps = result.gaps ?? [];
      const met = gaps.filter((g: GapItem) => g.status === 'met').length;
      const partial = gaps.filter((g: GapItem) => g.status === 'partial').length;
      const missing = gaps.filter((g: GapItem) => g.status === 'missing').length;
      const topGap =
        gaps.find((g: GapItem) => g.status === 'missing')?.requirement ??
        gaps.find((g: GapItem) => g.status === 'partial')?.requirement ??
        'No gaps identified';
      return { framework, met, partial, missing, topGap };
    });

    // Build structured prompt from gap data
    const gapSummaryText = frameworkCallouts
      .map(
        (fc) =>
          `${fc.framework}: ${fc.met} met, ${fc.partial} partial, ${fc.missing} missing. Top gap: ${fc.topGap}`,
      )
      .join('\n');

    const allGaps = Object.values(complianceGaps).flatMap(
      (r) => r.gaps ?? [],
    ) as GapItem[];

    const missingGaps = allGaps
      .filter((g) => g.status === 'missing')
      .slice(0, 10)
      .map((g) => `- ${g.requirement}: ${g.recommendation}`)
      .join('\n');

    const prompt = `You are a compliance risk analyst generating an executive audit summary for a document governance platform called Pactura.

The following compliance gap check results have been run against this document:

FRAMEWORK SUMMARY:
${gapSummaryText}

TOP MISSING CONTROLS:
${missingGaps}

Based on this data, generate an executive audit summary. Respond ONLY with a valid JSON object matching this exact shape, no markdown, no explanation:
{
  "riskScore": <integer 1-10 where 1=lowest risk, 10=highest risk>,
  "riskLevel": "low" | "medium" | "high" | "critical",
  "executiveNarrative": "<2-3 sentence executive summary of this document's compliance posture>",
  "remediationActions": [
    {
      "priority": "high" | "medium" | "low",
      "action": "<specific action to take>",
      "framework": "<which framework this addresses>"
    }
  ]
}

Rules:
- riskScore 1-3 = low, 4-5 = medium, 6-7 = high, 8-10 = critical
- Include 3-5 remediationActions ordered by priority (high first)
- executiveNarrative should be suitable for a non-technical executive audience
- Be specific and actionable, not generic`;

    // Call Claude
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('');

    let parsed: Partial<AuditSummary>;
    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse audit summary response:', rawText);
      throw new InternalServerErrorException(
        'Failed to parse audit summary from AI response',
      );
    }

    const summary: AuditSummary = {
      riskScore: parsed.riskScore ?? 5,
      riskLevel: parsed.riskLevel ?? 'medium',
      executiveNarrative: parsed.executiveNarrative ?? '',
      remediationActions: parsed.remediationActions ?? [],
      frameworkCallouts,
      basedOnFrameworks: Object.keys(complianceGaps),
      runAt: admin.firestore.FieldValue.serverTimestamp() as any,
    };

    // Persist to Firestore
    await docRef.update({ auditSummary: summary });

    return summary;
  }
}
