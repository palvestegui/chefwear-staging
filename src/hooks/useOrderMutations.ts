import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getNextSequentialCancellationId } from '../utils/sequenceUtils';

export const useOrderMutations = (
  orders: any[],
  cancelActiveOrderModal?: any,
  cancelQuoteModal?: any,
  cancelResolutionType?: string,
  cancelPartialRefund?: number,
  cancelJustification?: string,
  cancelQuoteReason?: string,
  setCancelActiveOrderModal?: (val: any) => void,
  setCancelQuoteModal?: (val: any) => void,
  setCancelJustification?: (val: string) => void,
  setCancelPartialRefund?: (val: number) => void,
  setCancelResolutionType?: (val: string) => void,
  setConfirmDeleteId?: (val: string | null) => void,
  setViewingCancellationVoucherId?: (val: string | null) => void
) => {
  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const updateData: any = {
        status: newStatus,
        updatedAt: Date.now(),
        [`timestamps.${newStatus}`]: Date.now()
      };
      if (newStatus === 'En Confección' || newStatus === 'En Producción') {
        updateData.productionStatus = 'En Confección';
      } else if (newStatus === 'Producido') {
        updateData.productionStatus = 'Producido';
      } else if (newStatus === 'Material Listo') {
        updateData.productionStatus = 'Material Listo';
      }
      await updateDoc(orderRef, updateData);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'orders');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      if (setConfirmDeleteId) setConfirmDeleteId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'orders');
    }
  };

  const handleReactivateQuote = async (order: any) => {
    const orderId = typeof order === 'string' ? order : order?.id;
    if (!orderId) return;
    try {
      await updateDoc(doc(db, 'orders', orderId), { 
        status: 'Cotización', 
        updatedAt: Date.now() 
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'orders');
    }
  };

  const handleConfirmCancelQuote = async () => {
    const quoteId = cancelQuoteModal?.quoteId || cancelQuoteModal?.order?.id;
    if (!quoteId) return;
    try {
      const cancellationId = await getNextSequentialCancellationId();
      await updateDoc(doc(db, 'orders', quoteId), {
        status: 'Anulado',
        cancellationDate: Date.now(),
        cancellationReason: cancelQuoteReason || 'Presupuesto Alto',
        cancellationId: cancellationId,
        resolutionType: 'Sin Cobro Realizado',
        refundAmount: 0,
        updatedAt: Date.now()
      });
      if (setCancelQuoteModal) setCancelQuoteModal(null);
      if (setViewingCancellationVoucherId) setViewingCancellationVoucherId(quoteId);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'orders');
    }
  };

  const handleConfirmCancelActiveOrder = async () => {
    const orderId = cancelActiveOrderModal?.orderId || cancelActiveOrderModal?.order?.id;
    if (!orderId) return;
    try {
      const cancellationId = await getNextSequentialCancellationId();
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'Anulado',
        cancellationDate: Date.now(),
        cancellationReason: cancelJustification || 'Cancelación de Orden Activa',
        cancellationId: cancellationId,
        cancellationResolution: cancelResolutionType || 'Devolución Total',
        refundAmount: cancelPartialRefund || 0,
        updatedAt: Date.now()
      });
      if (setCancelActiveOrderModal) setCancelActiveOrderModal(null);
      if (setCancelJustification) setCancelJustification('');
      if (setCancelPartialRefund) setCancelPartialRefund(0);
      if (setCancelResolutionType) setCancelResolutionType('Devolución Total');
      if (setViewingCancellationVoucherId) setViewingCancellationVoucherId(orderId);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'orders');
    }
  };

  return {
    updateStatus,
    handleDeleteOrder,
    handleReactivateQuote,
    handleConfirmCancelQuote,
    handleConfirmCancelActiveOrder
  };
};
