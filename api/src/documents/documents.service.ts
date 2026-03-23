import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FirebaseService } from '../common/firebase/firebase.service';
import * as admin from 'firebase-admin';
import {
  DocumentRecord,
  CreateDocumentDto,
  NewVersionDto,
  DeltaByFramework,
} from './documents.types';
import Anthropic from '@anthropic-ai/sdk';
import { AnalysisResult } from './documents.types';
import { AuditService } from '../common/audit/audit.service';
import { AuditEvents } from '../common/audit/audit-events';
import { GapCheckService } from '../gap-check/gap-check.service';
import type { GapItem, GapCheckResult } from '../gap-check/gap-check.types';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly auditService: AuditService,
    private readonly gapCheckService: GapCheckService,
  ) {}

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

  async createDocument(
    orgId: string,
    uid: string,
    dto: CreateDocumentDto,
  ): Promise<DocumentRecord> {
    await this.assertMembership(orgId, uid);
    const docRef = this.firebase.firestore
      .collection('orgs')
      .doc(orgId)
      .collection('documents')
      .doc();
    const now = admin.firestore.FieldValue.serverTimestamp();
    await docRef.set({
      name: dto.name,
      fileType: dto.fileType,
      storagePath: dto.storagePath,
      status: 'active',
      uploadedBy: uid,
      createdAt: now,
      updatedAt: now,
      version: 1,
      isLatestVersion: true,
    });
    const snap = await docRef.get();
    return { id: snap.id, ...snap.data() } as DocumentRecord;
  }

  async listDocuments(orgId: string, uid: string): Promise<DocumentRecord[]> {
    await this.assertMembership(orgId, uid);
    const snap = await this.firebase.firestore
      .collection('orgs')
      .doc(orgId)
      .collection('documents')
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DocumentRecord);
  }

  async getDocument(
    orgId: string,
    uid: string,
    docId: string,
  ): Promise<DocumentRecord> {
    await this.assertMembership(orgId, uid);
    const snap = await this.firebase.firestore
      .collection('orgs')
      .doc(orgId)
      .collection('documents')
      .doc(docId)
      .get();
    if (!snap.exists) throw new ForbiddenException('Document not found');
    return { id: snap.id, ...snap.data() } as DocumentRecord;
  }

  async deleteDocument(
    orgId: string,
    uid: string,
    docId: string,
  ): Promise<{ success: boolean }> {
    await this.assertMembership(orgId, uid);

    // 1. Get the document to retrieve storagePath
    const docRef = this.firebase.firestore
      .collection('orgs')
      .doc(orgId)
      .collection('documents')
      .doc(docId);
    const snap = await docRef.get();
    if (!snap.exists) throw new ForbiddenException('Document not found');

    // 2. Delete from Firebase Storage
    const storagePath = snap.data()?.storagePath;
    if (storagePath) {
      try {
        const bucket = admin
          .storage()
          .bucket(process.env.FIREBASE_STORAGE_BUCKET);
        await bucket.file(storagePath).delete();
      } catch (err: any) {
        console.warn(
          'Storage delete failed (file may not exist):',
          err.message,
        );
      }
    }

    // 3. Delete Firestore metadata record
    await docRef.delete();

    return { success: true };
  }
  async analyzeDocument(
    orgId: string,
    uid: string,
    docId: string,
  ): Promise<AnalysisResult> {
    await this.assertMembership(orgId, uid);

    // Fetch the document record so we have name + fileType
    const doc = await this.getDocument(orgId, uid, docId);

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = `You are a federal contract intelligence engine for Pactura, a document governance platform.

A user has uploaded a document with the following metadata:
- File name: "${doc.name}"
- File type: "${doc.fileType}"

Based solely on the filename and file type, infer what you can about this document and return a structured analysis. Be realistic and conservative — if the filename is vague, reflect that uncertainty in your response.

You MUST respond with only a valid JSON object matching this exact shape, no markdown, no explanation:
{
  "contractType": "string describing the likely contract or document type",
  "keyParties": ["array", "of", "likely", "involved", "parties"],
  "complianceFlags": [
    { "label": "flag description", "severity": "info" | "warning" | "critical" }
  ],
  "summary": "2-3 sentence narrative about this document and its compliance implications"
}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    // Extract the text content from Claude's response
    const rawText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('');

    try {
      return JSON.parse(rawText) as AnalysisResult;
    } catch {
      throw new Error('Failed to parse AI analysis response');
    }
  }

  private computeDelta(
    currentGaps: Record<string, GapCheckResult> | undefined,
    previousGaps: Record<string, GapCheckResult> | undefined,
  ): DeltaByFramework {
    const result: DeltaByFramework = {};

    const allFrameworks = new Set([
      ...Object.keys(currentGaps ?? {}),
      ...Object.keys(previousGaps ?? {}),
    ]);

    for (const framework of allFrameworks) {
      const currItems = currentGaps?.[framework]?.gaps ?? [];
      const prevItems = previousGaps?.[framework]?.gaps ?? [];

      const isGap = (item: GapItem) => item.status !== 'met';

      const currGapMap = new Map(
        currItems.filter(isGap).map((g) => [g.requirement, g]),
      );
      const prevGapMap = new Map(
        prevItems.filter(isGap).map((g) => [g.requirement, g]),
      );

      const resolved: GapItem[] = [];
      const persisting: GapItem[] = [];
      const introduced: GapItem[] = [];

      for (const [req, item] of prevGapMap) {
        if (currGapMap.has(req)) {
          persisting.push(currGapMap.get(req)!);
        } else {
          resolved.push(item);
        }
      }

      for (const [req, item] of currGapMap) {
        if (!prevGapMap.has(req)) {
          introduced.push(item);
        }
      }

      result[framework] = { resolved, persisting, introduced };
    }

    return result;
  }

  async createNewVersion(
    orgId: string,
    uid: string,
    userEmail: string,
    currentDocId: string,
    dto: NewVersionDto,
  ): Promise<DocumentRecord> {
    await this.assertMembership(orgId, uid);

    const docsRef = this.firebase.firestore
      .collection('orgs')
      .doc(orgId)
      .collection('documents');

    const currentSnap = await docsRef.doc(currentDocId).get();
    if (!currentSnap.exists) throw new NotFoundException('Document not found');

    const currentData = currentSnap.data()!;
    if (!currentData.isLatestVersion) {
      throw new BadRequestException(
        'Can only create a new version from the latest version',
      );
    }

    const currentVersion: number = currentData.version ?? 1;
    const now = admin.firestore.FieldValue.serverTimestamp();
    const newDocRef = docsRef.doc();

    const batch = this.firebase.firestore.batch();
    batch.update(docsRef.doc(currentDocId), {
      isLatestVersion: false,
      updatedAt: now,
    });
    batch.set(newDocRef, {
      name: dto.name,
      fileType: dto.fileType,
      storagePath: dto.storagePath,
      status: 'active',
      uploadedBy: uid,
      createdAt: now,
      updatedAt: now,
      version: currentVersion + 1,
      previousVersionId: currentDocId,
      isLatestVersion: true,
    });
    await batch.commit();

    const previousFrameworks = Object.keys(currentData.complianceGaps ?? {});
    for (const framework of previousFrameworks) {
      try {
        await this.gapCheckService.runGapCheck(orgId, newDocRef.id, uid, {
          framework: framework as any,
        });
      } catch (err: any) {
        console.warn(
          `Auto gap-check failed for framework ${framework}:`,
          err.message,
        );
      }
    }

    await this.auditService.log({
      eventType: AuditEvents.DOCUMENT_UPLOADED,
      userId: uid,
      userEmail,
      orgId,
      documentId: newDocRef.id,
      metadata: {
        version: currentVersion + 1,
        previousVersionId: currentDocId,
        name: dto.name,
      },
    });

    const newSnap = await newDocRef.get();
    return { id: newSnap.id, ...newSnap.data() } as DocumentRecord;
  }

  async getDocumentDelta(
    orgId: string,
    uid: string,
    docId: string,
  ): Promise<DeltaByFramework> {
    await this.assertMembership(orgId, uid);

    const currentDoc = await this.getDocument(orgId, uid, docId);
    if (!currentDoc.previousVersionId) {
      throw new NotFoundException(
        'No previous version exists for this document',
      );
    }

    const previousDoc = await this.getDocument(
      orgId,
      uid,
      currentDoc.previousVersionId,
    );

    return this.computeDelta(currentDoc.complianceGaps, previousDoc.complianceGaps);
  }
}
