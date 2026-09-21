import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { normalizeName } from './contactUtils';
import { getRolesForAccountType } from './constants';
import { getNextContactId } from './accountContactUtils';
import { ensureCorporateAccountExists } from './accountContactMutations';
import { Contact } from '../types';

export interface GarmentAllocation {
  garmentName: string;
  fabric?: string;
  fabricColor?: string;
  size: string; // e.g. 'S', 'M', 'L', 'XL', '2XL', 'Personalizado'
  measurements?: Record<string, string | number>;
  pocketName?: string;
  embroideries?: string[];
  services?: string[];
  customPocketDetails?: string;
  customServicePrices?: Record<string, number>;
  referenceImages?: Array<{ url: string; note?: string }>;
  productionStatus?: 'Pendiente' | 'Material Listo' | 'En Producción' | 'Producido' | 'Entregado';
}

export interface InstitutionalEmployee {
  id: string; // Internal unique ID for row tracking
  contactId?: string; // e.g. CON-xxx if matched or created
  fullName: string;
  phone?: string;
  email?: string;
  role?: string; // Chef, Sub-Chef, Cocinero, Mesero, Bartender, etc.
  notes?: string;
  garments: GarmentAllocation[];
}

export const isInstitutionalOrder = (order: any): boolean => {
  if (!order) return false;
  if (order.isInstitutional) return true;
  if (order.institutionalRoster && order.institutionalRoster.length > 0) return true;
  if (Array.isArray(order.items) && order.items.some((it: any) => Boolean(it.recipientName))) return true;
  return false;
};

/**
 * Parses TSV/CSV text pasted from Excel or Google Sheets.
 * Supported header formats:
 * Nombre \t Teléfono \t Cargo \t Talla Filipina \t Talla Pantalón \t Talla Mandil \t Nombre Bordado
 */
export const parseTsvRoster = (
  tsvText: string,
  garmentTemplates: Array<{ name: string; fabric?: string; fabricColor?: string }> = []
): InstitutionalEmployee[] => {
  if (!tsvText || !tsvText.trim()) return [];

  const lines = tsvText.trim().split(/\r?\n/);
  const result: InstitutionalEmployee[] = [];

  lines.forEach((line, lineIdx) => {
    // Split by tab or comma/semicolon if no tabs
    const cells = line.includes('\t')
      ? line.split('\t').map(c => c.trim())
      : line.split(/[,;]/).map(c => c.trim());

    if (cells.length === 0 || !cells[0]) return;

    // Skip potential header row if first column is "nombre" or "name"
    const firstCellLower = cells[0].toLowerCase();
    if (lineIdx === 0 && (firstCellLower.includes('nombre') || firstCellLower.includes('name') || firstCellLower.includes('empleado'))) {
      return;
    }

    const fullName = cells[0] || `Empleado ${lineIdx + 1}`;
    const phone = cells[1] || '';
    const role = cells[2] || 'Personal';

    // Map remaining cells to garment sizes or fallback to standard templates
    const garments: GarmentAllocation[] = [];

    if (garmentTemplates.length > 0) {
      garmentTemplates.forEach((gt, gtIdx) => {
        const isStandardOnly = /mandil|gorro|delantal|cofia|bandana/i.test(gt.name);
        const sizeValue = isStandardOnly ? 'STD' : (cells[3 + gtIdx] || 'M');
        const pocketNameVal = cells[3 + garmentTemplates.length + gtIdx] || (cells[3 + garmentTemplates.length] || '');

        garments.push({
          garmentName: gt.name,
          fabric: gt.fabric || 'Drill de 8oz',
          fabricColor: gt.fabricColor || '',
          size: sizeValue.toUpperCase(),
          pocketName: pocketNameVal,
          measurements: {},
          services: [],
          embroideries: pocketNameVal ? [`Nombre en Bolsillo: ${pocketNameVal}`] : []
        });
      });
    } else {
      // Default 3 standard pieces if no template passed
      const defaultGNames = ['Filipina', 'Pantalón', 'Mandil'];
      defaultGNames.forEach((gName, gIdx) => {
        const isStandardOnly = /mandil|gorro|delantal|cofia|bandana/i.test(gName);
        const sizeValue = isStandardOnly ? 'STD' : (cells[3 + gIdx] || 'M');
        garments.push({
          garmentName: gName,
          fabric: 'Drill de 8oz',
          fabricColor: '',
          size: sizeValue.toUpperCase(),
          pocketName: cells[6] || '',
          measurements: {},
          services: [],
          embroideries: cells[6] ? [`Nombre en Bolsillo: ${cells[6]}`] : []
        });
      });
    }

    const notes = cells[cells.length - 1] && cells.length > (3 + (garmentTemplates.length || 3))
      ? cells[cells.length - 1]
      : '';

    result.push({
      id: `emp-${Date.now()}-${lineIdx}-${Math.random().toString(36).substr(2, 5)}`,
      fullName,
      phone,
      role,
      notes,
      garments
    });
  });

  return result;
};

/**
 * Expands an employee roster into standard flattened order items for pricing, inventory, and production.
 */
export const expandRosterToOrderItems = (
  roster: InstitutionalEmployee[],
  existingCommonServices: string[] = []
): any[] => {
  const flattenedItems: any[] = [];

  roster.forEach(emp => {
    emp.garments.forEach(g => {
      const itemServices = Array.from(new Set([...(g.services || []), ...existingCommonServices]));
      flattenedItems.push({
        name: g.garmentName,
        fabric: g.fabric || 'Drill de 8oz',
        fabricColor: g.fabricColor || '',
        qty: 1,
        size: g.size || 'M',
        measurements: g.measurements || {},
        services: itemServices,
        pocketName: g.pocketName || '',
        embroideries: g.embroideries || (g.pocketName ? [`Nombre en Bolsillo: ${g.pocketName}`] : []),
        recipientName: emp.fullName,
        recipientPhone: emp.phone || '',
        recipientEmail: emp.email || '',
        recipientRole: emp.role || '',
        recipientNotes: emp.notes || '',
        recipientContactId: emp.contactId || '',
        productionStatus: g.productionStatus || 'Pendiente'
      });
    });
  });

  return flattenedItems;
};

/**
 * Provisions or updates individual Master Contacts in Firestore linked to the Corporate Account.
 */
export const provisionInstitutionalContacts = async (
  roster: InstitutionalEmployee[],
  corporateAccount: { accountId: string; companyName: string; clientType?: string; pricingTier?: string },
  existingMasterContacts: any[] = [],
  db: any
): Promise<{ createdCount: number; updatedCount: number }> => {
  if (!roster || roster.length === 0 || !db) return { createdCount: 0, updatedCount: 0 };

  let createdCount = 0;
  let updatedCount = 0;

  // 1. Ensure corporate account exists in clientAccounts with valid ACC-xxx
  let resolvedAccountId = corporateAccount.accountId || 'ACC-000';
  let resolvedCompanyName = corporateAccount.companyName || 'Empresa Corporativa';

  if (!resolvedAccountId || resolvedAccountId === 'create_new' || resolvedAccountId.includes('NEW') || (resolvedAccountId === 'ACC-000' && resolvedCompanyName !== 'Cliente Particular')) {
    try {
      const ensured = await ensureCorporateAccountExists({
        accountId: resolvedAccountId,
        companyName: resolvedCompanyName,
        clientType: corporateAccount.clientType,
        pricingTier: corporateAccount.pricingTier
      }, [], db);
      resolvedAccountId = ensured.accountId;
      resolvedCompanyName = ensured.accountName;
    } catch (err) {
      console.warn('Error ensuring corporate account:', err);
    }
  }

  // 2. Fetch or prepare contacts list for sequential CON-0000 generation
  let allContacts = [...existingMasterContacts];
  if (allContacts.length === 0) {
    try {
      const snap = await getDocs(collection(db, 'masterContacts'));
      allContacts = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    } catch (e) {
      console.warn('Error fetching masterContacts for sequential ID:', e);
    }
  }

  const contactLookup = new Map<string, Contact>();
  allContacts.forEach(c => {
    const norm = normalizeName(c.fullName || `${c.contactNombre || ''} ${c.contactApellido || ''}`);
    const accId = c.accountId || 'ACC-000';
    if (norm) {
      contactLookup.set(`${norm}_${accId}`, c); // Primary match: name + same account
    }
    if (c.phone) {
      const cleanPhone = String(c.phone).replace(/\D/g, '');
      if (cleanPhone) contactLookup.set(`phone_${cleanPhone}`, c);
    }
    if (c.contactId) {
      contactLookup.set(c.contactId, c);
    }
  });

  let newContactsCreated = 0;

  for (const emp of roster) {
    if (!emp.fullName || !emp.fullName.trim()) continue;

    const norm = normalizeName(emp.fullName);
    const cleanPhone = emp.phone ? String(emp.phone).replace(/\D/g, '') : null;
    
    // Deduplication match priority: 1. ID, 2. Name + Account, 3. Phone (if provided)
    let existing = emp.contactId ? contactLookup.get(emp.contactId) : null;
    if (!existing) {
      existing = contactLookup.get(`${norm}_${resolvedAccountId}`);
    }
    if (!existing && cleanPhone) {
      existing = contactLookup.get(`phone_${cleanPhone}`);
    }

    // Aggregate sizing from employee's assigned garments
    const sizingMatrix: Record<string, any> = {};
    (emp.garments || []).forEach(g => {
      if (g.size) {
        sizingMatrix[`talla_${g.garmentName.toLowerCase().replace(/\s+/g, '_')}`] = g.size;
      }
      if (g.measurements && Object.keys(g.measurements).length > 0) {
        Object.assign(sizingMatrix, g.measurements);
      }
    });

    let contactId: string;
    if (existing?.contactId && !existing.contactId.includes('CORP-') && !existing.contactId.includes('ORD-')) {
      contactId = existing.contactId;
    } else if (existing?.id && !existing.id.includes('CORP-') && !existing.id.includes('ORD-')) {
      contactId = existing.id;
    } else {
      contactId = getNextContactId(allContacts, newContactsCreated);
      newContactsCreated++;
    }

    const contactData = {
      contactId,
      fullName: emp.fullName.trim(),
      phone: emp.phone || existing?.phone || '',
      email: emp.email || existing?.email || '',
      role: emp.role?.trim().toUpperCase() || existing?.role || getRolesForAccountType(corporateAccount.clientType)[0] || 'OTRO',
      accountId: resolvedAccountId,
      parentAccountId: resolvedAccountId,
      parentAccountName: resolvedCompanyName,
      companyName: resolvedCompanyName,
      corporateAffiliation: {
        accountId: resolvedAccountId,
        companyName: resolvedCompanyName,
        role: emp.role?.trim().toUpperCase() || getRolesForAccountType(corporateAccount.clientType)[0] || 'OTRO',
        lastUpdated: Date.now()
      },
      sizingMatrix: {
        ...(existing?.sizingMatrix || {}),
        ...sizingMatrix
      },
      updatedAt: Date.now(),
      ...(existing ? {} : { createdAt: Date.now() })
    };

    try {
      await setDoc(doc(db, 'masterContacts', contactId), contactData, { merge: true });
      contactLookup.set(`${norm}_${resolvedAccountId}`, contactData);
      if (cleanPhone) contactLookup.set(`phone_${cleanPhone}`, contactData);
      contactLookup.set(contactId, contactData);
      if (existing) updatedCount++;
      else createdCount++;
    } catch (err) {
      console.warn('Error saving institutional contact:', emp.fullName, err);
    }
  }

  return { createdCount, updatedCount };
};
