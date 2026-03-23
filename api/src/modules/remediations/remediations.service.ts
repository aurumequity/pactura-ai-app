import { Injectable, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseService } from '../../common/firebase/firebase.service';
import { AuditService } from '../../common/audit/audit.service';
import { AuditEvents } from '../../common/audit/audit-events';
import {
  Remediation,
  CreateRemediationDto,
  UpdateRemediationDto,
  BulkCreateRemediationsDto,
  ListRemediationsQuery,
  RemediationSeverity,
} from './remediations.types';

@Injectable()
export class RemediationsService {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly audit: AuditService,
  ) {}

  private col(orgId: string) {
    return this.firebase.firestore
      .collection('orgs')
      .doc(orgId)
      .collection('remediations');
  }

  async create(
    orgId: string,
    dto: CreateRemediationDto,
    userId: string,
    userEmail: string,
  ): Promise<Remediation> {
    const now = admin.firestore.FieldValue.serverTimestamp();
    const ref = this.col(orgId).doc();

    await ref.set({
      id: ref.id,
      orgId,
      ...dto,
      status: dto.status ?? 'open',
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    await this.audit.log({
      eventType: AuditEvents.REMEDIATION_CREATED,
      userId,
      userEmail,
      orgId,
      documentId: dto.documentId,
      metadata: { remediationId: ref.id, title: dto.title, framework: dto.framework },
    });

    const snap = await ref.get();
    return { ...snap.data(), id: ref.id } as Remediation;
  }

  async list(orgId: string, query: ListRemediationsQuery): Promise<Remediation[]> {
    let q: FirebaseFirestore.Query = this.col(orgId);
    if (query.status)     q = q.where('status',     '==', query.status);
    if (query.framework)  q = q.where('framework',  '==', query.framework);
    if (query.documentId) q = q.where('documentId', '==', query.documentId);

    const snap = await q.get();
    return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Remediation));
  }

  async update(
    orgId: string,
    remediationId: string,
    dto: UpdateRemediationDto,
    userId: string,
    userEmail: string,
  ): Promise<Remediation> {
    const ref = this.col(orgId).doc(remediationId);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundException('Remediation not found');

    const before = snap.data() as Remediation;
    await ref.update({ ...dto, updatedAt: admin.firestore.FieldValue.serverTimestamp() });

    if (dto.status === 'resolved' && before.status !== 'resolved') {
      await this.audit.log({
        eventType: AuditEvents.REMEDIATION_RESOLVED,
        userId,
        userEmail,
        orgId,
        documentId: before.documentId,
        metadata: { remediationId, title: before.title, framework: before.framework },
      });
    }

    const updated = await ref.get();
    return { ...updated.data(), id: remediationId } as Remediation;
  }

  async bulkCreate(
    orgId: string,
    docId: string,
    dto: BulkCreateRemediationsDto,
    userId: string,
    userEmail: string,
  ): Promise<Remediation[]> {
    const actionable = dto.gaps.filter((g) => g.status !== 'met');
    const batch = this.firebase.firestore.batch();
    const refs: FirebaseFirestore.DocumentReference[] = [];
    const now = admin.firestore.FieldValue.serverTimestamp();

    for (const gap of actionable) {
      const severity: RemediationSeverity = gap.status === 'missing' ? 'high' : 'medium';
      const ref = this.col(orgId).doc();
      refs.push(ref);
      batch.set(ref, {
        id: ref.id,
        orgId,
        documentId: docId,
        sourceGap: gap.requirement,
        framework: dto.framework,
        title: gap.requirement,
        description: gap.recommendation,
        assigneeId: dto.defaultAssigneeId,
        assigneeEmail: dto.defaultAssigneeEmail,
        dueDate: dto.defaultDueDate,
        status: 'open',
        severity,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });
    }

    await batch.commit();

    await this.audit.log({
      eventType: AuditEvents.REMEDIATION_CREATED,
      userId,
      userEmail,
      orgId,
      documentId: docId,
      metadata: { bulk: true, count: refs.length, framework: dto.framework },
    });

    const snaps = await Promise.all(refs.map((r) => r.get()));
    return snaps.map((s) => ({ ...s.data(), id: s.id } as Remediation));
  }
}