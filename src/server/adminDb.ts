import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

function hasAdminCredentials(): boolean {
  if (process.env.USE_FIREBASE_ADMIN_DB === 'false') return false;
  if (process.env.USE_FIREBASE_ADMIN_DB === 'true') return true;

  const gacPath = (process.env.GOOGLE_APPLICATION_CREDENTIALS || '').trim();
  if (gacPath && fs.existsSync(gacPath)) return true;

  const gcpRuntimeVars = [
    'K_SERVICE',
    'CLOUD_RUN_JOB',
    'GAE_ENV',
    'FUNCTION_TARGET',
    'GOOGLE_CLOUD_WORKSTATIONS',
    'GCE_METADATA_HOST',
  ];
  if (gcpRuntimeVars.some((envName) => Boolean(process.env[envName]?.trim()))) {
    return true;
  }

  const adcPath =
    process.platform === 'win32'
      ? path.join(process.env.APPDATA || '', 'gcloud', 'application_default_credentials.json')
      : path.join(os.homedir(), '.config', 'gcloud', 'application_default_credentials.json');
  return Boolean(adcPath && fs.existsSync(adcPath));
}

export const isAdminDbAvailable: boolean = hasAdminCredentials();

const app = getApps().length === 0
  ? initializeApp({ projectId: firebaseConfig.projectId })
  : getApp();

// Connect specifically to the named Applet Firestore database
export const adminDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const db = adminDb;
