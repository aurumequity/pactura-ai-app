import { Injectable, ForbiddenException } from '@nestjs/common';
import { FirebaseService } from '../common/firebase/firebase.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly firebase: FirebaseService) {}

  private async assertMembership(orgId: string, uid: string) {
    const snap = await this.firebase.firestore
      .collection('orgs')
      .doc(orgId)
      .collection('memberships')
      .doc(uid)
      .get();
    if (!snap.exists || snap.data()?.status !== 'active') {
      throw new ForbiddenException('Not a member of this org');
    }
  }

  async listAuditLog(
    orgId: string,
    uid: string,
    limit = 100,
  ): Promise<Record<string, unknown>[]> {
    await this.assertMembership(orgId, uid);

    // Collection group query across all document-level auditLogs subcollections,
    // filtered to this org so cross-org data is never returned.
    const snap = await this.firebase.firestore
      .collectionGroup('auditLogs')
      .where('orgId', '==', orgId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }
}
