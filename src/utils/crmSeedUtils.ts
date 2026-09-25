import { doc, setDoc, Firestore } from 'firebase/firestore';

interface SeedUser {
  uid?: string;
}

interface SeedContact {
  id?: string;
  contactId?: string;
  originalDocId?: string;
  fullName?: string;
  contactNombre?: string;
  contactApellido?: string;
  role?: string;
  accountId?: string;
  status?: string;
}

/**
 * Seed initial accounts and master contact for UDI and Green House,
 * and relink historical contacts.
 */
export const runSeedUDI = async (
  db: Firestore | any,
  user: SeedUser | null | undefined,
  masterContacts: SeedContact[] = [],
  silent = false
): Promise<void> => {
  if (!db) {
    throw new Error('Base de datos no inicializada.');
  }

  const accData0 = {
    accountId: 'ACC-000',
    accountType: 'Particular / Individuo',
    accountName: 'Cliente Particular',
    parentAccountId: null,
    contactNombre: 'Particular',
    contactApellido: 'Independiente',
    phone: '',
    email: '',
    deliveryCity: 'Santa Cruz',
    deliveryAddress: '',
    deliveryNotes: 'Pedidos minoristas/independientes',
    logoEmbroidery: false,
    logoPlacements: [],
    logoFileLocation: '',
    pricingTier: 'Estándar Raleo',
    createdAt: Date.now(),
    createdBy: user?.uid || ''
  };
  await setDoc(doc(db, 'clientAccounts', 'ACC-000'), accData0, { merge: true });

  const accData = {
    accountId: 'ACC-001',
    accountType: 'Universidad/Instituto',
    accountName: 'Universidad UDI',
    parentAccountId: null,
    contactNombre: 'Matias',
    contactApellido: 'Peñaranda',
    phone: '690-53834',
    email: 'matiasranda@gmail.com',
    deliveryCity: 'Santa Cruz',
    deliveryAddress: 'Avenida Bánzer, entre 5o y 6o Anillo',
    deliveryNotes: 'Puerta principal',
    logoEmbroidery: true,
    logoPlacements: [
      'Gorro: centro de la frente',
      'Filipina: Pecho izquierdo',
      'Mandil: Centro del pecho',
      'Pantalón, pierna izquierda'
    ],
    logoFileLocation: 'F:\\Users\\pablo\\Desktop\\Escritorio\\Azafran Chefwear\\LOGOS CLIENTES',
    pricingTier: 'Contrato Institucional',
    createdAt: Date.now(),
    createdBy: user?.uid || ''
  };
  await setDoc(doc(db, 'clientAccounts', 'ACC-001'), accData);

  const accData2 = {
    accountId: 'ACC-002',
    accountType: 'Restaurant',
    accountName: 'Green House',
    parentAccountId: null,
    contactNombre: 'Para',
    contactApellido: 'Todos',
    phone: '',
    email: '',
    deliveryCity: 'Santa Cruz',
    deliveryAddress: '',
    deliveryNotes: '',
    logoEmbroidery: false,
    logoPlacements: [],
    logoFileLocation: '',
    pricingTier: 'Estándar B2B',
    createdAt: Date.now(),
    createdBy: user?.uid || ''
  };
  await setDoc(doc(db, 'clientAccounts', 'ACC-002'), accData2);

  const seedContactDoc = {
    contactId: 'CON-001',
    accountId: 'ACC-001',
    contactNombre: 'Matias',
    contactApellido: 'Peñaranda',
    fullName: 'Matias Peñaranda',
    role: 'Estudiante',
    phone: '690-53834',
    email: 'matiasranda@gmail.com',
    status: 'ACTIVE',
    sizingMatrix12PtCM: {
      estatura: '175',
      peso: '70',
      pecho: '98',
      cintura: '84',
      cadera: '96',
      largoBrazo: '62',
      espalda: '44',
      cuello: '39'
    },
    sizingMatrix: {
      estatura: '175',
      peso: '70',
      pecho: '98',
      cintura: '84',
      cadera: '96',
      largoBrazo: '62',
      espalda: '44',
      cuello: '39'
    },
    createdAt: Date.now(),
    createdBy: user?.uid || ''
  };
  await setDoc(doc(db, 'masterContacts', 'CON-001'), seedContactDoc, { merge: true });

  let relinkedCount = 0;
  for (const c of masterContacts) {
    if (!c.accountId || c.accountId === 'Ninguna' || c.accountId === '' || c.accountId === 'null') {
      const text = `${c.fullName || ''} ${c.contactNombre || ''} ${c.contactApellido || ''} ${c.role || ''}`.toUpperCase();
      if (text.includes('UDI') || text.includes('PEÑARANDA') || text.includes('ESTUDIANTE')) {
        await setDoc(doc(db, 'masterContacts', c.originalDocId || c.contactId || c.id || ''), {
          accountId: 'ACC-001',
          role: c.role || 'Estudiante',
          status: c.status || 'ACTIVE'
        }, { merge: true });
        relinkedCount++;
      } else if (text.includes('GREEN HOUSE')) {
        await setDoc(doc(db, 'masterContacts', c.originalDocId || c.contactId || c.id || ''), {
          accountId: 'ACC-002',
          role: c.role || 'Personal',
          status: c.status || 'ACTIVE'
        }, { merge: true });
        relinkedCount++;
      }
    }
  }

  if (!silent) {
    alert(`Cuentas Semilla UDI / Green House creadas y sincronizadas.\n\n- Cuentas: ACC-001 (UDI), ACC-002 (Green House)\n- Contacto Maestro: CON-001 (Matias Peñaranda -> ACC-001)\n- Contactos Re-vinculados: ${relinkedCount}`);
  }
};
