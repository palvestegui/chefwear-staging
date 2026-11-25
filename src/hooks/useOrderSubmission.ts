import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getNextSequentialQuoteId, getNextSequentialOrderId } from '../utils/sequenceUtils';
import { compressImage } from '../utils/imageUtils';
import { showSuccessToast } from '../utils/toastUtils';
import { resolveSellerInfo } from '../utils/sellerUtils';
import { provisionInstitutionalContacts } from '../utils/institutionalOrderUtils';
import { ensureCorporateAccountExists, ensureContactExists } from '../utils/accountContactMutations';
import { normalizeRole } from '../utils/constants';
import {
  buildActiveOrderPayload,
  buildQuotePayload,
  cleanOrderItemsForSave,
} from '../utils/orderPayloadBuilder';
import {
  OrderSubmissionState,
  OrderSubmissionActions,
  OrderBreakdown,
  OrderPricingEngine,
  PaymentOptions,
} from './useOrderSubmissionTypes';

export type {
  OrderSubmissionState,
  OrderSubmissionActions,
  OrderBreakdown,
  OrderPricingEngine,
  PaymentOptions,
};

export const useOrderSubmission = (
  state: OrderSubmissionState,
  actions: OrderSubmissionActions,
  pricingEngine: OrderPricingEngine
) => {
  const {
    newOrder,
    orderHeaderMode,
    editingQuoteId,
    userProfile,
    user,
    clientAccounts = [],
    masterContacts = [],
    setIsSubmitting,
    resetForm,
  } = state;
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

      const cleanItems = cleanOrderItemsForSave(newOrder.items);
      const sellerInfo = resolveSellerInfo({
        userProfile,
        user,
        selectedSellerName: newOrder.sellerName,
        selectedSellerEmail: newOrder.sellerEmail,
        selectedSellerUid: newOrder.sellerUid,
      });

      let finalAccountId = newOrder.accountId || 'ACC-000';
      let finalCompanyName = newOrder.companyName || newOrder.customer || '';

      if (
        newOrder.clientType !== 'Particular / Individuo' ||
        finalAccountId === 'create_new' ||
        finalAccountId.includes('NEW') ||
        (finalCompanyName && finalCompanyName !== 'Cliente Particular' && finalAccountId === 'ACC-000')
      ) {
        try {
          const ensuredAcc = await ensureCorporateAccountExists(
            {
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
              userId: sellerInfo.sellerUid,
            },
            clientAccounts,
            db
          );
          finalAccountId = ensuredAcc.accountId;
          finalCompanyName = ensuredAcc.accountName;
        } catch (err) {
          console.warn('Could not auto-ensure corporate account:', err);
        }
      }

      let finalContactId = newOrder.contactId || '';
      try {
        const ensuredContact = await ensureContactExists(
          {
            contactId: finalContactId,
            contactNombre: newOrder.customerFirstName,
            contactApellido: newOrder.customerLastName,
            fullName: newOrder.customer,
            accountId: finalAccountId,
            accountName: finalCompanyName,
            phone: newOrder.phone,
            email: newOrder.email,
            userId: sellerInfo.sellerUid,
            role: normalizeRole(newOrder.contactRole, newOrder.clientType),
          },
          masterContacts,
          db
        );
        if (ensuredContact.contactId) {
          finalContactId = ensuredContact.contactId;
        }
      } catch (err) {
        console.warn('Could not auto-ensure contact:', err);
      }

      const rosterContext = {
        accountId: finalAccountId,
        companyName: finalCompanyName,
        clientType: newOrder.clientType,
        pricingTier: newOrder.pricingTier,
      };

      if (orderHeaderMode === 'Cotización') {
        let quoteId = editingQuoteId;
        const isNewQuote = !quoteId || !quoteId.startsWith('COT-');
        if (isNewQuote) quoteId = await getNextSequentialQuoteId();

        const quoteData = buildQuotePayload({
          newOrder,
          quoteId: quoteId!,
          isNewQuote,
          finalAccountId,
          finalCompanyName,
          finalContactId,
          sellerInfo,
          cleanItems,
          breakdown,
        });

        await setDoc(doc(db, 'orders', quoteId!), quoteData, { merge: true });

        if (newOrder.isInstitutional && (newOrder.institutionalRoster || []).length > 0) {
          provisionInstitutionalContacts(newOrder.institutionalRoster, rosterContext, masterContacts, db).catch((err) =>
            console.warn('Institutional contact provisioning error (Quote):', err)
          );
        }

        showSuccessToast('✓ ¡Cotización creada con éxito!');
        setShowNewOrder(false);
        resetForm();
      } else {
        let compressedReceipt = receiptBase64 || null;
        if (receiptBase64 && receiptBase64.startsWith('data:image')) {
          try {
            compressedReceipt = await compressImage(receiptBase64);
          } catch {
            compressedReceipt = receiptBase64;
          }
        }

        const collectedNum = paymentAmt
          ? parseFloat(paymentAmt)
          : newOrder.paymentMethod === '100% Contado'
          ? breakdown.total
          : breakdown.total * 0.5;
        const orderId = await getNextSequentialOrderId();

        const orderData = buildActiveOrderPayload({
          newOrder,
          orderId,
          editingQuoteId,
          finalAccountId,
          finalCompanyName,
          finalContactId,
          sellerInfo,
          cleanItems,
          breakdown,
          collectedNum,
          compressedReceipt,
          paymentOptions,
        });

        await setDoc(doc(db, 'orders', orderId), orderData);

        if (newOrder.isInstitutional && (newOrder.institutionalRoster || []).length > 0) {
          provisionInstitutionalContacts(newOrder.institutionalRoster, rosterContext, masterContacts, db).catch((err) =>
            console.warn('Institutional contact provisioning error:', err)
          );
        }

        if (editingQuoteId && editingQuoteId.startsWith('COT-')) {
          await updateDoc(doc(db, 'orders', editingQuoteId), {
            status: 'Convertido',
            convertedToOrderId: orderId,
            updatedAt: Date.now(),
          });
        }

        showSuccessToast('✓ ¡Orden lanzada con éxito!');
        setShowNewOrder(false);
        setOrderToCollect(null);
        setManualAmount('');
        setManualReceipt(null);
        resetForm();
      }
    } catch (err: unknown) {
      console.error('Error al guardar cotización/orden:', err);
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      alert('Error al guardar: ' + msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleCreateOrder };
};
