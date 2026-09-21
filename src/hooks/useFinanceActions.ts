import { useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, setDoc, deleteDoc, increment, deleteField, query, collection, where, getDocs } from 'firebase/firestore';
import { compressImage } from '../utils/imageUtils';
import { showSuccessToast } from '../utils/toastUtils';
import { getDocType } from '../utils/constants';
import { getNextSequentialOrderId } from '../utils/sequenceUtils';

export const useFinanceActions = (
  userRoles: any,
  getOrderBreakdown: (items: any[], category?: string, paymentMethod?: string, manualDiscount?: number, clientType?: string, accountId?: string, migrationFlatDiscount?: number) => any,
  setOrderToCollect: (order: any) => void,
  setViewingInvoiceId: (id: string | null) => void,
  customGetNextSequentialOrderId?: () => Promise<string>
) => {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const getNextId = customGetNextSequentialOrderId || getNextSequentialOrderId;

  const convertToOrder = async (
    order: any, 
    collected: number, 
    receiptBase64: string,
    paymentOptions?: {
      method?: string;
      note?: string;
      tendered?: number;
      change?: number;
    }
  ) => {
    setIsProcessingPayment(true);
    try {
      const orderRef = doc(db, 'orders', order.id);
      const snap = await getDoc(orderRef);
      if (!snap.exists()) {
        setIsProcessingPayment(false);
        return alert('Orden no encontrada');
      }

      const compressedReceipt = await compressImage(receiptBase64);
      const currentOrder = snap.data();
        
      let currentHistory = Array.isArray(currentOrder.paymentHistory) ? currentOrder.paymentHistory : [];
      if (currentHistory.length === 0 && (currentOrder.amountCollected || 0) > 0) {
        currentHistory = [{
          amount: currentOrder.amountCollected,
          date: currentOrder.timestamps?.['Estimado'] || new Date(currentOrder.createdAt).toISOString(),
          note: 'Cobro Inicial (Auto)',
          receipt: currentOrder.receipt || null
        }];
      }

      let historySize = JSON.stringify(currentHistory).length;
      if (historySize > 500000) {
        currentHistory = currentHistory.map(h => ({ ...h, receipt: h.receipt ? 'Recibo omitido por tamaño' : null }));
      }

      const finalPaymentMethod = order.paymentMethod || currentOrder.paymentMethod || '50/50 - Adelantado/Entrega';
      const preservedManualDiscount = order.manualDiscount !== undefined ? order.manualDiscount : (currentOrder.manualDiscount || 0);
      const itemsToCalculate = currentOrder.items || order.items || [];
      const categoryToUse = currentOrder.pricingTier || currentOrder.category || currentOrder.clientType || order.pricingTier || order.category || order.clientType;
      const clientTypeToUse = currentOrder.clientType || order.clientType;

      const finalBreakdown = getOrderBreakdown(
        itemsToCalculate,
        categoryToUse,
        finalPaymentMethod,
        preservedManualDiscount,
        clientTypeToUse,
        currentOrder.accountId || order.accountId,
        currentOrder.migrationFlatDiscount || order.migrationFlatDiscount || 0
      );
      const finalTotalPrice = finalBreakdown.total;

      // The CLOSER is the person who closes the sale and collects the confirmation payment.
      // Sales and commissions are strictly attributed to the closer.
      const closerName = userRoles?.name || userRoles?.displayName || 'Pablo Alvestegui';
      const closerEmail = userRoles?.email || '';
      const closerUid = userRoles?.uid || userRoles?.id || '';
      const closerRole = userRoles?.role || 'SALES';

      const newPayment = { 
        amount: collected, 
        date: new Date().toISOString(), 
        receipt: compressedReceipt, 
        note: paymentOptions?.note || (finalPaymentMethod === '100% Contado' ? 'Pago Total al Contado' : 'Confirmación (Abono 50%)'),
        method: paymentOptions?.method || (finalPaymentMethod.includes('Contado') ? 'Efectivo' : 'Transferencia'),
        sellerName: closerName,
        sellerUid: closerUid,
        recordedBy: closerName,
        tendered: paymentOptions?.tendered !== undefined ? paymentOptions.tendered : null,
        change: paymentOptions?.change !== undefined ? paymentOptions.change : null
      };

      const updates: any = {
        docType: 'ORDEN',
        status: 'Orden Activa',
        sellerName: closerName,
        sellerEmail: closerEmail,
        sellerUid: closerUid,
        sellerRole: closerRole,
        closedBy: closerName,
        closedById: closerUid,
        closedAt: Date.now(),
        quoteCreatedBy: currentOrder.sellerName || currentOrder.createdBy || undefined,
        paymentMethod: finalPaymentMethod,
        totalPrice: finalTotalPrice,
        manualDiscount: preservedManualDiscount,
        amountCollected: increment(collected),
        receipt: deleteField(), 
        paymentHistory: [...currentHistory, newPayment],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        timestamps: { ...(currentOrder.timestamps || {}), 'Orden Activa': new Date().toISOString() }
      };

      let finalOrderId = order.id;

      if (order.id.startsWith('COT-') || getDocType(order) === 'COTIZACION') {
        finalOrderId = await getNextId();
          
        updates.convertedFromQuoteId = order.id;
        updates.convertedAt = Date.now();

        const rawOrderPayload = {
          ...currentOrder,
          ...updates,
          amountCollected: (currentOrder.amountCollected || 0) + collected
        };
        const { receipt, id, docId, _docId, ...cleanDataToSave } = rawOrderPayload;

        await setDoc(doc(db, 'orders', finalOrderId), cleanDataToSave);

        try {
          const itemsQ = query(collection(db, "orderItems"), where("orderId", "==", order.id));
          const itemsSnap = await getDocs(itemsQ);
          for (const itemDoc of itemsSnap.docs) {
            const itemData = itemDoc.data();
            const newItemId = itemDoc.id.replace("COT-", "ORD-");
            await setDoc(doc(db, "orderItems", newItemId), {
              ...itemData,
              orderId: finalOrderId,
              convertedFrom: itemDoc.id
            });
            await deleteDoc(itemDoc.ref);
          }
        } catch (itemErr) {
          console.error("Error updating orderItems cascading refs:", itemErr);
        }

        try {
          const modifiersQ = query(collection(db, "orderModifiers"), where("orderId", "==", order.id));
          const modifiersSnap = await getDocs(modifiersQ);
          for (const modDoc of modifiersSnap.docs) {
            const modData = modDoc.data();
            const newModId = modDoc.id.replace("COT-", "ORD-");
            await setDoc(doc(db, "orderModifiers", newModId), {
              ...modData,
              orderId: finalOrderId,
              convertedFrom: modDoc.id
            });
            await deleteDoc(modDoc.ref);
          }
        } catch (modErr) {
          console.error("Error updating orderModifiers cascading refs:", modErr);
        }

        await deleteDoc(orderRef);
      } else {
        await updateDoc(orderRef, updates);
      }
        
      setOrderToCollect(null);
      setViewingInvoiceId(finalOrderId);
      showSuccessToast('✓ ¡Orden convertida con éxito!');
    } catch (err) {
      console.error("Error al convertir orden:", err);
      alert(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const collectBalance = async (
    order: any, 
    extraAmount: number, 
    receiptBase64: string, 
    paymentOptions?: { 
      method?: string; 
      note?: string; 
      isRefund?: boolean;
      tendered?: number;
      change?: number;
    }
  ) => {
    setIsProcessingPayment(true);
    try {
      const orderRef = doc(db, 'orders', order.id);
      const snap = await getDoc(orderRef);
      if (!snap.exists()) {
        setIsProcessingPayment(false);
        return alert('Orden no encontrada');
      }

      let compressedReceipt = null;
      if (receiptBase64 && receiptBase64.startsWith('data:image')) {
        compressedReceipt = await compressImage(receiptBase64);
      } else if (receiptBase64) {
        compressedReceipt = receiptBase64;
      }
      
      const currentOrder = snap.data();

      let currentHistory = Array.isArray(currentOrder.paymentHistory) ? currentOrder.paymentHistory : [];
      if (currentHistory.length === 0 && (currentOrder.amountCollected || 0) > 0) {
        currentHistory = [{
          amount: currentOrder.amountCollected,
          date: currentOrder.timestamps?.['Estimado'] || new Date(currentOrder.createdAt).toISOString(),
          note: 'Cobro Inicial (Auto)',
          receipt: currentOrder.receipt || null
        }];
      }

      let historySize = JSON.stringify(currentHistory).length;
      if (historySize > 500000) {
        currentHistory = currentHistory.map(h => ({ ...h, receipt: h.receipt ? 'Recibo omitido por tamaño' : null }));
      }

      const defaultNote = extraAmount < 0 
        ? 'Devolución / Vuelto Entregado al Cliente' 
        : `Abono/Saldo - Pago #${currentHistory.length + 1}`;

      const newPayment = {
        amount: extraAmount,
        date: new Date().toISOString(),
        receipt: compressedReceipt,
        note: paymentOptions?.note || defaultNote,
        method: paymentOptions?.method || (extraAmount < 0 ? 'Efectivo' : 'Transferencia'),
        sellerName: userRoles?.name || 'Pablo Alvestegui',
        sellerUid: userRoles?.uid || '',
        tendered: paymentOptions?.tendered !== undefined ? paymentOptions.tendered : null,
        change: paymentOptions?.change !== undefined ? paymentOptions.change : null
      };

      const newTotalCollected = Math.max(0, (currentOrder.amountCollected || 0) + extraAmount);
      const totalDue = currentOrder.totalPrice || 0;
      
      const updates: any = {
        amountCollected: increment(extraAmount),
        paymentHistory: [...currentHistory, newPayment],
        updatedAt: Date.now()
      };

      if (currentOrder.status !== 'Entregado' && newTotalCollected >= totalDue - 0.1) {
        updates.timestamps = { ...(currentOrder.timestamps || {}), 'Pagado Total': new Date().toISOString() };
      }

      await updateDoc(orderRef, updates);
      
      setOrderToCollect(null);
      alert(extraAmount < 0 ? '¡Vuelto / Devolución registrada con éxito!' : '¡Abono registrado con éxito!');
    } catch (err) {
      console.error("Error al registrar movimiento:", err);
      alert(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return {
    isProcessingPayment,
    convertToOrder,
    collectBalance
  };
};
