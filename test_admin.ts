import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from './firebase-applet-config.json' assert { type: 'json' };

const app = initializeApp({ projectId: firebaseConfig.projectId });
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function test() {
  try {
    const s = await db.collection('orders').limit(1).get();
    console.log("Docs found:", s.docs.length);
  } catch (e) {
    console.error(e);
  }
}
test();
