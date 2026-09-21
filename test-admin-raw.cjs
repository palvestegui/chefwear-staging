const admin = require('firebase-admin');

admin.initializeApp({ projectId: 'mystic-return-81b2m' });
const db = admin.firestore();

async function run() {
    try {
        const snap = await db.collection('orders').limit(1).get();
        console.log("Raw admin default DB docs:", snap.size);
    } catch (e) {
        console.error("Raw admin default DB error:", e.message);
    }
}
run();
