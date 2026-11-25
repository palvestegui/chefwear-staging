import { useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, setDoc, increment, deleteField } from 'firebase/firestore';
import { compressImage } from '../utils/imageUtils';
import { showSuccessToast } from '../utils/toastUtils';
import { getDocType } from '../utils/constants';
import { getNextSequentialOrderId } from '../utils/sequenceUtils';
import { AuthUserProfile, Order, OrderItem } from '../types';
import { DiscountEngineResult } from '../utils/pricingCalculator';
import {
  migrateQuoteSubcollections,
  normalizePaymentHistory,
  OrderDocWithLegacyReceipt,
} from '../utils/financeHelpers';

type UserRoleLike = AuthUserProfile & { displayName?: string };

export const useFinanceActions = (
  userRoles: UserRoleLike | null | undefined,
  getOrderBreakdown: (
    items: OrderItem[],
    category?: string,
    paymentMethod?: string,
    manualDiscount?: number,
    clientType?: string,
    accountId?: string,
    migrationFlatDiscount?: number
  ) => DiscountEngineResult,
  setOrderToCollect: (order: Order | null) => void,
  setViewingInvoiceId: (id: string | null) => void,
  customGetNextSequentialOrderId?: () => Promise<string>
) => {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const getNextId = customGetNextSequentialOrderId || getNextSequentialOrderId;

  const convertToOrder = async (
    order: Order,
    collected: number,
    receiptBase64: string,
    paymentOptions?: { method?: string; note?: string; tendered?: number; change?: number }
  ) => {
    if (!order.id) return alert('Orden sin identificador');
    setIsProcessingPayment(true);
    try {
      const orderRef = doc(db, 'orders', order.id);
      const snap = await getDoc(orderRef);
      if (!snap.exists()) {
        setIsProcessingPayment(false);
        return alert('Orden no encontrada');
      }

      const compressedReceipt = await compressImage(receiptBase64);
      const currentOrder = snap.data() as OrderDocWithLegacyReceipt;
      const currentHistory = normalizePaymentHistory(currentOrder);

      const finalPaymentMethod = order.paymentMethod || currentOrder.paymentMethod || '50/50 - Adelantado/Entrega';
      const preservedManualDiscount =
        order.manualDiscount !== undefined ? order.manualDiscount : currentOrder.manualDiscount || 0;
      const itemsToCalculate = currentOrder.items || order.items || [];
      const categoryToUse =
        currentOrder.pricingTier ||
        currentOrder.category ||
        currentOrder.clientType ||
        order.pricingTier ||
        order.category ||
        order.clientType;

      const finalBreakdown = getOrderBreakdown(
        itemsToCalculate,
        categoryToUse,
        finalPaymentMethod,
        preservedManualDiscount,
        currentOrder.clientType || order.clientType,
        currentOrder.accountId || order.accountId,
        currentOrder.migrationFlatDiscount || order.migrationFlatDiscount || 0
      );

      const closerName = userRoles?.name || userRoles?.displayName || 'Pablo Alvestegui';
      const closerEmail = userRoles?.email || '';
      const closerUid = userRoles?.uid || userRoles?.id || '';
      const closerRole = userRoles?.role || 'SALES';

      const newPayment = {
        amount: collected,
        date: new Date().toISOString(),
        receipt: compressedReceipt,
        note:
          paymentOptions?.note ||
          (finalPaymentMethod === '100% Contado' ? 'Pago Total al Contado' : 'Confirmación (Abono 50%)'),
        method: paymentOptions?.method || (finalPaymentMethod.includes('Contado') ? 'Efectivo' : 'Transferencia'),
        sellerName: closerName,
        sellerUid: closerUid,
        recordedBy: closerName,
        tendered: paymentOptions?.tendered !== undefined ? paymentOptions.tendered : null,
        change: paymentOptions?.change !== undefined ? paymentOptions.change : null,
      };

      const quoteAuthor = currentOrder.sellerName || currentOrder.createdBy;
      const updates: Record<string, unknown> = {
        docType: 'ORDEN',
        status: 'Orden Activa',
        sellerName: closerName,
        sellerEmail: closerEmail,
        sellerUid: closerUid,
        sellerRole: closerRole,
        closedBy: closerName,
        closedById: closerUid,
        closedAt: Date.now(),
        ...(quoteAuthor ? { quoteCreatedBy: quoteAuthor } : {}),
        paymentMethod: finalPaymentMethod,
        totalPrice: finalBreakdown.total,
        manualDiscount: preservedManualDiscount,
        amountCollected: increment(collected),
        receipt: deleteField(),
        paymentHistory: [...currentHistory, newPayment],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        timestamps: { ...(currentOrder.timestamps || {}), 'Orden Activa': new Date().toISOString() },
      };

      let finalOrderId = order.id;

      if (order.id.startsWith('COT-') || getDocType(order) === 'COTIZACION') {
        finalOrderId = await getNextId();
        updates.convertedFromQuoteId = order.id;
        updates.convertedAt = Date.now();

        const rawOrderPayload = {
          ...currentOrder,
          ...updates,
          amountCollected: (currentOrder.amountCollected || 0) + collected,
        };
        const { receipt: _r, id: _id, docId: _d, _docId: _ud, ...cleanDataToSave } = rawOrderPayload;

        await setDoc(doc(db, 'orders', finalOrderId), { ...cleanDataToSave, id: finalOrderId });
        await migrateQuoteSubcollections(order.id, finalOrderId);
        await updateDoc(orderRef, {
          status: 'Convertido',
          convertedToOrderId: finalOrderId,
          updatedAt: Date.now(),
        });
      } else {
        await updateDoc(orderRef, updates);
      }

      setOrderToCollect(null);
      setViewingInvoiceId(finalOrderId);
      showSuccessToast('✓ ¡Orden convertida con éxito!');
    } catch (err) {
      console.error('Error al convertir orden:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const collectBalance = async (
    order: Order,
    extraAmount: number,
    receiptBase64: string,
    paymentOptions?: { method?: string; note?: string; isRefund?: boolean; tendered?: number; change?: number }
  ) => {
    if (!order.id) return alert('Orden sin identificador');
    setIsProcessingPayment(true);
    try {
      const orderRef = doc(db, 'orders', order.id);
      const snap = await getDoc(orderRef);
      if (!snap.exists()) {
        setIsProcessingPayment(false);
        return alert('Orden no encontrada');
      }

      let compressedReceipt: string | null = null;
      if (receiptBase64 && receiptBase64.startsWith('data:image')) {
        compressedReceipt = await compressImage(receiptBase64);
      } else if (receiptBase64) {
        compressedReceipt = receiptBase64;
      }

      const currentOrder = snap.data() as OrderDocWithLegacyReceipt;
      const currentHistory = normalizePaymentHistory(currentOrder);

      const defaultNote =
        extraAmount < 0
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
        change: paymentOptions?.change !== undefined ? paymentOptions.change : null,
      };

      const newTotalCollected = Math.max(0, (currentOrder.amountCollected || 0) + extraAmount);
      const totalDue = currentOrder.totalPrice || 0;

      const updates: Record<string, unknown> = {
        amountCollected: increment(extraAmount),
        paymentHistory: [...currentHistory, newPayment],
        updatedAt: Date.now(),
      };

      if (currentOrder.status !== 'Entregado' && newTotalCollected >= totalDue - 0.1) {
        updates.timestamps = { ...(currentOrder.timestamps || {}), 'Pagado Total': new Date().toISOString() };
      }

      await updateDoc(orderRef, updates);

      setOrderToCollect(null);
      alert(extraAmount < 0 ? '¡Vuelto / Devolución registrada con éxito!' : '¡Abono registrado con éxito!');
    } catch (err) {
      console.error('Error al registrar movimiento:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return { isProcessingPayment, convertToOrder, collectBalance };
};
