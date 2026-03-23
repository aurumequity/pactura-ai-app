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
}
