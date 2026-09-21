import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp({ projectId: 'mystic-return-81b2m' });
const db = getFirestore(app, 'ai-studio-0dba6e4d-b474-410e-b078-6e631bf1a01a');

async function test() {
  try {
    const snap = await db.collection('orders').limit(1).get();
    console.log("Named DB with mystic-return project Docs found:", snap.size);
  } catch (err) {
    console.error("Error connecting:", err);
  }
}
test();
