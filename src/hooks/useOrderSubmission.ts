import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getNextSequentialQuoteId, getNextSequentialOrderId } from '../utils/sequenceUtils';
import { compressImage } from '../utils/imageUtils';
import { showSuccessToast } from '../utils/toastUtils';
import { determineNewOrderProductionStatus } from '../utils/orderUtils';
import { resolveSellerInfo } from '../utils/sellerUtils';
import { provisionInstitutionalContacts } from '../utils/institutionalOrderUtils';
import { ensureCorporateAccountExists, ensureContactExists } from '../utils/accountContactMutations';
import { normalizeRole } from '../utils/constants';
import {
  OrderSubmissionState,
  OrderSubmissionActions,
  OrderBreakdown,
  OrderPricingEngine,
  PaymentOptions
} from './useOrderSubmissionTypes';

export type {
  OrderSubmissionState,
  OrderSubmissionActions,
  OrderBreakdown,
  OrderPricingEngine,
  PaymentOptions
};

export const useOrderSubmission = (
  state: OrderSubmissionState,
  actions: OrderSubmissionActions,
  pricingEngine: OrderPricingEngine
) => {
  const { newOrder, orderHeaderMode, editingQuoteId, userProfile, user, setIsSubmitting, resetForm } = state;
  const { setShowNewOrder, setOrderToCollect, setManualAmount, setManualReceipt } = actions;
  const { getOrderBreakdown } = pricingEngine;

  const handleCreateOrder = async (
    e?: { preventDefault: () => void }, 
    paymentAmt?: string, 
    receiptBase64?: string | null, 
    paymentOptions?: PaymentOptions
  ) => {
    if (e && e.preventDefault) e.preventDefault();

    const currentCustomer = (newOrder.customer || '').trim();
    if (!currentCustomer) {
      alert('Por favor ingrese el nombre del cliente.');
      return;
    }

    if (!newOrder.items || newOrder.items.length === 0) {
      alert('Debe agregar al menos una prenda al pedido/cotización.');
      return;
    }

    setIsSubmitting(true);
    try {
      const breakdown = getOrderBreakdown(
        newOrder.items,
        newOrder.pricingTier || newOrder.category || newOrder.clientType,
        newOrder.paymentMethod,
        newOrder.manualDiscount,
        newOrder.clientType,
        newOrder.accountId,
        newOrder.migrationFlatDiscount || 0
      );
      const total = breakdown.total;

      // Clean item properties for Firestore
      const cleanItems = (newOrder.items || []).map((it: any) => {
        const itemCopy = { ...it };
        if (itemCopy.logoFile) delete itemCopy.logoFile;
        if (itemCopy.refImageFile) delete itemCopy.refImageFile;
        return itemCopy;
      });

      // Strict Seller Attribution Resolution
      const sellerInfo = resolveSellerInfo({
        userProfile,
        user,
        selectedSellerName: newOrder.sellerName,
        selectedSellerEmail: newOrder.sellerEmail,
        selectedSellerUid: newOrder.sellerUid
      });

      // Ensure corporate account is provisioned in clientAccounts with ACC-xxx
      let finalAccountId = newOrder.accountId || 'ACC-000';
      let finalCompanyName = newOrder.companyName || newOrder.customer || '';

      if (
        newOrder.clientType !== 'Particular / Individuo' ||
        finalAccountId === 'create_new' ||
        finalAccountId.includes('NEW') ||
        (finalCompanyName && finalCompanyName !== 'Cliente Particular' && finalAccountId === 'ACC-000')
      ) {
        try {
          const ensuredAcc = await ensureCorporateAccountExists({
            accountId: finalAccountId,
            companyName: finalCompanyName,
            clientType: newOrder.clientType,
            pricingTier: newOrder.pricingTier,
            phone: newOrder.phone,
            email: newOrder.email,
            contactNombre: newOrder.customerFirstName,
            contactApellido: newOrder.customerLastName,
            deliveryCity: newOrder.city,
            deliveryAddress: newOrder.address,
            userId: sellerInfo.sellerUid
          }, [], db);
          finalAccountId = ensuredAcc.accountId;
          finalCompanyName = ensuredAcc.accountName;
        } catch (e) {
          console.warn('Could not auto-ensure corporate account:', e);
        }
      }

      let finalContactId = newOrder.contactId || '';
      try {
        const ensuredContact = await ensureContactExists({
          contactId: finalContactId,
          contactNombre: newOrder.customerFirstName,
          contactApellido: newOrder.customerLastName,
          fullName: newOrder.customer,
          accountId: finalAccountId,
          accountName: finalCompanyName,
          phone: newOrder.phone,
          email: newOrder.email,
          userId: sellerInfo.sellerUid,
          role: normalizeRole(newOrder.contactRole, newOrder.clientType)
        }, [], db);
        if (ensuredContact.contactId) {
          finalContactId = ensuredContact.contactId;
        }
      } catch (e) {
        console.warn('Could not auto-ensure contact:', e);
      }

      if (orderHeaderMode === 'Cotización') {
        let quoteId = editingQuoteId;
        const isNewQuote = !quoteId || !quoteId.startsWith('COT-');

        if (isNewQuote) {
          quoteId = await getNextSequentialQuoteId();
        }

        const baseCreationDate = newOrder.migrationDate ? new Date(newOrder.migrationDate).getTime() : Date.now();
        const baseCreationIso = newOrder.migrationDate ? new Date(newOrder.migrationDate).toISOString() : new Date().toISOString();

        const quoteData = {
          ...newOrder,
          accountId: finalAccountId,
          companyName: finalCompanyName,
          contactId: finalContactId,
          id: quoteId,
          sellerName: sellerInfo.sellerName,
          sellerEmail: sellerInfo.sellerEmail,
          sellerUid: sellerInfo.sellerUid,
          sellerRole: sellerInfo.sellerRole,
          items: cleanItems,
          totalPrice: total,
          subtotal: breakdown.subtotal,
          totalDiscount: breakdown.subtotal - breakdown.total,
          migrationFlatDiscount: newOrder.migrationFlatDiscount || 0,
          manualDiscount: newOrder.manualDiscount || 0,
          status: 'Estimado',
          updatedAt: baseCreationDate,
          ...(isNewQuote ? {
            createdAt: baseCreationDate,
            createdBy: sellerInfo.sellerName,
            createdById: sellerInfo.sellerUid,
            amountCollected: 0
          } : {})
        };

        await setDoc(doc(db, 'orders', quoteId!), quoteData, { merge: true });

        // Ensure institutional roster contacts are provisioned when creating a quote too
        if (newOrder.isInstitutional && (newOrder.institutionalRoster || []).length > 0) {
          provisionInstitutionalContacts(
            newOrder.institutionalRoster,
            { accountId: finalAccountId, companyName: finalCompanyName, clientType: newOrder.clientType, pricingTier: newOrder.pricingTier },
            [],
            db
          ).catch(err => console.warn('Institutional contact provisioning error (Quote):', err));
        }

        showSuccessToast('✓ ¡Cotización creada con éxito!');
        setShowNewOrder(false);
        resetForm();
      } else {
        // Orden Activa
        const baseCreationDate = newOrder.migrationDate ? new Date(newOrder.migrationDate).getTime() : Date.now();
        const baseCreationIso = newOrder.migrationDate ? new Date(newOrder.migrationDate).toISOString() : new Date().toISOString();
        const basePaymentDate = newOrder.customPaymentDate ? new Date(newOrder.customPaymentDate).getTime() : baseCreationDate;

        let compressedReceipt = receiptBase64 || null;
        if (receiptBase64 && receiptBase64.startsWith('data:image')) {
          try {
            compressedReceipt = await compressImage(receiptBase64);
          } catch {
            compressedReceipt = receiptBase64;
          }
        }

        const collectedNum = paymentAmt ? parseFloat(paymentAmt) : (newOrder.paymentMethod === '100% Contado' ? total : total * 0.5);
        const orderId = await getNextSequentialOrderId();

        const paymentEntry = {
          id: `PAY-${basePaymentDate}`,
          amount: collectedNum,
          date: basePaymentDate,
          receipt: compressedReceipt,
          note: paymentOptions?.note || (newOrder.paymentMethod === '100% Contado' ? 'Pago Total al Contado' : 'Pago Inicial / Adelanto (50%)'),
          method: paymentOptions?.method || newOrder.paymentMethod || 'Transferencia',
          recordedBy: sellerInfo.sellerName,
          sellerName: sellerInfo.sellerName,
          sellerUid: sellerInfo.sellerUid,
          tendered: paymentOptions?.tendered !== undefined ? paymentOptions.tendered : null,
          change: paymentOptions?.change !== undefined ? paymentOptions.change : null
        };

        const autoProductionStatus = determineNewOrderProductionStatus(cleanItems, 'Orden Activa', (newOrder.orderLogos || []).map((l: any) => l.url || '').filter(Boolean));

        const orderData: any = {
          ...newOrder,
          accountId: finalAccountId,
          companyName: finalCompanyName,
          contactId: finalContactId,
          id: orderId,
          docType: 'ORDEN',
          sellerName: sellerInfo.sellerName,
          sellerEmail: sellerInfo.sellerEmail,
          sellerUid: sellerInfo.sellerUid,
          sellerRole: sellerInfo.sellerRole,
          items: cleanItems,
          totalPrice: total,
          subtotal: breakdown.subtotal,
          totalDiscount: breakdown.subtotal - breakdown.total,
          migrationFlatDiscount: newOrder.migrationFlatDiscount || 0,
          manualDiscount: newOrder.manualDiscount || 0,
          amountCollected: collectedNum,
          paymentHistory: [paymentEntry],
          status: 'Orden Activa',
          productionStatus: autoProductionStatus,
          timestamps: {
            'Orden Activa': baseCreationIso,
            [autoProductionStatus]: baseCreationIso
          },
          createdAt: baseCreationDate,
          updatedAt: baseCreationDate,
          createdBy: sellerInfo.sellerName,
          createdById: sellerInfo.sellerUid
        };

        if (editingQuoteId) {
          orderData.convertedFromQuoteId = editingQuoteId;
          orderData.convertedAt = baseCreationDate;
        }

        await setDoc(doc(db, 'orders', orderId), orderData);

        if (newOrder.isInstitutional && (newOrder.institutionalRoster || []).length > 0) {
          provisionInstitutionalContacts(
            newOrder.institutionalRoster,
            { accountId: finalAccountId, companyName: finalCompanyName, clientType: newOrder.clientType, pricingTier: newOrder.pricingTier },
            [],
            db
          ).catch(err => console.warn('Institutional contact provisioning error:', err));
        }

        if (editingQuoteId && editingQuoteId.startsWith('COT-')) {
          await updateDoc(doc(db, 'orders', editingQuoteId), {
            status: 'Convertido',
            convertedToOrderId: orderId,
            updatedAt: Date.now()
          });
        }

        showSuccessToast('✓ ¡Orden lanzada con éxito!');
        setShowNewOrder(false);
        setOrderToCollect(null);
        setManualAmount('');
        setManualReceipt(null);
        resetForm();
      }
    } catch (err: any) {
      console.error('Error al guardar cotización/orden:', err);
      alert('Error al guardar: ' + (err?.message || 'Error desconocido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleCreateOrder };
};
