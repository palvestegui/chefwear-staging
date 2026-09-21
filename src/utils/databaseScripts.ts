import { collection, getDocs, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db as defaultDb } from '../firebase';

/**
 * Phase 1 Database Mock Directory Purge Utility
 * 
 * Safely purges mock directory contacts and accounts while strictly preserving
 * production foundational entities and real customer records.
 */

// Target Mock Account IDs to purge
export const MOCK_ACCOUNT_IDS = new Set([
  'ACC-003',
  'ACC-004',
  'ACC-005',
  'ACC-006',
  'ACC-03',
  'ACC-04',
  'ACC-05',
  'ACC-06',
  'ACC-3',
  'ACC-4',
  'ACC-5',
  'ACC-6'
]);

// Protected Accounts that MUST NEVER be deleted
export const PROTECTED_ACCOUNT_IDS = new Set([
  'ACC-000',
  'ACC-001',
  'ACC-002',
  'ACC-00',
  'ACC-01',
  'ACC-02',
  'ACC-0',
  'ACC-1',
  'ACC-2'
]);

// Target Mock Contact IDs to purge
export const MOCK_CONTACT_IDS = new Set([
  'CON-0006', 'CON-0007', 'CON-0008', 'CON-0009', 'CON-0010',
  'CON-0011', 'CON-0012', 'CON-0013', 'CON-0014', 'CON-0015',
  'CON-0016', 'CON-0017', 'CON-0018', 'CON-0019', 'CON-0020',
  'CON-0021', 'CON-0022', 'CON-0023', 'CON-0024', 'CON-0025',
  // 3-digit sequence aliases
  'CON-006', 'CON-007', 'CON-008', 'CON-009', 'CON-010',
  'CON-011', 'CON-012', 'CON-013', 'CON-014', 'CON-015',
  'CON-016', 'CON-017', 'CON-018', 'CON-019', 'CON-020',
  'CON-021', 'CON-022', 'CON-023', 'CON-024', 'CON-025',
  // Short aliases
  'CON-06', 'CON-07', 'CON-08', 'CON-09',
  'CON-6', 'CON-7', 'CON-8', 'CON-9'
]);

// Protected Contacts that MUST NEVER be deleted
export const PROTECTED_CONTACT_IDS = new Set([
  'CON-0001', 'CON-001', 'CON-01', 'CON-1', // Matias Peñaranda
  'CON-0004', 'CON-004', 'CON-04', 'CON-4', // Daniela Cuellar
  'CON-0005', 'CON-005', 'CON-05', 'CON-5'  // Hugo A. Salazar M.
]);

// Protected Names normalized (lower case without accents)
const PROTECTED_NAMES = [
  'matias penaranda',
  'matias peñaranda',
  'daniela cuellar',
  'hugo a. salazar',
  'hugo salazar'
];

// Target Mock Contact Names (normalized)
const MOCK_NAMES = [
  'lourdes guzman',
  'lourdes guzmán',
  'diana giraldes',
  'manuel josue',
  'manuel josué',
  'homer',
  'lisa',
  'marge',
  'max fernandez',
  'max fernández',
  'gimena sparkles',
  'gimena rearden',
  'azkargorta'
];

const normalizeStr = (val?: string): string => {
  if (!val) return '';
  return val
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

export interface PurgeResult {
  accountsDeleted: string[];
  contactsDeleted: string[];
  accountLinksDeleted: number;
  success: boolean;
  message: string;
}

export const executeMockDirectoryPurge = async (db: any = defaultDb, force = false): Promise<PurgeResult> => {
  const PURGE_KEY = 'azafran_mock_purge_phase1_v1';
  
  if (!force && typeof window !== 'undefined') {
    const executed = localStorage.getItem(PURGE_KEY);
    if (executed === 'completed') {
      return {
        accountsDeleted: [],
        contactsDeleted: [],
        accountLinksDeleted: 0,
        success: true,
        message: 'Purge already executed previously.'
      };
    }
  }

  if (!db) {
    throw new Error('Firestore database instance not provided.');
  }

  const result: PurgeResult = {
    accountsDeleted: [],
    contactsDeleted: [],
    accountLinksDeleted: 0,
    success: false,
    message: ''
  };

  try {
    const batch = writeBatch(db);
    // 1. PURGE MOCK ACCOUNTS
    const accountsSnap = await getDocs(collection(db, 'clientAccounts'));
    for (const accDoc of accountsSnap.docs) {
      const data = accDoc.data();
      const rawId = (data.accountId || accDoc.id || '').toUpperCase().trim();
      
      // Strict Protection Guard
      if (PROTECTED_ACCOUNT_IDS.has(rawId) || rawId === 'ACC-000' || rawId === 'ACC-001' || rawId === 'ACC-002') {
        continue;
      }

      if (MOCK_ACCOUNT_IDS.has(rawId) || MOCK_ACCOUNT_IDS.has(accDoc.id.toUpperCase())) {
        batch.delete(doc(db, 'clientAccounts', accDoc.id));
        result.accountsDeleted.push(`${accDoc.id} (${rawId})`);
      }
    }

    // 2. PURGE MOCK CONTACTS FROM masterContacts
    const contactsSnap = await getDocs(collection(db, 'masterContacts'));
    for (const cDoc of contactsSnap.docs) {
      const data = cDoc.data();
      const rawId = (data.contactId || cDoc.id || '').toUpperCase().trim();
      const fullName = (data.fullName || `${data.contactNombre || ''} ${data.contactApellido || ''}`).trim();
      const normName = normalizeStr(fullName);

      // Strict Protection Guard
      const isProtectedId = PROTECTED_CONTACT_IDS.has(rawId) || PROTECTED_CONTACT_IDS.has(cDoc.id.toUpperCase());
      const isProtectedName = PROTECTED_NAMES.some(pn => normName.includes(pn));
      if (isProtectedId || isProtectedName) {
        continue;
      }

      const isTargetId = MOCK_CONTACT_IDS.has(rawId) || MOCK_CONTACT_IDS.has(cDoc.id.toUpperCase());
      const isTargetName = MOCK_NAMES.some(mn => normName.includes(mn));

      if (isTargetId || isTargetName) {
        batch.delete(doc(db, 'masterContacts', cDoc.id));
        result.contactsDeleted.push(`${cDoc.id} (${rawId} - ${fullName})`);
      }
    }

    // 3. PURGE MOCK CONTACTS FROM contacts (if legacy collection exists)
    try {
    const batch = writeBatch(db);
      const legacyContactsSnap = await getDocs(collection(db, 'contacts'));
      for (const cDoc of legacyContactsSnap.docs) {
        const data = cDoc.data();
        const rawId = (data.contactId || cDoc.id || '').toUpperCase().trim();
        const fullName = (data.fullName || `${data.contactNombre || ''} ${data.contactApellido || ''}`).trim();
        const normName = normalizeStr(fullName);

        if (PROTECTED_CONTACT_IDS.has(rawId) || PROTECTED_NAMES.some(pn => normName.includes(pn))) {
          continue;
        }

        if (MOCK_CONTACT_IDS.has(rawId) || MOCK_NAMES.some(mn => normName.includes(mn))) {
          batch.delete(doc(db, 'contacts', cDoc.id));
          result.contactsDeleted.push(`contacts/${cDoc.id} (${rawId})`);
        }
      }
    } catch {
      // Legacy collection may not exist or be empty
    }

    // 4. CLEANUP ORPHAN ASSOCIATIONS in account_contacts
    try {
    const batch = writeBatch(db);
      const linksSnap = await getDocs(collection(db, 'account_contacts'));
      for (const lDoc of linksSnap.docs) {
        const lData = lDoc.data();
        const lAcc = (lData.accountId || '').toUpperCase().trim();
        const lCon = (lData.contactId || '').toUpperCase().trim();

        if (MOCK_ACCOUNT_IDS.has(lAcc) || MOCK_CONTACT_IDS.has(lCon)) {
          batch.delete(doc(db, 'account_contacts', lDoc.id));
          result.accountLinksDeleted++;
        }
      }
    } catch {
      // Sub-collection optional
    }

    await batch.commit();
    result.success = true;
    result.message = `Purge completed: ${result.accountsDeleted.length} accounts, ${result.contactsDeleted.length} contacts, ${result.accountLinksDeleted} links removed.`;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(PURGE_KEY, 'completed');
    }
  } catch (err: any) {
    result.success = false;
    result.message = `Purge failed: ${err?.message || 'Unknown error'}`;
    console.error('Mock purge error:', err);
  }

  return result;
};

export const purgeMockDirectoryData = async (db: any = defaultDb) => {
  return await executeMockDirectoryPurge(db, true);
};
