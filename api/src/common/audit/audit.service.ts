import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseService } from '../firebase/firebase.service';
import { AuditEvent } from './audit-events';

export interface LogAuditParams {
  eventType: AuditEvent;
  userId: string;
  userEmail: string;
  orgId: string;
  documentId?: string;
  metadata?: Record<string, unknown>;
  resultSnapshot?: Record<string, unknown>;
}

export interface LogDocumentAuditParams {
  userId: string;
  orgId: string;
  documentId: string;
  action: AuditEvent;
  modelUsed: string;
  tokensUsed: number;
  responseStatus: 'success' | 'error';
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly firebase: FirebaseService) {}

  async log(params: LogAuditParams): Promise<void> {
    const {
      eventType,
      userId,
      userEmail,
      orgId,
      documentId,
      metadata,
      resultSnapshot,
    } = params;

    const entry: Record<string, unknown> = {
      eventType,
      userId,
      userEmail,
      orgId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (documentId !== undefined) entry.documentId = documentId;
    if (metadata !== undefined) entry.metadata = metadata;
    if (resultSnapshot !== undefined) entry.resultSnapshot = resultSnapshot;

    try {
      await this.firebase.firestore
        .collection('orgs')
        .doc(orgId)
        .collection('auditLog')
        .add(entry);
    } catch (err) {
      // Audit failures must never crash the request — log and continue.
      this.logger.error(`Failed to write audit log [${eventType}]`, err);
    }
  }

  async logToDocument(params: LogDocumentAuditParams): Promise<void> {
    const { userId, orgId, documentId, action, modelUsed, tokensUsed, responseStatus } = params;

    const entry = {
      userId,
      orgId,
      documentId,
      action,
      modelUsed,
      tokensUsed,
      responseStatus,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    try {
      await this.firebase.firestore
        .collection('orgs')
        .doc(orgId)
        .collection('documents')
        .doc(documentId)
        .collection('auditLogs')
        .add(entry);
    } catch (err) {
      // Audit failures must never crash the request — log and continue.
      this.logger.error(`Failed to write document audit log [${action}]`, err);
    }
  }
}
