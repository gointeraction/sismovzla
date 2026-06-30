import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const app = initializeApp({
  credential: applicationDefault(),
});

export const db = getFirestore(app);
export const auth = getAuth(app);
