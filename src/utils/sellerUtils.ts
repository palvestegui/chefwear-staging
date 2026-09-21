import { DEFAULT_USER_CONFIGS } from './constants';

export interface SellerInfo {
  sellerName: string;
  sellerEmail: string;
  sellerUid: string;
  sellerRole?: string;
}

/**
 * Resolves canonical seller attribution for any active context (new order, quote, conversion).
 * Guaranteed to never return empty strings or 'Sin Vendedor' when an active user is present.
 */
export const resolveSellerInfo = (params: {
  userProfile?: any;
  user?: any;
  selectedSellerName?: string;
  selectedSellerEmail?: string;
  selectedSellerUid?: string;
  usersList?: any[];
  isSuperAdmin?: boolean;
}): SellerInfo => {
  const { userProfile, user, selectedSellerName, selectedSellerEmail, selectedSellerUid, usersList = [], isSuperAdmin } = params;

  const superAdminAllowed = isSuperAdmin ?? Boolean(
    userProfile?.role === 'SUPER_ADMIN' ||
    userProfile?.role === 'SUPERADMIN' ||
    (user?.email && user.email.toLowerCase() === 'palvestegui@gmail.com') ||
    (userProfile?.email && userProfile.email.toLowerCase() === 'palvestegui@gmail.com')
  );

  // 1. If superAdmin and an explicit valid seller was selected
  if (superAdminAllowed && selectedSellerName && selectedSellerName.trim() !== '' && selectedSellerName !== 'Sin Vendedor') {
    const matchedUser = usersList.find(
      u => (u.name && u.name.toLowerCase() === selectedSellerName.toLowerCase()) ||
           (u.displayName && u.displayName.toLowerCase() === selectedSellerName.toLowerCase())
    );

    return {
      sellerName: selectedSellerName.trim(),
      sellerEmail: selectedSellerEmail || matchedUser?.email || '',
      sellerUid: selectedSellerUid || matchedUser?.uid || matchedUser?.id || '',
      sellerRole: matchedUser?.role || 'SALES'
    };
  }

  // 2. Derive from active userProfile
  const userEmail = (userProfile?.email || user?.email || '').toLowerCase().trim();
  const defaultConfig = userEmail ? DEFAULT_USER_CONFIGS[userEmail] : null;

  const resolvedName = 
    userProfile?.name?.trim() ||
    user?.displayName?.trim() ||
    defaultConfig?.name ||
    (userEmail ? userEmail.split('@')[0] : 'Pablo Alvestegui');

  const resolvedEmail = userProfile?.email || user?.email || userEmail || '';
  const resolvedUid = userProfile?.uid || userProfile?.id || user?.uid || '';
  const resolvedRole = userProfile?.role || defaultConfig?.role || 'SUPER_ADMIN';

  return {
    sellerName: resolvedName,
    sellerEmail: resolvedEmail,
    sellerUid: resolvedUid,
    sellerRole: resolvedRole
  };
};

/**
 * Extracts or resolves the true seller name from any order object (active or legacy).
 * Deep-checks order.sellerName, order.createdBy, order.createdById, paymentHistory, and user email maps.
 */
export const getOrderSellerName = (order: any, usersList: any[] = []): string => {
  if (!order) return 'Pablo Alvestegui';

  // Direct sellerName check
  const rawSellerName = (order.sellerName || '').trim();
  if (rawSellerName && rawSellerName !== 'Sin Vendedor' && rawSellerName !== 'N/A') {
    return rawSellerName;
  }

  // Check sellerEmail against default configs
  const rawSellerEmail = (order.sellerEmail || '').toLowerCase().trim();
  if (rawSellerEmail && DEFAULT_USER_CONFIGS[rawSellerEmail]?.name) {
    return DEFAULT_USER_CONFIGS[rawSellerEmail].name;
  }

  // Check createdBy field
  const createdBy = (order.createdBy || '').trim();
  if (createdBy && createdBy !== 'Sistema' && createdBy !== 'undefined' && createdBy !== 'null') {
    if (createdBy.includes('@')) {
      const emailLower = createdBy.toLowerCase();
      if (DEFAULT_USER_CONFIGS[emailLower]?.name) return DEFAULT_USER_CONFIGS[emailLower].name;
    }
    return createdBy;
  }

  // Check paymentHistory for recordedBy / sellerName
  if (Array.isArray(order.paymentHistory) && order.paymentHistory.length > 0) {
    for (const payment of order.paymentHistory) {
      const pSeller = (payment.sellerName || payment.recordedBy || '').trim();
      if (pSeller && pSeller !== 'Sistema' && pSeller !== 'Sin Vendedor') {
        if (pSeller.includes('@')) {
          const emailLower = pSeller.toLowerCase();
          if (DEFAULT_USER_CONFIGS[emailLower]?.name) return DEFAULT_USER_CONFIGS[emailLower].name;
        }
        return pSeller;
      }
    }
  }

  // Check sellerId / createdById against usersList
  const sellerUid = order.sellerUid || order.sellerId || order.createdById;
  if (sellerUid && usersList.length > 0) {
    const matched = usersList.find(u => u.uid === sellerUid || u.id === sellerUid);
    if (matched?.name || matched?.displayName) {
      return matched.name || matched.displayName;
    }
  }

  // Safe fallback default to the primary operator/administrator
  return 'Pablo Alvestegui';
};
