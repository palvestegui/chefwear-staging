
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

let config: any = {
  projectId: 'mystic-return-81b2m'
};
try {
  const raw = fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8');
  config = { ...config, ...JSON.parse(raw) };
} catch(e) {}

const app = getApps().length === 0 ? initializeApp({ projectId: config.projectId }) : getApp();

// Since neither (default) nor chefwear-db seem to resolve with the backend ADC without permissions error or NOT_FOUND,
// Let's use the explicit db instance based on the firebase-applet-config.json for AI Studio specifically
export const db = getFirestore(app, 'ai-studio-0dba6e4d-b474-410e-b078-6e631bf1a01a');
