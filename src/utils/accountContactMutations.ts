import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { normalizePricingTier, normalizeAccountType } from './constants';
import { cleanStr, getNextAccountId, getNextContactId } from './accountContactUtils';

export interface EnsureContactParams {
  contactId?: string;
  contactNombre?: string;
  contactApellido?: string;
  fullName?: string;
  accountId?: string;
  accountName?: string;
  phone?: string;
  email?: string;
  role?: string;
  userId?: string;
}

export const ensureContactExists = async (
  params: EnsureContactParams,
  existingContacts: any[] = [],
  db: any
): Promise<{ contactId: string }> => {
  const rawId = (params.contactId || '').trim();

  // Already valid standard contact
  if (rawId.startsWith('CON-') && !rawId.includes('ORD-') && !rawId.includes('CORP-')) {
    return { contactId: rawId };
  }

  const cleanFirstName = (params.contactNombre || '').trim();
  const cleanLastName = (params.contactApellido || '').trim();
  const rawFullName = params.fullName ? params.fullName.trim() : `${cleanFirstName} ${cleanLastName}`.trim();
  
  if (!rawFullName) return { contactId: '' }; // No name provided

  // Check if exists
  const matched = existingContacts.find(c => {
    const cName = (c.fullName || `${c.contactNombre || ''} ${c.contactApellido || ''}`).trim().toLowerCase();
    return cName === rawFullName.toLowerCase() && c.contactId && c.contactId.startsWith('CON-') && !c.contactId.includes('ORD-');
  });

  if (matched) return { contactId: matched.contactId };

  // Create new sequential contact
  let contactsList = existingContacts;
  if (!contactsList || contactsList.length === 0) {
    try {
      if (db) {
        const { getDocs, collection } = await import('firebase/firestore');
        const snap = await getDocs(collection(db, 'masterContacts'));
        contactsList = snap.docs.map((d: any) => ({ ...d.data(), id: d.id }));
      }
    } catch (e) {
      console.warn('Error fetching masterContacts for next ID:', e);
    }
  }

  const newContactId = getNextContactId(contactsList);
  const newContactDoc = {
    contactId: newContactId,
    contactNombre: cleanFirstName,
    contactApellido: cleanLastName,
    fullName: rawFullName,
    accountId: params.accountId || 'ACC-000',
    parentAccountId: params.accountId || 'ACC-000',
    companyName: params.accountName || 'Cliente Particular',
    parentAccountName: params.accountName || 'Cliente Particular',
    phone: params.phone || '',
    email: params.email || '',
    role: params.role || 'PARTICULAR',
    createdAt: Date.now(),
    createdBy: params.userId || 'system',
    updatedAt: Date.now()
  };

  if (db) {
    try {
      const { setDoc, doc } = await import('firebase/firestore');
      await setDoc(doc(db, 'masterContacts', newContactId), newContactDoc, { merge: true });
    } catch (err) {
      console.error('Error auto-creating contact:', err);
    }
  }

  return { contactId: newContactId };
};

export interface EnsureCorporateAccountParams {
  accountId?: string;
  companyName?: string;
  clientType?: string;
  pricingTier?: string;
  phone?: string;
  email?: string;
  contactNombre?: string;
  contactApellido?: string;
  deliveryCity?: string;
  deliveryAddress?: string;
  userId?: string;
}

/**
 * Ensures that a corporate account document exists in the clientAccounts collection in Firestore.
 * If accountId is 'create_new' or missing, automatically creates a new account with sequential ACC-xxx.
 */
export const ensureCorporateAccountExists = async (
  params: EnsureCorporateAccountParams,
  existingAccounts: any[] = [],
  db: any
): Promise<{ accountId: string; accountName: string }> => {
  const cleanName = (params.companyName || '').trim();
  const rawId = (params.accountId || '').trim();

  // If already a valid ACC-xxx (except ACC-000 / create_new / placeholder)
  if (rawId && rawId.startsWith('ACC-') && rawId !== 'ACC-000' && !rawId.includes('NEW')) {
    return { accountId: rawId, accountName: cleanName || 'Empresa Corporativa' };
  }

  // If no company name is provided, default to Particular ACC-000
  if (!cleanName || cleanName.toLowerCase() === 'cliente particular' || cleanName.toLowerCase() === 'particular') {
    return { accountId: 'ACC-000', accountName: 'Cliente Particular' };
  }

  // Check if an account with this exact or matching name already exists in Firestore/memory
  const matched = existingAccounts.find(a => {
    const aName = cleanStr(a.accountName);
    const query = cleanStr(cleanName);
    return aName === query && a.accountId && a.accountId !== 'ACC-000';
  });

  if (matched && matched.accountId && matched.accountId.startsWith('ACC-')) {
    return { accountId: matched.accountId, accountName: matched.accountName };
  }

  // Create new sequential account ACC-xxx
  let accountsList = existingAccounts;
  if (!accountsList || accountsList.length === 0) {
    try {
      if (db) {
        const snap = await getDocs(collection(db, 'clientAccounts'));
        accountsList = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      }
    } catch (e) {
      console.warn('Error fetching client accounts for next ID:', e);
    }
  }

  const newAccountId = getNextAccountId(accountsList);
  const accountType = normalizeAccountType(params.clientType || 'Empresa / Corporate');
  const pricingTier = normalizePricingTier(params.pricingTier || 'Estándar Raleo');

  const newAccountDoc = {
    accountId: newAccountId,
    accountName: cleanName,
    accountType,
    pricingTier,
    parentAccountId: null,
    contactNombre: params.contactNombre || '',
    contactApellido: params.contactApellido || '',
    phone: params.phone || '',
    email: params.email || '',
    deliveryCity: params.deliveryCity || '',
    deliveryAddress: params.deliveryAddress || '',
    logoEmbroidery: false,
    logoPlacements: [],
    createdAt: Date.now(),
    createdBy: params.userId || 'system',
    updatedAt: Date.now()
  };

  if (db) {
    try {
      await setDoc(doc(db, 'clientAccounts', newAccountId), newAccountDoc, { merge: true });
    } catch (err) {
      console.error('Error auto-creating corporate account:', err);
    }
  }

  return { accountId: newAccountId, accountName: cleanName };
};
