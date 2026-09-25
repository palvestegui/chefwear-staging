import { collection, doc, getDocs, setDoc, writeBatch, Firestore } from 'firebase/firestore';
import { runSeedUDI } from './crmSeedUtils';
import { isSystemAccount } from './constants';
import { User } from 'firebase/auth';

export const purgeCollection = async (
  firestore: Firestore,
  collectionName: string,
  filterFn?: (id: string) => boolean
): Promise<number> => {
  const colRef = collection(firestore, collectionName);
  const snap = await getDocs(colRef);
  const targets = snap.docs.filter(d => (filterFn ? filterFn(d.id) : true));
  
  const CHUNK_SIZE = 400;
  let deleted = 0;
  for (let i = 0; i < targets.length; i += CHUNK_SIZE) {
    const chunk = targets.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(firestore);
    chunk.forEach(d => batch.delete(d.ref));
    await batch.commit();
    deleted += chunk.length;
  }
  return deleted;
};

export const purgeQuotesAndOrders = async (firestore: Firestore): Promise<number> => {
  const q = await purgeCollection(firestore, 'quotes');
  const o = await purgeCollection(firestore, 'orders');
  const i = await purgeCollection(firestore, 'orderItems');
  const m = await purgeCollection(firestore, 'orderModifiers');
  return q + o + i + m;
};

export const resetCatalogPricing = async (firestore: Firestore): Promise<void> => {
  await setDoc(doc(firestore, 'pricing', 'global'), {
    garments: {},
    catalog: [],
    version: 0,
    updatedAt: Date.now(),
  }, { merge: true });

  try {
    await setDoc(doc(firestore, 'settings', 'pricing'), {
      garments: {},
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (legacyErr) {
    console.warn('[Maintenance] Legacy settings/pricing reset skipped:', legacyErr);
  }
};

export const restoreCanonicalServices = async (
  firestore: Firestore,
  canonicalData: unknown
): Promise<void> => {
  await setDoc(doc(firestore, 'pricing', 'global'), canonicalData as Record<string, unknown>, { merge: true });
};

export const purgeStagingData = async (
  firestore: Firestore,
  user: User | null,
  canonicalData: unknown
): Promise<void> => {
  await purgeQuotesAndOrders(firestore);
  await purgeCollection(firestore, 'clientAccounts', id => !isSystemAccount(id));
  await purgeCollection(firestore, 'accounts', id => !isSystemAccount(id));
  await purgeCollection(firestore, 'masterContacts', id => id !== 'CON-001');
  await purgeCollection(firestore, 'account_contacts');

  await resetCatalogPricing(firestore);
  await restoreCanonicalServices(firestore, canonicalData);
  await runSeedUDI(firestore, user, [], true);
};
