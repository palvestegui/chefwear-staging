const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./firebase-applet-config.json');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  const settingsDoc = await db.collection('settings').doc('pricing').get();
  const data = settingsDoc.data();
  console.log(JSON.stringify(data.services.filter(s => s.type === 'Escala de Volumen (Logos)' || s.name.toLowerCase().includes('logo')), null, 2));
}
run().catch(console.error);
