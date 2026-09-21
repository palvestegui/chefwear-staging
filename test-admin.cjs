const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'mystic-return-81b2m' });
const db = admin.firestore();

async function test() {
  try {
    const snap = await db.collection('orders').limit(1).get();
    console.log("Docs found:", snap.size);
  } catch (err) {
    console.error("Error connecting to default DB:", err);
  }
}
test();
