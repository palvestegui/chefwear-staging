import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import fs from 'fs';

let config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function test() {
  try {
    const snap = await getDocs(query(collection(db, 'orders'), limit(1)));
    console.log("Web SDK Docs found:", snap.size);
  } catch (err) {
    console.error("Error connecting with Web SDK:", err);
  }
}
test();
