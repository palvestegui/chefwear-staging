import { collection, getDocs } from 'firebase/firestore';
import { db } from './src/firebase.ts';

async function test() {
  const s = await getDocs(collection(db, 'orders'));
  console.log(s.docs.length);
}
test();
