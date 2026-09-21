/**
 * Utility functions for unifying and enriching CRM directory contacts
 * with data and measurements extracted from MasterContacts and Orders.
 */

export const normalizeName = (name: string): string => {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

export const extractItemMeasurements = (order: any): Record<string, string> => {
  const measurements: Record<string, string> = {};
  
  // 1. Top-level order measurements if any
  if (order.measurements && typeof order.measurements === 'object') {
    Object.entries(order.measurements).forEach(([k, v]) => {
      if (v && String(v).trim() !== '' && String(v).trim() !== '0' && String(v).trim() !== '0.0') {
        measurements[k] = String(v).trim();
      }
    });
  }
  if (order.sizingMatrix && typeof order.sizingMatrix === 'object') {
    Object.entries(order.sizingMatrix).forEach(([k, v]) => {
      if (v && String(v).trim() !== '' && String(v).trim() !== '0' && String(v).trim() !== '0.0') {
        measurements[k] = String(v).trim();
      }
    });
  }

  // 2. Item-level measurements
  (order.items || []).forEach((item: any) => {
    if (item.measurements && typeof item.measurements === 'object') {
      Object.entries(item.measurements).forEach(([k, v]) => {
        if (v && String(v).trim() !== '' && String(v).trim() !== '0' && String(v).trim() !== '0.0') {
          measurements[k] = String(v).trim();
        }
      });
    }
    if (item.customMeasurements && typeof item.customMeasurements === 'object') {
      Object.entries(item.customMeasurements).forEach(([k, v]) => {
        if (v && String(v).trim() !== '' && String(v).trim() !== '0' && String(v).trim() !== '0.0') {
          measurements[k] = String(v).trim();
        }
      });
    }
  });

  return measurements;
};

export const buildUnifiedDirectoryContacts = (
  masterContacts: any[] = [],
  orders: any[] = [],
  passedDirectoryContacts?: any[]
): any[] => {
  if (passedDirectoryContacts && passedDirectoryContacts.length > 0) {
    return passedDirectoryContacts;
  }

  const contactMap = new Map<string, any>();
  const nameToIdMap = new Map<string, string>();

  // 1. Index all masterContacts
  (masterContacts || []).forEach(c => {
    const cId = c.contactId || c.id || c.originalDocId;
    const fullName = c.fullName || `${c.contactNombre || ''} ${c.contactApellido || ''}`.trim() || cId;
    const norm = normalizeName(fullName);

    const initialSizing = {
      ...(c.sizingMatrix12PtCM || {}),
      ...(c.sizingMatrix || {}),
      ...(c.measurements || {})
    };

    const contactObj = {
      ...c,
      contactId: cId,
      originalDocId: c.originalDocId || c.id || c.contactId,
      fullName,
      role: c.role ? c.role : (c.accountId === 'ACC-001' || (c.companyName && String(c.companyName).toUpperCase().includes('UDI'))) ? 'ESTUDIANTE' : (c.accountId === 'ACC-000' || !c.accountId) ? 'PARTICULAR' : 'OTRO',
      accountId: c.accountId || 'ACC-000',
      phone: c.phone || '',
      email: c.email || '',
      sizingMatrix: initialSizing,
      sizingMatrix12PtCM: initialSizing
    };

    contactMap.set(cId, contactObj);
    if (norm) {
      nameToIdMap.set(norm, cId);
    }
  });

  // 2. Scan and aggregate from Orders (metrics + measurements + synthesized contacts)
  (orders || []).forEach(order => {
    const clientName = (order.client || order.clientName || order.contactPerson || order.customerName || '').trim();
    const orderContactId = order.contactId;
    const normName = normalizeName(clientName);
    const orderMeasurements = extractItemMeasurements(order);

    let targetContactId = orderContactId && contactMap.has(orderContactId)
      ? orderContactId
      : (normName ? nameToIdMap.get(normName) : null);

    if (targetContactId && contactMap.has(targetContactId)) {
      const contact = contactMap.get(targetContactId);
      // Merge measurements (existing explicit measurements have priority, but order fills gaps)
      const mergedSizing = {
        ...orderMeasurements,
        ...(contact.sizingMatrix || {})
      };
      contact.sizingMatrix = mergedSizing;
      contact.sizingMatrix12PtCM = mergedSizing;

      // Fill in phone/email/account if missing
      if (!contact.phone && order.phone) contact.phone = order.phone;
      if (!contact.email && order.email) contact.email = order.email;
      if ((!contact.accountId || contact.accountId === 'ACC-000') && order.accountId) {
        contact.accountId = order.accountId;
      }
    } else if (clientName && !nameToIdMap.has(normName)) {
      // Synthesize new contact from historical order
      const synthId = `CON-ORD-${normName.replace(/\s+/g, '-').slice(0, 14).toUpperCase()}`;
      const synthContact = {
        contactId: synthId,
        originalDocId: null, // Legacy / Inherited marker
        fullName: clientName,
        role: order.role || 'PARTICULAR',
        accountId: order.accountId || 'ACC-000',
        phone: order.phone || '',
        email: order.email || '',
        sizingMatrix: orderMeasurements,
        sizingMatrix12PtCM: orderMeasurements
      };
      contactMap.set(synthId, synthContact);
      nameToIdMap.set(normName, synthId);
    }
  });

  return Array.from(contactMap.values());
};


export const TAILORING_12_POINTS = [
  { key: 'F_Hombros', alt: 'hombros', label: 'Hombros', group: 'filipina' },
  { key: 'F_Cuello', alt: 'cuello', label: 'Cuello', group: 'filipina' },
  { key: 'F_Largo_Brazo', alt: 'largoBrazo', label: 'Largo Brazo', group: 'filipina' },
  { key: 'F_Ancho_Brazo', alt: 'anchoBrazo', label: 'Ancho Brazo', group: 'filipina' },
  { key: 'F_Ancho_Torso', alt: 'anchoTorso', label: 'Ancho Torso', group: 'filipina' },
  { key: 'F_Largo_Torso', alt: 'largoTorso', label: 'Largo Torso', group: 'filipina' },
  { key: 'F_Cintura', alt: 'cintura', label: 'Cintura (Filipina)', group: 'filipina' },
  { key: 'F_Cadera', alt: 'cadera', label: 'Cadera (Filipina)', group: 'filipina' },
  { key: 'P_Cintura', alt: 'cintura', label: 'Cintura (Pantalón)', group: 'pantalon' },
  { key: 'P_Cadera', alt: 'cadera', label: 'Cadera (Pantalón)', group: 'pantalon' },
  { key: 'P_Ancho_Pierna', alt: 'anchoPierna', label: 'Ancho Pierna', group: 'pantalon' },
  { key: 'P_Largo_Pierna', alt: 'largoPierna', label: 'Largo Pierna', group: 'pantalon' }
];