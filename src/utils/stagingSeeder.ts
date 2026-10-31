import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  limit, 
  query, 
  setDoc, 
  updateDoc,
  deleteField,
  Firestore 
} from 'firebase/firestore';
import canonicalServicesAndUdi from '../data/canonicalServicesAndUdi.json';
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
    } else {
      const data = pricingSnap.data() || {};
      const udiPreset = data.specialPresets?.['UDI Especial'];
      const hasTestFilipina = Boolean(data.garments?.['TestFilipina']);
      const missingServices = !Array.isArray(data.services) || data.services.length === 0;
      
      if (!udiPreset || hasTestFilipina || missingServices) {
        console.log('[StagingSeeder] Restoring canonical UDI Especial presets, services, and cleaning TestFilipina...');
        await restoreCanonicalUdiAndServices(db);
      }
    }
  } catch (err: unknown) {
    console.warn('[StagingSeeder] Error during baseline seeding check:', err);
  }
}

/**
 * Restores canonical UDI Especial presets (with exact names), discounts, and 50 services,
 * and purges orphaned TestFilipina from pricing.garments without touching standard garments or catalogGarments.
 */
export async function restoreCanonicalUdiAndServices(firestoreDb: Firestore): Promise<void> {
  const udiPayload: Record<string, unknown> = {
    specialPresets: {
      "UDI Especial": {
        "Filipina UDI": { "Drill de 8oz": 253 },
        "Pantalón UDI": { "Drill de 8oz": 190 },
        "Mandil UDI": { "Tornado (Bull Denim)": 149 },
        "Gorro UDI": { "Drill de 8oz": 35 }
      }
    },
    udiPricing: {
      "Filipina UDI": { "Drill de 8oz": 253 },
      "Pantalón UDI": { "Drill de 8oz": 190 },
      "Mandil UDI": { "Tornado (Bull Denim)": 149 },
      "Gorro UDI": { "Drill de 8oz": 35 }
    },
    services: canonicalServicesAndUdi.services,
    discountRulesByTier: {
      "Estándar B2B": {
        maxSellerDiscountPercent: 5,
        cashDiscountPercent: 3,
        cashDiscountEnabled: true,
        sellerDiscountEnabled: true,
        fullPackageDiscountPercent: 0,
        volumeDiscountEnabled: false,
        cashDiscountMinAmount: 500,
        volumeTiers: [
          { minQuantity: 3, discountPercent: 3 },
          { minQuantity: 6, discountPercent: 7 },
          { minQuantity: 12, discountPercent: 10 }
        ]
      }
    },
    updatedAt: Date.now()
  };

  // 1. Merge UDI presets, 50 services, and discount rules safely
  await setDoc(doc(firestoreDb, 'pricing', 'global'), udiPayload, { merge: true });

  // 2. Remove orphaned TestFilipina from garments
  try {
    await updateDoc(doc(firestoreDb, 'pricing', 'global'), {
      "garments.TestFilipina": deleteField()
    });
  } catch (cleanErr: unknown) {
    console.warn('[StagingSeeder] TestFilipina cleanup notice:', cleanErr);
  }
}
