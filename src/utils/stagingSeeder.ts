import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  limit, 
  query, 
  setDoc, 
  Firestore 
} from 'firebase/firestore';
import { DEFAULT_PRICING, DEFAULT_FALLBACK_ACCOUNT } from './pricingDefaults';

export { DEFAULT_FALLBACK_ACCOUNT };

interface StagingAccountEntity {
  id: string;
  name: string;
  category: string;
  createdAt: string;
  accountId?: string;
  accountName?: string;
  accountType?: string;
  pricingTier?: string;
  createdBy?: string;
}

interface StagingUserEntity {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  status: string;
  name?: string;
  approved?: boolean;
  canExport?: boolean;
  canEditPrices?: boolean;
  canManageRoles?: boolean;
  canAccessDangerZone?: boolean;
  createdAt?: string;
}

let seedingAttempted = false;

/**
 * Lightweight seeder that executes once on startup in Staging.
 * Ensures baseline accounts (ACC-000, ACC-001), superadmin user, and default pricing exist.
 */
export async function initStagingSeed(db: Firestore): Promise<void> {
  if (seedingAttempted || !db) return;
  seedingAttempted = true;

  try {
    const timestamp = new Date().toISOString();

    // 1. Seed accounts if empty
    const accountsRef = collection(db, 'accounts');
    const accountsSnap = await getDocs(query(accountsRef, limit(1)));

    if (accountsSnap.empty) {
      console.log('[StagingSeeder] Seeding baseline accounts (ACC-000, ACC-001)...');

      const acc0: StagingAccountEntity = {
        id: 'ACC-000',
        accountId: 'ACC-000',
        name: 'Clientes Particulares',
        accountName: 'Clientes Particulares',
        category: 'PARTICULAR',
        accountType: 'Particular / Individuo',
        pricingTier: 'Estándar Raleo',
        createdAt: timestamp,
        createdBy: 'staging-auto-seeder'
      };

      const acc1: StagingAccountEntity = {
        id: 'ACC-001',
        accountId: 'ACC-001',
        name: 'Universidad UDI',
        accountName: 'Universidad UDI',
        category: 'INSTITUCIONAL',
        accountType: 'Universidad / Instituto',
        pricingTier: 'Contrato Institucional',
        createdAt: timestamp,
        createdBy: 'staging-auto-seeder'
      };

      // Populate both accounts and clientAccounts for full backward/forward compatibility
      await setDoc(doc(db, 'accounts', 'ACC-000'), acc0, { merge: true });
      await setDoc(doc(db, 'accounts', 'ACC-001'), acc1, { merge: true });
      await setDoc(doc(db, 'clientAccounts', 'ACC-000'), acc0, { merge: true });
      await setDoc(doc(db, 'clientAccounts', 'ACC-001'), acc1, { merge: true });
    }

    // 2. Seed SuperAdmin user for Don Pablo if not present
    const userDocRef = doc(db, 'users', 'staging-pablo-alvestegui-admin');
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      console.log('[StagingSeeder] Seeding staging SuperAdmin user for Don Pablo...');
      const adminUserData: StagingUserEntity = {
        uid: 'staging-pablo-alvestegui-admin',
        displayName: 'Pablo Alvestegui',
        name: 'Pablo Alvestegui',
        email: 'palvestegui@gmail.com',
        role: 'admin',
        status: 'APPROVED',
        approved: true,
        canExport: true,
        canEditPrices: true,
        canManageRoles: true,
        canAccessDangerZone: true,
        createdAt: timestamp
      };
      await setDoc(userDocRef, adminUserData, { merge: true });
    }

    // 3. Seed baseline pricing if doc is missing
    const pricingDocRef = doc(db, 'pricing', 'global');
    const pricingSnap = await getDoc(pricingDocRef);

    if (!pricingSnap.exists()) {
      console.log('[StagingSeeder] Seeding baseline global pricing matrix...');
      await setDoc(pricingDocRef, {
        ...DEFAULT_PRICING,
        createdAt: timestamp,
        updatedAt: Date.now()
      });
    }
  } catch (err: unknown) {
    console.warn('[StagingSeeder] Error during baseline seeding check:', err);
  }
}
