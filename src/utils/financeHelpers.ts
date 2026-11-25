import { collection, deleteDoc, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Order, PaymentEntry } from '../types';

export type OrderDocWithLegacyReceipt = Order & {
  receipt?: string;
  docId?: string;
  _docId?: string;
};

export function normalizePaymentHistory(currentOrder: OrderDocWithLegacyReceipt): Array<Partial<PaymentEntry>> {
  let history: Array<Partial<PaymentEntry>> = Array.isArray(currentOrder.paymentHistory)
    ? currentOrder.paymentHistory
    : [];

  if (history.length === 0 && (currentOrder.amountCollected || 0) > 0) {
    history = [
      {
        amount: currentOrder.amountCollected,
        date: Number(currentOrder.timestamps?.['Estimado'] || currentOrder.createdAt || Date.now()),
        note: 'Cobro Inicial (Auto)',
        receipt: currentOrder.receipt || null,
      },
    ];
  }

  if (JSON.stringify(history).length > 500000) {
    history = history.map((h) => ({ ...h, receipt: h.receipt ? 'Recibo omitido por tamaño' : null }));
  }

  return history;
}

export async function migrateQuoteSubcollections(quoteId: string, finalOrderId: string): Promise<void> {
  const collectionsToMigrate = ['orderItems', 'orderModifiers'] as const;
  for (const colName of collectionsToMigrate) {
    try {
      const snap = await getDocs(query(collection(db, colName), where('orderId', '==', quoteId)));
      for (const entryDoc of snap.docs) {
        const newDocId = entryDoc.id.replace('COT-', 'ORD-');
        await setDoc(doc(db, colName, newDocId), {
          ...entryDoc.data(),
          orderId: finalOrderId,
          convertedFrom: entryDoc.id,
        });
        await deleteDoc(entryDoc.ref);
      }
    } catch (err) {
      console.error(`Error updating ${colName} cascading refs:`, err);
    }
  }
}
