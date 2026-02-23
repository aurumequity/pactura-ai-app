import * as admin from "firebase-admin";
import { Injectable } from "@nestjs/common";

@Injectable()
export class FirebaseService {
  constructor() {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
  if (!admin.apps.length) {
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }
}

  get firestore(): admin.firestore.Firestore {
    return admin.firestore();
  }

async verifyToken(idToken: string) {
  return admin.auth().verifyIdToken(idToken, false);
  }
}