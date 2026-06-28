import * as admin from 'firebase-admin';

// Initialize with environment variables or application default credentials
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
    console.log("Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("Firebase Admin SDK initialization error:", error);
    // Fallback for local development if GOOGLE_APPLICATION_CREDENTIALS is not set
    admin.initializeApp();
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
