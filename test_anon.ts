import { signInAnonymously } from 'firebase/auth';
import { auth, db } from './src/firebase.ts';
import { collection, getDocs } from 'firebase/firestore';

async function test() {
  try {
    await signInAnonymously(auth);
    console.log("Signed in anonymously");
    const s = await getDocs(collection(db, 'orders'));
    console.log("Docs:", s.docs.length);
  } catch (e) {
    console.error(e);
  }
}
test();
