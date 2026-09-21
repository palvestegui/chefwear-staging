import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
const app = initializeApp({ projectId: 'mystic-return-81b2m' });
const db = getFirestore(app, 'chefwear-db'); // Try named database

async function test() {
  try {
    const snap = await db.collection('orders').limit(1).get();
    console.log("chefwear-db Docs found:", snap.size);
  } catch (err) {
    console.error("Error connecting to named DB:", err);
  }
}
test();
