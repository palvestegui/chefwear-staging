import { 
  getRolesForAccountType, 
  ACCOUNT_TYPES, 
  normalizeAccountType,
  normalizeRole
} from './constants';

export function cleanStr(s: any): string {
  if (!s || typeof s !== 'string') return '';
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanPhone(p: any): string {
  if (!p || typeof p !== 'string') return '';
  return p.replace(/\D/g, '');
}

export function resolveContactDetails(
  c: any,
  accountContacts: any[] = [],
  clientAccounts: any[] = [],
  orders: any[] = []
) {
  // 1. Direct link in accountContacts
  const userLink = accountContacts.find(ac => {
    if (c.contactId && ac.contactId && ac.contactId === c.contactId) return true;
    const acName = cleanStr(`${ac.contactNombre || ''} ${ac.contactApellido || ''}`);
    const cName = cleanStr(c.fullName || `${c.contactNombre || ''} ${c.contactApellido || ''}`);
    return acName && cName && (acName === cName || acName.includes(cName) || cName.includes(acName));
  });

  // 2. All previous orders for this contact
  const targetId = (c.contactId || '').trim();
  const targetName = cleanStr(c.fullName || `${c.contactNombre || ''} ${c.contactApellido || ''}`);
  const targetPhone = cleanPhone(c.phone || '');
  const targetEmail = cleanStr(c.email || '');

  const matchingOrders = orders.filter(o => {
    if (targetId && o.contactId && o.contactId.trim() === targetId) return true;
    if (targetPhone && o.phone && cleanPhone(o.phone) === targetPhone && targetPhone.length >= 6) return true;
    if (targetEmail && o.email && cleanStr(o.email) === targetEmail && targetEmail.length > 3) return true;
    if (targetName) {
      const oName = cleanStr(o.customer || `${o.customerFirstName || ''} ${o.customerLastName || ''}`);
      if (oName === targetName) return true;
      if (oName.includes(targetName) || targetName.includes(oName)) return true;
    }
    return false;
  }).sort((a, b) => (b.createdAt || b.date || b.updatedAt || 0) - (a.createdAt || a.date || a.updatedAt || 0));

  const latestOrder = matchingOrders.length > 0 ? matchingOrders[0] : null;

  // 3. Find the most recent business / employment order
  const businessOrder = matchingOrders.find(o => {
    const accId = (o.accountId || '').trim();
    const compName = (o.companyName || o.placeOfEmploy || o.placeOfEmployment || o.workplace || o.empresa || o.company || o.institution || '').trim();
    const cat = (o.category || '').trim();
    const cType = (o.clientType || '').trim();
    const cRole = (o.contactRole || o.role || '').trim().toUpperCase();

    const hasValidAccount = accId && accId !== 'ACC-000' && accId !== 'Ninguna' && accId !== 'null';
    const hasValidCompName = compName && compName !== 'Cliente Particular' && compName !== 'Particular';
    const isUdi = cat === 'UDI' || compName.toUpperCase().includes('UDI') || cRole.includes('ESTUDIANTE') || cRole.includes('DOCENTE');
    const isBusinessCategory = cat && cat !== 'Personal' && cat !== 'Particular';
    const isBusinessClientType = cType && cType !== 'Particular / Individuo' && cType !== 'Particular';
    const isBusinessRole = cRole && cRole !== 'PARTICULAR' && cRole !== 'OTRO' && cRole !== 'CLIENTE';

    return hasValidAccount || hasValidCompName || isUdi || isBusinessCategory || isBusinessClientType || isBusinessRole;
  });

  const referenceOrder = businessOrder || latestOrder;

  // 4. Raw fields from contact, links, and orders
  const rawAccountId = (userLink?.accountId && userLink.accountId !== 'ACC-000' && userLink.accountId !== 'Ninguna') 
    ? userLink.accountId 
    : (c.accountId && c.accountId !== 'ACC-000' && c.accountId !== 'Ninguna') 
      ? c.accountId 
      : (referenceOrder?.accountId && referenceOrder.accountId !== 'ACC-000' && referenceOrder.accountId !== 'Ninguna')
        ? referenceOrder.accountId
        : '';

  const rawPlaceOfEmploy = (
    c.placeOfEmploy || 
    c.placeOfEmployment || 
    c.workplace || 
    c.empresa || 
    c.company || 
    c.companyName || 
    c.institution ||
    c.accountName ||
    userLink?.companyName ||
    userLink?.accountName ||
    referenceOrder?.companyName || 
    referenceOrder?.placeOfEmploy ||
    referenceOrder?.placeOfEmployment ||
    referenceOrder?.workplace ||
    referenceOrder?.empresa ||
    referenceOrder?.company ||
    referenceOrder?.institution ||
    ''
  ).trim();

  const rawRole = (
    (userLink?.role && userLink.role !== 'PARTICULAR') 
      ? userLink.role 
      : (c.role && c.role !== 'PARTICULAR') 
        ? c.role 
        : (referenceOrder?.contactRole && referenceOrder.contactRole !== 'PARTICULAR')
          ? referenceOrder.contactRole
          : (referenceOrder?.role && referenceOrder.role !== 'PARTICULAR')
            ? referenceOrder.role
            : c.role || referenceOrder?.contactRole || referenceOrder?.role || ''
  ).trim();

  const rawCategory = referenceOrder?.category || c.category || '';
  const rawClientType = (c.clientType && c.clientType !== 'Particular / Individuo') 
    ? c.clientType 
    : (referenceOrder?.clientType && referenceOrder.clientType !== 'Particular / Individuo')
      ? referenceOrder.clientType
      : c.clientType || referenceOrder?.clientType || '';

  // 5. Check if contact or past orders belong to UDI
  const isUdi = 
    rawCategory === 'UDI' ||
    rawAccountId === 'ACC-001' ||
    rawPlaceOfEmploy.toUpperCase().includes('UDI') ||
    rawRole.toUpperCase().includes('ESTUDIANTE') ||
    rawRole.toUpperCase().includes('DOCENTE') ||
    rawClientType.toUpperCase().includes('UDI') ||
    (typeof c.fullName === 'string' && c.fullName.toUpperCase().includes('UDI'));

  // 6. Resolve Account, Company, Client Type, Pricing Tier
  let accountId = '';
  let companyName = '';
  let clientType = '';
  let pricingTier = 'Estándar Raleo';

  if (isUdi) {
    const udiAcc = clientAccounts.find(a => a.accountId === 'ACC-001') || 
                   clientAccounts.find(a => cleanStr(a.accountName).includes('udi'));
    accountId = udiAcc ? udiAcc.accountId : 'ACC-001';
    companyName = udiAcc ? udiAcc.accountName : 'Universidad UDI';
    clientType = 'Universidad / Instituto';
    pricingTier = udiAcc?.pricingTier || 'Contrato Institucional';
  } else if (rawAccountId && rawAccountId !== 'ACC-000') {
    const matched = clientAccounts.find(a => a.accountId === rawAccountId);
    if (matched) {
      accountId = matched.accountId;
      companyName = matched.accountName;
      clientType = normalizeAccountType(matched.accountType);
      pricingTier = matched.pricingTier || 'Estándar Raleo';
    } else {
      accountId = rawAccountId;
      companyName = rawPlaceOfEmploy || rawAccountId;
      clientType = normalizeAccountType(rawClientType || 'Empresa / Corporate');
      pricingTier = 'Estándar Raleo';
    }
  } else if (rawPlaceOfEmploy && rawPlaceOfEmploy !== 'Cliente Particular' && rawPlaceOfEmploy !== 'Particular') {
    const cleanComp = cleanStr(rawPlaceOfEmploy);
    const matched = clientAccounts.find(a => cleanStr(a.accountName) === cleanComp || cleanStr(a.accountName).includes(cleanComp) || cleanComp.includes(cleanStr(a.accountName)));
    if (matched) {
      accountId = matched.accountId;
      companyName = matched.accountName;
      clientType = normalizeAccountType(matched.accountType);
      pricingTier = matched.pricingTier || 'Estándar Raleo';
    } else {
      accountId = 'create_new';
      companyName = rawPlaceOfEmploy;
      if (cleanComp.includes('restauran') || cleanComp.includes('resto') || cleanComp.includes('bar') || cleanComp.includes('cafe')) {
        clientType = 'Restaurante';
      } else if (cleanComp.includes('panad') || cleanComp.includes('pastel') || cleanComp.includes('repost')) {
        clientType = 'Panadería';
      } else if (cleanComp.includes('universidad') || cleanComp.includes('instituto') || cleanComp.includes('colegio') || cleanComp.includes('escuela')) {
        clientType = 'Universidad / Instituto';
      } else {
        clientType = normalizeAccountType(rawClientType || 'Empresa / Corporate');
      }
      pricingTier = 'Estándar Raleo';
    }
  } else if (rawClientType && rawClientType !== 'Particular / Individuo') {
    clientType = normalizeAccountType(rawClientType);
    accountId = 'create_new';
    companyName = '';
    pricingTier = 'Estándar Raleo';
  } else if (rawRole && rawRole.toUpperCase() !== 'PARTICULAR' && rawRole.toUpperCase() !== 'OTRO') {
    const uRole = rawRole.toUpperCase();
    if (uRole.includes('ESTUDIANTE') || uRole.includes('DOCENTE')) {
      clientType = 'Universidad / Instituto';
      const udiAcc = clientAccounts.find(a => a.accountId === 'ACC-001') || clientAccounts.find(a => cleanStr(a.accountName).includes('udi'));
      accountId = udiAcc ? udiAcc.accountId : 'ACC-001';
      companyName = udiAcc ? udiAcc.accountName : 'Universidad UDI';
      pricingTier = udiAcc?.pricingTier || 'Contrato Institucional';
    } else if (uRole.includes('CHEF') || uRole.includes('GARZON') || uRole.includes('GARZÓN') || uRole.includes('BARTENDER') || uRole.includes('COCIN')) {
      clientType = 'Restaurante';
      accountId = 'create_new';
      companyName = '';
      pricingTier = 'Estándar Raleo';
    } else if (uRole.includes('PANADERO')) {
      clientType = 'Panadería';
      accountId = 'create_new';
      companyName = '';
      pricingTier = 'Estándar Raleo';
    } else {
      clientType = 'Empresa / Corporate';
      accountId = 'create_new';
      companyName = '';
      pricingTier = 'Estándar Raleo';
    }
  } else {
    // Pure individual / particular
    accountId = 'ACC-000';
    companyName = 'Cliente Particular';
    clientType = 'Particular / Individuo';
    pricingTier = 'Estándar Raleo';
  }

  // 7. Role resolution
  const finalRole = normalizeRole(rawRole, clientType);

  // 8. Contact Info
  const phone = c.phone || referenceOrder?.phone || latestOrder?.phone || '';
  const email = c.email || referenceOrder?.email || latestOrder?.email || '';
  const city = c.city || referenceOrder?.city || latestOrder?.city || 'Santa Cruz';
  const address = c.address || referenceOrder?.address || latestOrder?.address || '';
  const displayName = c.fullName || `${c.contactNombre || ''} ${c.contactApellido || ''}`.trim() || referenceOrder?.customer || latestOrder?.customer || '';

  return {
    contactId: c.contactId || '',
    customer: displayName,
    customerFirstName: c.contactNombre || displayName.split(' ')[0] || '',
    customerLastName: c.contactApellido || displayName.split(' ').slice(1).join(' ') || '',
    phone,
    email,
    city,
    address,
    clientType,
    accountId,
    companyName,
    contactRole: finalRole,
    pricingTier
  };
}
