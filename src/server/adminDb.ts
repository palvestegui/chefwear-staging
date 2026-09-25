
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

interface ServerFirebaseConfig {
  projectId?: string;
}

const config: ServerFirebaseConfig = {
  projectId: 'azafran-staging'
};

const app = getApps().length === 0 ? initializeApp({ projectId: config.projectId }) : getApp();

export const db = getFirestore(app);

