import { db } from './src/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

async function run() {
  const q = query(collection(db, 'orders'), where('id', '==', 'ORD-00003'));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const data = snap.docs[0].data();
    console.log("Order ORD-00003 data:");
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log("ORD-00003 not found by id");
    const q2 = query(collection(db, 'orders'));
    const snap2 = await getDocs(q2);
    snap2.forEach(doc => {
      if (doc.data().orderId === 'ORD-00003' || doc.id === 'ORD-00003') {
        console.log("Found as:", doc.id);
        console.log(JSON.stringify(doc.data(), null, 2));
      }
    });
  }
  process.exit(0);
}

run().catch(console.error);
