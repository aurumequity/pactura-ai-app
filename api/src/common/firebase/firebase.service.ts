import * as admin from 'firebase-admin';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FirebaseService {
  constructor() {
    const useEmulator = process.env.FIREBASE_EMULATOR === 'true';

    // if (useEmulator) {
    //   process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
    //   process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    //   process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';
    // }

    if (!admin.apps.length) {
      if (useEmulator) {
        // Local dev — no credentials needed
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID,
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        });
      } else {
        // Demo/prod — uses service account credentials
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: process.env.FIREBASE_PROJECT_ID,
          storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        });
      }
    }
  }

  get firestore(): admin.firestore.Firestore {
    return admin.firestore();
  }

  async verifyToken(idToken: string) {
    return admin.auth().verifyIdToken(idToken, false);
  }
}
