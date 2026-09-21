import { doc, updateDoc, collection, getDocs, deleteField, Firestore } from 'firebase/firestore';

export interface UdiReconciliationSpec {
  orderNum: string;
  rawId: string;
  customerName: string;
  expectedTotal: number;
  expectedCollected: number;
  notes?: string;
}

export const UDI_RECONCILIATION_SPECS: UdiReconciliationSpec[] = [
  {
    orderNum: '#ORD-00021',
    rawId: 'ORD-1788533995246-669',
    customerName: 'Mariana Santos',
    expectedTotal: 253,
    expectedCollected: 253,
  },
  {
    orderNum: '#ORD-00022',
    rawId: 'ORD-1788534268408-593',
    customerName: 'Felipe Coronado',
    expectedTotal: 149,
    expectedCollected: 149,
  },
  {
    orderNum: '#ORD-00023',
    rawId: 'ORD-1788973360952-614',
    customerName: 'Georgina González',
    expectedTotal: 584,
    expectedCollected: 584,
    notes: 'Confirmado por boleta de transferencia bancaria de Bs 584',
  },
];

export interface ReconciliationResult {
  success: boolean;
  updatedCount: number;
  alreadyReconciledCount: number;
  messages: string[];
}

/**
 * Reconciles overcollected UDI orders in Firestore by setting totalPrice and amountCollected
 * to expected values and clearing any reconciliationNote field.
 */
export async function runUdiReconciliationPatch(db: Firestore): Promise<ReconciliationResult> {
  const result: ReconciliationResult = {
    success: true,
    updatedCount: 0,
    alreadyReconciledCount: 0,
    messages: [],
  };

  try {
    const ordersSnap = await getDocs(collection(db, 'orders'));

    for (const spec of UDI_RECONCILIATION_SPECS) {
      // Locate candidate document
      const matchingDocs = ordersSnap.docs.filter((d) => {
        const data = d.data();
        const docId = d.id;
        const dataId = typeof data.id === 'string' ? data.id : '';
        const legacyId = typeof data.legacyId === 'string' ? data.legacyId : '';
        const customer = typeof data.customer === 'string' ? data.customer.toLowerCase() : '';
        const targetCust = spec.customerName.toLowerCase();
        const nameParts = targetCust.split(' ').filter(Boolean);

        const matchesId =
          docId === spec.rawId ||
          docId === spec.orderNum ||
          docId === spec.orderNum.replace('#', '') ||
          dataId === spec.orderNum ||
          dataId === spec.rawId ||
          legacyId === spec.rawId;

        const matchesCustomer =
          customer.length > 0 &&
          nameParts.every((part) => customer.includes(part));

        return matchesId || matchesCustomer;
      });

      if (matchingDocs.length === 0) {
        result.messages.push(`No se encontró documento para ${spec.orderNum} (${spec.customerName})`);
        continue;
      }

      // Prioritize exact ID match if multiple candidates exist
      const targetDoc = matchingDocs.find((d) => {
        const docId = d.id;
        const data = d.data();
        const dataId = typeof data.id === 'string' ? data.id : '';
        const legacyId = typeof data.legacyId === 'string' ? data.legacyId : '';
        return (
          docId === spec.rawId ||
          docId === spec.orderNum ||
          dataId === spec.orderNum ||
          dataId === spec.rawId ||
          legacyId === spec.rawId
        );
      }) || matchingDocs[0];

      const docId = targetDoc.id;
      const data = targetDoc.data();
      const currentTotal = Number(data.totalPrice);
      const currentCollected = Number(data.amountCollected);
      const hasReconciliationNote = data.reconciliationNote !== undefined && data.reconciliationNote !== null && data.reconciliationNote !== '';

      const isAlreadyReconciled =
        currentTotal === spec.expectedTotal &&
        currentCollected === spec.expectedCollected &&
        !hasReconciliationNote;

      if (isAlreadyReconciled) {
        result.alreadyReconciledCount++;
        result.messages.push(`${spec.orderNum} (${spec.customerName}) ya reconciliado: Total Bs ${spec.expectedTotal}, Cobrado Bs ${spec.expectedCollected}, Saldo Bs 0.00.`);
        continue;
      }

      // MIGRATION OVERRIDE: Reconcile overcollected UDI order to clear anomaly and set balance to Bs 0.00
      await updateDoc(doc(db, 'orders', docId), {
        totalPrice: spec.expectedTotal,
        amountCollected: spec.expectedCollected,
        reconciliationNote: deleteField(),
        updatedAt: Date.now(),
      });

      result.updatedCount++;
      result.messages.push(`Reconciliado ${spec.orderNum} (${spec.customerName}): Total ajustado a Bs ${spec.expectedTotal}, Cobrado a Bs ${spec.expectedCollected}, reconciliationNote eliminada. Saldo: Bs 0.00.`);
    }
  } catch (error) {
    result.success = false;
    const msg = error instanceof Error ? error.message : String(error);
    result.messages.push(`Error ejecutando reconciliación: ${msg}`);
  }

  return result;
}
