import { db } from './adminDb';

export interface OrderData {
  status?: string;
  docType?: string;
  totalPrice?: number | string;
  amountCollected?: number | string;
  createdAt?: number | string | Date;
  date?: number | string | Date;
  items?: any[];
  customer?: string;
  customerFirstName?: string;
  customerLastName?: string;
  clientName?: string;
  fullName?: string;
  contactNombre?: string;
  sellerName?: string;
  sellerEmail?: string;
  productionStatus?: string;
  shippingDetails?: { city?: string };
  deliveryCity?: string;
  contactId?: string;
  id?: string;
}

export interface ContactData {
  fullName?: string;
  contactNombre?: string;
  contactApellido?: string;
  accountId?: string;
  role?: string;
  phone?: string;
}

export interface AccountData {
  accountId?: string;
  companyName?: string;
  accountName?: string;
}

export const getDocType = (o: OrderData) => 
  o.docType || (o.status === 'Cotización' || o.status === 'Estimado' || o.id?.startsWith('COT-') ? 'COTIZACION' : 'ORDEN');

export async function getSummaryData() {
  const ordersSnap = await db.collection('orders').get();
  let totalActiveOrders = 0;
  let totalQuotes = 0;
  let totalAmountCollected = 0;
  let totalPendingBalance = 0;

  ordersSnap.docs.forEach((doc) => {
    const data = doc.data() as OrderData;
    const type = getDocType(data);
    const status = data.status || '';
    
    if (type === 'ORDEN' && !['Entregado', 'Cancelado', 'Anulado'].includes(status)) {
      totalActiveOrders++;
      const collected = Number(data.amountCollected) || 0;
      const total = Number(data.totalPrice) || 0;
      totalAmountCollected += collected;
      totalPendingBalance += Math.max(0, total - collected);
    } else if (type === 'COTIZACION' && !['Expirado', 'Cancelado'].includes(status)) {
      totalQuotes++;
    }
  });

  return { totalActiveOrders, totalQuotes, totalAmountCollected, totalPendingBalance, timestamp: Date.now() };
}

export async function getReportsData() {
  const ordersSnap = await db.collection('orders').get();
  let totalOrders = 0;
  let confirmedOrders = 0;
  let quoteCount = 0;
  let totalConfirmedRevenue = 0;
  let totalCollected = 0;
  let totalPendingBalance = 0;

  const garmentMap = new Map<string, { qty: number; revenue: number }>();
  const categoryMap = new Map<string, number>();

  ordersSnap.docs.forEach((doc) => {
    const data = doc.data() as OrderData;
    const type = getDocType(data);
    const status = data.status || '';
    
    if (type === 'ORDEN' && !['Cancelado', 'Anulado'].includes(status)) {
      totalOrders++;
      confirmedOrders++;
      const total = Number(data.totalPrice) || 0;
      const collected = Number(data.amountCollected) || 0;
      totalConfirmedRevenue += total;
      totalCollected += collected;
      totalPendingBalance += Math.max(0, total - collected);

      if (Array.isArray(data.items)) {
        data.items.forEach((i: any) => {
          const qty = Number(i.qty ?? i.quantity) || 1;
          const price = Number(i.price ?? i.unitPrice) || 0;
          const revenue = qty * price;
          const name = i.name ?? i.garmentName ?? i.title ?? 'Prenda';
          const cat = i.category ?? i.fabric ?? 'Sin categoría';

          if (!garmentMap.has(name)) {
            garmentMap.set(name, { qty: 0, revenue: 0 });
          }
          const g = garmentMap.get(name)!;
          g.qty += qty;
          g.revenue += revenue;

          categoryMap.set(cat, (categoryMap.get(cat) || 0) + revenue);
        });
      }
    } else if (type === 'COTIZACION' && !['Expirado', 'Cancelado'].includes(status)) {
      totalOrders++;
      quoteCount++;
    }
  });

  const topGarments = Array.from(garmentMap.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.revenue - a.revenue);

  const categoryRevenue = Object.fromEntries(categoryMap.entries());

  return {
    totalOrders,
    confirmedOrders,
    quoteCount,
    totalConfirmedRevenue,
    totalCollected,
    totalPendingBalance,
    collectionRate: totalConfirmedRevenue > 0 ? (totalCollected / totalConfirmedRevenue) * 100 : 0,
    averageTicket: confirmedOrders > 0 ? totalConfirmedRevenue / confirmedOrders : 0,
    topGarments,
    categoryRevenue
  };
}

export async function getSellersData() {
  const ordersSnap = await db.collection('orders').get();
  const sellersMap = new Map<string, any>();

  ordersSnap.docs.forEach((doc) => {
    const data = doc.data() as OrderData;
    const type = getDocType(data);
    const status = data.status || '';
    const seller = data.sellerName || data.sellerEmail || 'Sin Asignar';

    if (!sellersMap.has(seller)) {
      sellersMap.set(seller, {
        sellerName: seller,
        totalQuotes: 0,
        confirmedOrders: 0,
        totalSalesRevenue: 0,
        totalAmountCollected: 0
      });
    }
    const s = sellersMap.get(seller)!;

    if (type === 'ORDEN' && !['Cancelado', 'Anulado'].includes(status)) {
      s.confirmedOrders++;
      s.totalSalesRevenue += Number(data.totalPrice) || 0;
      s.totalAmountCollected += Number(data.amountCollected) || 0;
    } else if (type === 'COTIZACION' && !['Expirado', 'Cancelado'].includes(status)) {
      s.totalQuotes++;
    }
  });

  return Array.from(sellersMap.values()).map(s => {
    const total = s.confirmedOrders + s.totalQuotes;
    return {
      ...s,
      conversionRate: total > 0 ? (s.confirmedOrders / total) * 100 : 0
    };
  });
}

export async function getBottlenecksData() {
  const ordersSnap = await db.collection('orders').get();
  const stalledMaterialOrders: any[] = [];
  const deliveryRiskOrders: any[] = [];
  const uncollectedBalanceOrders: any[] = [];
  const dataAnomalies: any[] = [];

  const now = Date.now();
  const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
  const FIFTEEN_BUSINESS_DAYS_APPROX = 15 * 24 * 60 * 60 * 1000;

  ordersSnap.docs.forEach((doc) => {
    const data = doc.data() as OrderData;
    const type = getDocType(data);
    const status = data.status || '';

    if (type === 'ORDEN' && !['Entregado', 'Cancelado', 'Anulado'].includes(status)) {
      const customer = data.customer || [data.customerFirstName, data.customerLastName].filter(Boolean).join(' ') || data.clientName || data.fullName || data.contactNombre || 'Cliente';
      const total = Number(data.totalPrice) || 0;
      const collected = Number(data.amountCollected) || 0;
      const balance = total - collected;
      const createdAtMs = typeof data.createdAt === 'number' ? data.createdAt : (data.createdAt ? new Date(data.createdAt).getTime() : now);
      const timeSinceCreation = now - createdAtMs;

      const orderInfo = { orderId: doc.id, customer, status, productionStatus: data.productionStatus };

      if (status === 'Material Listo' && data.productionStatus === 'PENDING') {
        if (timeSinceCreation > FORTY_EIGHT_HOURS) {
          stalledMaterialOrders.push(orderInfo);
        }
      }

      if (timeSinceCreation > FIFTEEN_BUSINESS_DAYS_APPROX) {
        deliveryRiskOrders.push(orderInfo);
      }

      if (['Producido', 'Material Listo'].includes(status) && balance > 0) {
        uncollectedBalanceOrders.push({ ...orderInfo, balance });
      }

      if (collected > total) {
        dataAnomalies.push({ ...orderInfo, issue: 'Overcollected', total, collected });
      } else if (balance < 0) {
        dataAnomalies.push({ ...orderInfo, issue: 'Negative Balance', total, collected });
      }
    }
  });

  return {
    stalledMaterialOrders,
    deliveryRiskOrders,
    uncollectedBalanceOrders,
    dataAnomalies
  };
}

export async function getOrdersData() {
  const ordersSnap = await db.collection('orders').get();
  const activeOrders: Record<string, unknown>[] = [];
  
  ordersSnap.docs.forEach((doc) => {
    const data = doc.data() as OrderData;
    const type = getDocType(data);
    const status = data.status || '';
    
    if (type === 'ORDEN' && !['Entregado', 'Cancelado', 'Anulado'].includes(status)) {
      const collected = Number(data.amountCollected) || 0;
      const total = Number(data.totalPrice) || 0;
      const balance = Math.max(0, total - collected);
      
      const customer = data.customer || [data.customerFirstName, data.customerLastName].filter(Boolean).join(' ') || data.clientName || data.fullName || data.contactNombre || 'Cliente';
      const itemsSummary = Array.isArray(data.items) && data.items.length > 0
        ? data.items.map((i: any) => `${i.qty ?? i.quantity ?? 1}x ${i.name ?? i.garmentName ?? i.title ?? 'Prenda'}`).join(', ')
        : 'Sin prendas';

      activeOrders.push({
        orderId: doc.id,
        customer,
        itemsSummary,
        status,
        productionStatus: data.productionStatus || 'PENDING',
        totalPrice: total,
        amountCollected: collected,
        balance,
        deliveryCity: data.shippingDetails?.city || data.deliveryCity || ''
      });
    }
  });
  
  return activeOrders;
}

export async function getQuotesData() {
  const ordersSnap = await db.collection('orders').get();
  const activeQuotes: Record<string, unknown>[] = [];
  
  ordersSnap.docs.forEach((doc) => {
    const data = doc.data() as OrderData;
    const type = getDocType(data);
    const status = data.status || '';
    
    if (type === 'COTIZACION' && !['Expirado', 'Cancelado'].includes(status)) {
      const customer = data.customer || [data.customerFirstName, data.customerLastName].filter(Boolean).join(' ') || data.clientName || data.fullName || data.contactNombre || 'Cliente';
      const itemsSummary = Array.isArray(data.items) && data.items.length > 0
        ? data.items.map((i: any) => `${i.qty ?? i.quantity ?? 1}x ${i.name ?? i.garmentName ?? i.title ?? 'Prenda'}`).join(', ')
        : 'Sin prendas';

      activeQuotes.push({
        quoteId: doc.id,
        customer,
        itemsSummary,
        totalPrice: Number(data.totalPrice) || 0,
        createdAt: data.createdAt || data.date || null
      });
    }
  });
  
  return activeQuotes;
}

export async function getDirectoryData() {
  const contactsSnap = await db.collection('masterContacts').get();
  const accountsSnap = await db.collection('clientAccounts').get();
  
  const accountsMap = new Map<string, string>();
  accountsSnap.docs.forEach((doc) => {
    const d = doc.data() as AccountData;
    accountsMap.set(d.accountId || doc.id, d.companyName || d.accountName || '');
  });

  const directory: Record<string, unknown>[] = [];
  contactsSnap.docs.forEach((doc) => {
    const data = doc.data() as ContactData;
    const companyName = accountsMap.get(data.accountId || '') || '';
    
    directory.push({
      contactId: doc.id,
      fullName: data.fullName || `${data.contactNombre || ''} ${data.contactApellido || ''}`.trim(),
      companyName,
      role: data.role || 'PARTICULAR',
      phone: data.phone || ''
    });
  });

  return directory;
}

export async function handleActionRevertOrder(orderId: string) {
  await db.collection('orders').doc(orderId).update({
    status: 'Cotización',
    docType: 'quote',
    updatedAt: Date.now()
  });
  return { success: true, orderId, message: "Order successfully reverted to quotation" };
}

export async function handleActionDeleteQuote(quoteId: string) {
  await db.collection('orders').doc(quoteId).delete();
  return { success: true, quoteId, message: "Quote removed successfully" };
}

export async function handleActionMergeContacts(sourceContactId: string, targetContactId: string) {
  const ordersSnap = await db.collection('orders').where('contactId', '==', sourceContactId).get();
  const batch = db.batch();

  ordersSnap.docs.forEach(doc => {
    batch.update(doc.ref, { contactId: targetContactId, updatedAt: Date.now() });
  });

  batch.delete(db.collection('masterContacts').doc(sourceContactId));

  await batch.commit();
  return { success: true, sourceContactId, targetContactId, message: "Contacts merged successfully" };
}

export async function handleActionCreateQuote(quoteData: any) {
  // Clean up the test doc if present
  await db.collection('orders').doc('TqRQj6ZTKGykmMVt4bUK').delete().catch(() => {});

  const year = new Date().getFullYear();
  let nextId = `COT-${year}-0001`;
  
  const quotesSnap = await db.collection('orders')
    .where('id', '>=', 'COT-')
    .where('id', '<=', 'COT-\uf8ff')
    .orderBy('id', 'desc')
    .limit(1)
    .get();
  
  if (!quotesSnap.empty) {
    const lastId = quotesSnap.docs[0].data().id;
    if (lastId && typeof lastId === 'string' && lastId.startsWith(`COT-${year}-`)) {
      const numPart = parseInt(lastId.substring(9), 10);
      if (!isNaN(numPart)) {
        nextId = `COT-${year}-${String(numPart + 1).padStart(4, '0')}`;
      }
    } else if (lastId && typeof lastId === 'string' && lastId.startsWith('COT-')) {
        // Fallback if they have COT-XXXX format without year
        const numPart = parseInt(lastId.substring(4), 10);
        if (!isNaN(numPart)) {
            nextId = `COT-${year}-${String(numPart + 1).padStart(4, '0')}`;
        }
    }
  }

  const now = Date.now();
  const totalPrice = Number(quoteData.totalPrice) || 0;

  const newQuote = {
    orderId: nextId,
    id: nextId,
    customer: quoteData.customer,
    phone: quoteData.phone || '',
    email: quoteData.email || '',
    companyName: quoteData.companyName || 'Cliente Particular',
    items: quoteData.items || [],
    totalPrice: totalPrice,
    amountCollected: 0,
    balance: totalPrice,
    status: 'Cotización',
    docType: 'COTIZACION',
    category: 'Cotizaciones',
    notes: quoteData.notes || '',
    sellerName: quoteData.sellerName || 'Pablo Alvestegui',
    createdAt: now,
    updatedAt: now,
  };

  await db.collection('orders').doc(nextId).set(newQuote);

  return { success: true, quoteId: nextId, documentId: nextId, message: "Quote created successfully", data: newQuote };
}
