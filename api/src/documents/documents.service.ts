import { Injectable, ForbiddenException } from '@nestjs/common';
import { FirebaseService } from '../common/firebase/firebase.service';
import * as admin from 'firebase-admin';
import { DocumentRecord, CreateDocumentDto } from './documents.types';

@Injectable()
export class DocumentsService {
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
        const bucket = admin.storage().bucket(`${process.env.FIREBASE_PROJECT_ID}.appspot.com`);
        await bucket.file(storagePath).delete();
      } catch (err: any) {
        console.warn('Storage delete failed (file may not exist):', err.message);
      }
    }

    // 3. Delete Firestore metadata record
    await docRef.delete();

    return { success: true };
  }
}
