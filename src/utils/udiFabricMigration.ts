import { doc, updateDoc, collection, getDocs, deleteField, Firestore } from 'firebase/firestore';
import { OrderItem } from '../types';

export interface FabricCorrectionSpec {
  orderNum: string;
  rawId: string;
  customerName: string;
  targetFabric: string;
  expectedTotal: number;
  expectedCollected: number;
  requiredGarment?: string;
}

export const UDI_CORRECTIONS: FabricCorrectionSpec[] = [
  {
    orderNum: '#ORD-00025',
    rawId: 'ORD-1789145786489-650',
    customerName: 'Liliana Montero',
    targetFabric: 'Drill de 8oz',
    expectedTotal: 253,
    expectedCollected: 200,
    requiredGarment: 'Filipina',
  },
  {
    orderNum: '#ORD-00024',
    rawId: 'ORD-1789145868176-152',
    customerName: 'Luciane Durán',
    targetFabric: 'Drill de 8oz',
    expectedTotal: 253,
    expectedCollected: 200,
  },
  {
    orderNum: '#ORD-00021',
    rawId: 'ORD-1788533995246-669',
    customerName: 'Mariana Santos',
    targetFabric: 'Drill de 6oz',
    expectedTotal: 253,
    expectedCollected: 253,
  },
];

export interface MigrationResult {
  success: boolean;
  updatedCount: number;
  alreadyCorrectCount: number;
  messages: string[];
}

export async function runUdiFabricMigration(db: Firestore): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    updatedCount: 0,
    alreadyCorrectCount: 0,
    messages: [],
  };

  try {
    const ordersSnap = await getDocs(collection(db, 'orders'));

    for (const spec of UDI_CORRECTIONS) {
      // Find all matching candidate documents by ID or customer name
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
        result.messages.push(`No se encontró el documento para ${spec.orderNum} (${spec.customerName})`);
        continue;
      }

      // If a required garment is specified (e.g. Filipina for Liliana Montero), disambiguate multiple orders
      let targetDoc = matchingDocs[0];
      if (spec.requiredGarment) {
        const garmentMatch = matchingDocs.find((d) => {
          const items = Array.isArray(d.data().items) ? (d.data().items as OrderItem[]) : [];
          return items.some((item) => {
            const name = typeof item.name === 'string' ? item.name.toLowerCase() : '';
            return name.includes(spec.requiredGarment!.toLowerCase());
          });
        });
        if (garmentMatch) {
          targetDoc = garmentMatch;
        }
      }

      const docId = targetDoc.id;
      const data = targetDoc.data();
      const currentItems = Array.isArray(data.items) ? (data.items as OrderItem[]) : [];

      let fabricUpdated = false;
      const updatedItems: OrderItem[] = currentItems.map((item) => {
        const name = typeof item.name === 'string' ? item.name.toLowerCase() : '';
        const isTargetItem =
          !spec.requiredGarment ||
          name.includes(spec.requiredGarment.toLowerCase());

        if (isTargetItem && item.fabric !== spec.targetFabric) {
          fabricUpdated = true;
          return {
            ...item,
            fabric: spec.targetFabric,
          };
        }
        return item;
      });

      // Fallback: if no garment filter matched, update first item
      if (!fabricUpdated && updatedItems.length > 0 && updatedItems[0].fabric !== spec.targetFabric) {
        fabricUpdated = true;
        updatedItems[0] = {
          ...updatedItems[0],
          fabric: spec.targetFabric,
        };
      }

      const currentTotal = Number(data.totalPrice);
      const currentCollected = Number(data.amountCollected);
      const needsFinancialSync = currentTotal !== spec.expectedTotal || currentCollected !== spec.expectedCollected;

      if (!fabricUpdated && !needsFinancialSync) {
        result.alreadyCorrectCount++;
        result.messages.push(`${spec.orderNum} (${spec.customerName}) ya cuenta con la tela ${spec.targetFabric} y montos correctos.`);
        continue;
      }

      await updateDoc(doc(db, 'orders', docId), {
        items: updatedItems,
        totalPrice: spec.expectedTotal,
        amountCollected: spec.expectedCollected,
        reconciliationNote: deleteField(),
        updatedAt: Date.now(),
      });

      result.updatedCount++;
      result.messages.push(`Actualizado ${spec.orderNum} (${spec.customerName}): Tela cambiada a "${spec.targetFabric}", Total: Bs ${spec.expectedTotal}, Cobrado: Bs ${spec.expectedCollected}.`);
    }

    // MIGRATION OVERRIDE: Patch Order #ORD-00018 (Sebas Bejarano) - remove conflicting "Manga larga", keeping "Manga 3/4"
    const sebasDocs = ordersSnap.docs.filter((d) => {
      const data = d.data();
      const docId = d.id;
      const dataId = typeof data.id === 'string' ? data.id : '';
      const customer = typeof data.customer === 'string' ? data.customer.toLowerCase() : '';
      return (
        docId === 'ORD-1788275936872-173' ||
        docId === 'ORD-00018' ||
        dataId === '#ORD-00018' ||
        dataId === 'ORD-00018' ||
        customer.includes('sebas bejarano') ||
        customer.includes('sebastian bejarano')
      );
    });

    for (const sebasDoc of sebasDocs) {
      const data = sebasDoc.data();
      const currentItems = Array.isArray(data.items) ? (data.items as OrderItem[]) : [];
      let itemUpdated = false;
      const updatedItems = currentItems.map((item) => {
        if (Array.isArray(item.services) && item.services.includes('Manga larga')) {
          itemUpdated = true;
          return {
            ...item,
            services: item.services.filter((s: string) => s !== 'Manga larga'),
          };
        }
        return item;
      });

      if (itemUpdated) {
        await updateDoc(doc(db, 'orders', sebasDoc.id), {
          items: updatedItems,
          updatedAt: Date.now(),
        });
        result.updatedCount++;
        result.messages.push(`Actualizado #ORD-00018 (Sebas Bejarano): Se removió el servicio en conflicto "Manga larga", conservando "Manga 3/4".`);
      } else {
        result.alreadyCorrectCount++;
        result.messages.push(`#ORD-00018 (Sebas Bejarano) ya no tiene servicios en conflicto.`);
      }
    }
  } catch (error) {
    result.success = false;
    const msg = error instanceof Error ? error.message : String(error);
    result.messages.push(`Error ejecutando migración: ${msg}`);
  }

  return result;
}
