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
  ChatDto,
  ChatReply,
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

    const doc = await this.getDocument(orgId, uid, docId);

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prompt = `You are a federal contract intelligence engine for Pactura, a document governance platform.

Analyze the attached document carefully and return a structured analysis.

You MUST respond with only a valid JSON object matching this exact shape, no markdown, no explanation:
{
  "contractType": "string describing the contract or document type",
  "keyParties": ["array", "of", "involved", "parties"],
  "complianceFlags": [
    { "label": "flag description", "severity": "info" | "warning" | "critical" }
  ],
  "summary": "2-3 sentence narrative about this document and its compliance implications",
  "effectiveDate": "ISO date string or null if not found",
  "termLength": "human-readable duration string or null if not found",
  "totalValue": "formatted dollar amount or null if not found",
  "keyObligations": ["array", "of", "key", "obligation", "strings"]
}`;

    // Download PDF and send as document block for full-content analysis
    let messageParams: Anthropic.MessageCreateParamsNonStreaming;
    if (doc.storagePath) {
      const bucket = admin
        .storage()
        .bucket(process.env.FIREBASE_STORAGE_BUCKET);
      const [buffer] = await bucket.file(doc.storagePath).download();
      const base64Pdf = buffer.toString('base64');

      messageParams = {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document' as const,
                source: {
                  type: 'base64' as const,
                  media_type: 'application/pdf' as const,
                  data: base64Pdf,
                },
              },
              { type: 'text' as const, text: prompt },
            ],
          },
        ],
      };
    } else {
      messageParams = {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: `You are a federal contract intelligence engine for Pactura, a document governance platform.

A user has uploaded a document with the following metadata:
- File name: "${doc.name}"
- File type: "${doc.fileType}"

Based on the filename and file type, infer what you can about this document.

You MUST respond with only a valid JSON object matching this exact shape, no markdown, no explanation:
{
  "contractType": "string describing the likely contract or document type",
  "keyParties": ["array", "of", "likely", "involved", "parties"],
  "complianceFlags": [
    { "label": "flag description", "severity": "info" | "warning" | "critical" }
  ],
  "summary": "2-3 sentence narrative about this document and its compliance implications",
  "effectiveDate": null,
  "termLength": null,
  "totalValue": null,
  "keyObligations": []
}`,
          },
        ],
      };
    }

    const message = await client.messages.create(messageParams);

    // Extract the text content from Claude's response
    const rawText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('');

    let parsed: AnalysisResult;
    try {
      parsed = JSON.parse(rawText) as AnalysisResult;
    } catch {
      throw new Error('Failed to parse AI analysis response');
    }

    await this.firebase.firestore
      .collection('orgs')
      .doc(orgId)
      .collection('documents')
      .doc(docId)
      .update({
        auditSummary: parsed,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    void this.auditService.logToDocument({
      userId: uid,
      orgId,
      documentId: docId,
      action: AuditEvents.AUDIT_SUMMARY_RUN,
      modelUsed: message.model,
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
      responseStatus: 'success',
    });

    return parsed;
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

  async chatDocument(
    orgId: string,
    uid: string,
    docId: string,
    dto: ChatDto,
  ): Promise<ChatReply> {
    await this.assertMembership(orgId, uid);

    const doc = await this.getDocument(orgId, uid, docId);

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const systemPrompt = `You are Pactura's document AI assistant — an expert in federal procurement, contract governance, and compliance frameworks (SOC 2, HIPAA, GDPR, CMMC, FINRA).

The user is asking questions about a specific document:
- Name: "${doc.name}"
- Type: "${doc.fileType}"
- Status: "${doc.status}"
- Version: ${doc.version ?? 1}${doc.complianceGaps ? `\n- Compliance frameworks analyzed: ${Object.keys(doc.complianceGaps).join(', ')}` : ''}${doc.auditSummary ? `\n- Audit risk score: ${doc.auditSummary.riskScore}/10 (${doc.auditSummary.riskLevel})` : ''}${doc.anomalyReport ? `\n- Anomaly count: ${doc.anomalyReport.totalAnomalies} (${doc.anomalyReport.criticalCount} critical, ${doc.anomalyReport.highCount} high)` : ''}

The full document content is provided in the first user message as a PDF. Answer questions accurately based on what you can read. Focus on compliance implications, remediation guidance, and risk context.`;

    // Download PDF and inject as document block in the first user message
    let messagesWithDoc: Anthropic.MessageParam[];
    if (doc.storagePath) {
      const bucket = admin
        .storage()
        .bucket(process.env.FIREBASE_STORAGE_BUCKET);
      const [buffer] = await bucket.file(doc.storagePath).download();
      const base64Pdf = buffer.toString('base64');

      messagesWithDoc = dto.messages.map((msg, i) => {
        if (i === 0 && msg.role === 'user') {
          return {
            role: 'user' as const,
            content: [
              {
                type: 'document' as const,
                source: {
                  type: 'base64' as const,
                  media_type: 'application/pdf' as const,
                  data: base64Pdf,
                },
              },
              { type: 'text' as const, text: msg.content },
            ],
          };
        }
        return msg as Anthropic.MessageParam;
      });
    } else {
      messagesWithDoc = dto.messages as Anthropic.MessageParam[];
    }

    let message: Anthropic.Message;
    try {
      message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        messages: messagesWithDoc,
      });
    } catch (err) {
      void this.auditService.logToDocument({
        userId: uid,
        orgId,
        documentId: docId,
        action: AuditEvents.DOCUMENT_CHAT,
        modelUsed: 'claude-sonnet-4-20250514',
        tokensUsed: 0,
        responseStatus: 'error',
      });
      throw err;
    }

    const reply = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('');

    void this.auditService.logToDocument({
      userId: uid,
      orgId,
      documentId: docId,
      action: AuditEvents.DOCUMENT_CHAT,
      modelUsed: message.model,
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
      responseStatus: 'success',
    });

    return { reply };
  }

  async getDocumentAuditLogs(
    orgId: string,
    uid: string,
    docId: string,
  ): Promise<Record<string, unknown>[]> {
    await this.assertMembership(orgId, uid);

    const snap = await this.firebase.firestore
      .collection('orgs')
      .doc(orgId)
      .collection('documents')
      .doc(docId)
      .collection('auditLogs')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
