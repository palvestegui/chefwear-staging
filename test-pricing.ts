import { db } from './src/firebase';
import { doc, getDoc } from 'firebase/firestore';

async function run() {
  const docRef = doc(db, 'settings', 'pricing');
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const data = snap.data();
    console.log(Object.keys(data.specialPresets?.['UDI Especial'] || {}));
  }
  process.exit(0);
}

run().catch(console.error);
