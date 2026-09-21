import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, DocumentData } from 'firebase-admin/firestore';
import fs from 'fs';

interface OrderItem {
  quantity: number;
  type: string;
}

interface OrderData extends DocumentData {
  docType?: string;
  status?: string;
  id?: string;
  amountCollected?: string | number;
  totalPrice?: string | number;
  items?: any[];
  client?: string;
  clientName?: string;
  contactPerson?: string;
  customer?: string;
  customerFirstName?: string;
  customerLastName?: string;
  fullName?: string;
  contactNombre?: string;
  productionStatus?: string;
  shippingDetails?: {
    city?: string;
  };
  deliveryCity?: string;
  createdAt?: string | number;
  date?: string;
  sellerName?: string;
  sellerEmail?: string;
}

interface ContactData extends DocumentData {
  accountId?: string;
  fullName?: string;
  contactNombre?: string;
  contactApellido?: string;
  role?: string;
  phone?: string;
}

interface AccountData extends DocumentData {
  accountId?: string;
  companyName?: string;
  accountName?: string;
}

// Helper to determine order/quote
const getDocType = (o: OrderData) => 
  o.docType || (o.status === 'Cotización' || o.status === 'Estimado' || o.id?.startsWith('COT-') ? 'COTIZACION' : 'ORDEN');

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  // We define it as a basic Record to allow checking properties safely
  let firebaseConfig: Record<string, string> | null = null;
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8')) as Record<string, string>;
  } catch (e) {
    console.warn("Could not load firebase-applet-config.json");
  }

  if (!getApps().length && firebaseConfig && typeof firebaseConfig.projectId === 'string') {
    initializeApp({ projectId: firebaseConfig.projectId });
  }

  const PULSE_KEY = process.env.AZAFRAN_PULSE_KEY || 'AZAFRAN_PULSE_2026';

  app.get('/api/pulse', async (req, res) => {
    const key = req.query['x-pulse-key'] || req.headers['x-pulse-key'];
    if (key !== PULSE_KEY) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!firebaseConfig || !firebaseConfig.firestoreDatabaseId) {
      res.status(500).json({ error: 'Firebase configuration not found on server' });
      return;
    }

    try {
      const db = getFirestore(firebaseConfig.firestoreDatabaseId);
      const entity = req.query.entity as string;

      if (entity === 'summary') {
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

        res.json({ 
          totalActiveOrders, 
          totalQuotes, 
          totalAmountCollected, 
          totalPendingBalance, 
          timestamp: Date.now() 
        });
        return;
      }

      if (entity === 'reports') {
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

        res.json({
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
        });
        return;
      }

      if (entity === 'sellers') {
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

        const sellers = Array.from(sellersMap.values()).map(s => {
          const total = s.confirmedOrders + s.totalQuotes;
          return {
            ...s,
            conversionRate: total > 0 ? (s.confirmedOrders / total) * 100 : 0
          };
        });

        res.json(sellers);
        return;
      }

      if (entity === 'bottlenecks') {
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

        res.json({
          stalledMaterialOrders,
          deliveryRiskOrders,
          uncollectedBalanceOrders,
          dataAnomalies
        });
        return;
      }

      if (entity === 'orders') {
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
        
        res.json(activeOrders);
        return;
      }

      if (entity === 'quotes') {
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
        
        res.json(activeQuotes);
        return;
      }

      if (entity === 'directory') {
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

        res.json(directory);
        return;
      }

      res.status(400).json({ error: 'Invalid entity' });
    } catch (error: unknown) {
      console.error("Pulse API Error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/api/action/:actionType', async (req, res) => {
    const key = req.query['x-pulse-key'] || req.headers['x-pulse-key'] || req.query.key;
    if (key !== PULSE_KEY) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!firebaseConfig || !firebaseConfig.firestoreDatabaseId) {
      res.status(500).json({ error: 'Firebase configuration not found on server' });
      return;
    }

    const actionType = req.params.actionType;
    const db = getFirestore(firebaseConfig.firestoreDatabaseId);

    try {
      if (actionType === 'revert-order') {
        const { orderId } = req.body;
        if (!orderId) {
          res.status(400).json({ error: 'orderId is required' });
          return;
        }
        await db.collection('orders').doc(orderId).update({
          status: 'Cotización',
          docType: 'quote',
          updatedAt: Date.now()
        });
        res.json({ success: true, orderId, message: "Order successfully reverted to quotation" });
        return;
      }

      if (actionType === 'delete-quote') {
        const { quoteId } = req.body;
        if (!quoteId) {
          res.status(400).json({ error: 'quoteId is required' });
          return;
        }
        await db.collection('orders').doc(quoteId).delete();
        res.json({ success: true, quoteId, message: "Quote removed successfully" });
        return;
      }

      if (actionType === 'merge-contacts') {
        const { sourceContactId, targetContactId } = req.body;
        if (!sourceContactId || !targetContactId) {
          res.status(400).json({ error: 'sourceContactId and targetContactId are required' });
          return;
        }

        const ordersSnap = await db.collection('orders').where('contactId', '==', sourceContactId).get();
        const batch = db.batch();

        ordersSnap.docs.forEach(doc => {
          batch.update(doc.ref, { contactId: targetContactId, updatedAt: Date.now() });
        });

        batch.delete(db.collection('masterContacts').doc(sourceContactId));

        await batch.commit();
        res.json({ success: true, sourceContactId, targetContactId, message: "Contacts merged successfully" });
        return;
      }

      if (actionType === 'create-quote') {
        const quoteData = req.body;
        if (!quoteData || !quoteData.items || !quoteData.customer) {
          res.status(400).json({ error: 'customer and items are required' });
          return;
        }

        const newQuoteRef = db.collection('orders').doc();
        await newQuoteRef.set({
          ...quoteData,
          status: 'Cotización',
          docType: 'quote',
          createdAt: Date.now(),
          id: newQuoteRef.id
        });
        res.json({ success: true, quoteId: newQuoteRef.id, message: "Quote created successfully" });
        return;
      }

      res.status(400).json({ error: 'Invalid action type' });
    } catch (error: unknown) {
      console.error(`Action Error [${actionType}]:`, error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
