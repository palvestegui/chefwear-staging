import { db } from './src/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

async function run() {
  const q = query(collection(db, 'orders'), where('orderId', '==', 'ORD-00003'));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const data = snap.docs[0].data();
    console.log("Order items for ORD-00003:");
    console.log(JSON.stringify(data.items, null, 2));
  } else {
    console.log("ORD-00003 not found");
  }
  process.exit(0);
}

run().catch(console.error);
