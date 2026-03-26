import { Injectable, BadRequestException } from '@nestjs/common';
import { FirebaseService } from '../common/firebase/firebase.service';
import type { AuditLogEntry, AuditLogPage } from './audit-logs.types';

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

@Injectable()
export class AuditLogsService {
  constructor(private readonly firebase: FirebaseService) {}

  async listForOrg(
    orgId: string,
    rawLimit: number = DEFAULT_LIMIT,
    startAfter?: string,
  ): Promise<AuditLogPage> {
    const limit = Math.min(Math.max(1, rawLimit), MAX_LIMIT);

    let query = this.firebase.firestore
      .collectionGroup('auditLogs')
      .where('orgId', '==', orgId)
      .orderBy('timestamp', 'desc')
      .limit(limit);

    if (startAfter) {
      // Cursor is a base64-encoded Firestore document path:
      // orgs/{orgId}/documents/{documentId}/auditLogs/{autoId}
      let decoded: string;
      try {
        decoded = Buffer.from(startAfter, 'base64').toString('utf-8');
      } catch {
        throw new BadRequestException('Invalid pagination cursor');
      }

      const cursorRef = this.firebase.firestore.doc(decoded);
      const cursorSnap = await cursorRef.get();
      if (!cursorSnap.exists) {
        throw new BadRequestException('Pagination cursor document not found');
      }

      query = query.startAfter(cursorSnap) as typeof query;
    }

    const snap = await query.get();

    const logs: AuditLogEntry[] = snap.docs.map((doc) => {
      const data = doc.data();
      // Convert Firestore Timestamp to ISO string; fall back gracefully if not yet committed
      const ts = data.timestamp;
      const timestamp =
        ts && typeof ts.toDate === 'function'
          ? ts.toDate().toISOString()
          : new Date().toISOString();

      return {
        id: doc.id,
        userId: data.userId ?? '',
        orgId: data.orgId ?? orgId,
        documentId: data.documentId ?? '',
        action: data.action ?? '',
        modelUsed: data.modelUsed ?? '',
        tokensUsed: data.tokensUsed ?? 0,
        responseStatus: data.responseStatus === 'error' ? 'error' : 'success',
        timestamp,
      };
    });

    // Build next cursor from the last document's full Firestore path
    let nextCursor: string | null = null;
    if (logs.length === limit) {
      const lastSnap = snap.docs[snap.docs.length - 1];
      const path = lastSnap.ref.path; // orgs/{orgId}/documents/{docId}/auditLogs/{autoId}
      nextCursor = Buffer.from(path).toString('base64');
    }

    return { logs, nextCursor };
  }
}
