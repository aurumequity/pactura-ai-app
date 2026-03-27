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
import { AuditService } from '../common/audit/audit.service';
import { AuditEvents } from '../common/audit/audit-events';
import type { AnomalyReport, Anomaly } from './anomaly-detect.types';

@Injectable()
export class AnomalyDetectService {
  private readonly anthropic = new Anthropic();

  constructor(
    private readonly firebase: FirebaseService,
    private readonly auditService: AuditService,
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

  async detectAnomalies(
    orgId: string,
    docId: string,
    uid: string,
  ): Promise<AnomalyReport> {
    await this.assertMembership(orgId, uid);

    // Fetch document record
    const docRef = this.firebase.firestore
      .collection('orgs')
      .doc(orgId)
      .collection('documents')
      .doc(docId);

    const docSnap = await docRef.get();
    if (!docSnap.exists) throw new NotFoundException('Document not found');

    const storagePath = docSnap.data()?.storagePath as string | undefined;
    if (!storagePath) {
      throw new BadRequestException('Document has no associated file');
    }

    // Download PDF from Storage as buffer
    const bucket = admin
      .storage()
      .bucket(process.env.FIREBASE_STORAGE_BUCKET);

    const [buffer] = await bucket.file(storagePath).download();
    const base64Pdf = buffer.toString('base64');

    const prompt = `You are a contract intelligence analyst specializing in document anomaly detection for a compliance platform called Pactura.

Analyze the attached document and identify anomalies in two categories:

1. UNUSUAL CLAUSES — language, terms, or provisions that deviate from industry standard practice, are unusually one-sided, potentially unenforceable, or could create unexpected liability
2. MISSING CLAUSES — provisions that are typically required or expected for this document type but appear to be absent

For each anomaly found, assess its severity:
- critical: immediate legal or compliance risk, requires urgent attention
- high: significant risk that should be addressed before execution
- medium: notable deviation worth reviewing with counsel
- low: minor issue or best-practice suggestion

Respond ONLY with a valid JSON object matching this exact shape, no markdown, no explanation:
{
  "documentType": "<inferred document type e.g. 'Federal Subcontractor Agreement', 'Data Processing Agreement'>",
  "anomalies": [
    {
      "type": "unusual_clause" | "missing_clause" | "conflicting_terms" | "non_standard_language",
      "severity": "critical" | "high" | "medium" | "low",
      "title": "<short title of the anomaly>",
      "description": "<what was found or what is missing and why it matters>",
      "recommendation": "<specific action to take>",
      "location": "<section reference if identifiable, otherwise omit>"
    }
  ]
}

Rules:
- Be specific and grounded in the actual document content
- Do not invent anomalies — only flag what you actually observe or can reasonably infer is missing for this document type
- Order anomalies by severity (critical first)
- Limit to the 10 most significant anomalies
- Keep descriptions concise and actionable`;

    // Call Claude with PDF as base64 document block
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
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
              text: prompt,
            },
          ],
        },
      ],
    });

    // Parse Claude's response
    const rawText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('');

    let parsed: { documentType: string; anomalies: Anomaly[] };
    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse anomaly detection response:', rawText);
      throw new InternalServerErrorException(
        'Failed to parse anomaly detection from AI response',
      );
    }

    const anomalies = parsed.anomalies ?? [];
    const report: AnomalyReport = {
      documentType: parsed.documentType ?? 'Unknown',
      totalAnomalies: anomalies.length,
      criticalCount: anomalies.filter((a) => a.severity === 'critical').length,
      highCount: anomalies.filter((a) => a.severity === 'high').length,
      mediumCount: anomalies.filter((a) => a.severity === 'medium').length,
      lowCount: anomalies.filter((a) => a.severity === 'low').length,
      anomalies,
      runAt: admin.firestore.FieldValue.serverTimestamp() as any,
    };

    // Persist to Firestore
    await docRef.update({ anomalyReport: report });

    void this.auditService.logToDocument({
      userId: uid,
      orgId,
      documentId: docId,
      action: AuditEvents.ANOMALY_DETECT_RUN,
      modelUsed: 'claude-sonnet-4-20250514',
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      responseStatus: 'success',
    });

    return report;
  }
}
