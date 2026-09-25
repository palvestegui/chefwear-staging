import { doc, setDoc } from 'firebase/firestore';
import { db } from '../src/firebase';
import livePricingData from '../src/live_pricing_global.json';

async function seed() {
  console.log('Seeding Staging Firestore with canonical Live pricing...');
  await setDoc(doc(db, 'pricing', 'global'), livePricingData);
  console.log('SUCCESS: Staging pricing/global now matches Live 1:1.');
  process.exit(0);
}

seed();
