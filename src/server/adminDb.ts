import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0
  ? initializeApp({ projectId: firebaseConfig.projectId })
  : getApp();

// Connect specifically to the named Applet Firestore database
export const adminDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const db = adminDb;
