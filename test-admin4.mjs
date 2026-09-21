import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
// Wait, the prompt says ai-studio-...
const app = initializeApp({ projectId: 'ai-studio-0dba6e4d-b474-410e-b078-6e631bf1a01a' });
const db = getFirestore(app); 

async function test() {
  try {
    const snap = await db.collection('orders').limit(1).get();
    console.log("Docs found with ai-studio project:", snap.size);
  } catch (err) {
    console.error("Error connecting:", err);
  }
}
test();
