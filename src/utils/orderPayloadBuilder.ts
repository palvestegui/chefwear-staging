import { Order, OrderItem, OrderLogo } from '../types';
import { determineNewOrderProductionStatus } from './orderUtils';
import { OrderBreakdown, PaymentOptions } from '../hooks/useOrderSubmissionTypes';

export interface SellerAttribution {
  sellerName: string;
  sellerEmail: string;
  sellerUid: string;
  sellerRole?: string;
}

export function cleanOrderItemsForSave(items: OrderItem[] | undefined): OrderItem[] {
  return (items || []).map((it: OrderItem) => {
    const itemCopy = { ...it };
    if (itemCopy.logoFile) delete itemCopy.logoFile;
    if (itemCopy.refImageFile) delete itemCopy.refImageFile;
    return itemCopy;
  });
}

export function buildQuotePayload(params: {
  newOrder: Order;
  quoteId: string;
  isNewQuote: boolean;
  finalAccountId: string;
  finalCompanyName: string;
  finalContactId: string;
  sellerInfo: SellerAttribution;
  cleanItems: OrderItem[];
  breakdown: OrderBreakdown;
}): Record<string, unknown> {
  const { newOrder, quoteId, isNewQuote, finalAccountId, finalCompanyName, finalContactId, sellerInfo, cleanItems, breakdown } = params;
  const baseCreationDate = newOrder.migrationDate ? new Date(newOrder.migrationDate).getTime() : Date.now();
  return {
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
    totalPrice: breakdown.total,
    subtotal: breakdown.subtotal,
    totalDiscount: breakdown.subtotal - breakdown.total,
    migrationFlatDiscount: newOrder.migrationFlatDiscount || 0,
    manualDiscount: newOrder.manualDiscount || 0,
    status: 'Estimado',
    updatedAt: baseCreationDate,
    ...(isNewQuote
      ? {
          createdAt: baseCreationDate,
          createdBy: sellerInfo.sellerName,
          createdById: sellerInfo.sellerUid,
          amountCollected: 0,
        }
      : {}),
  };
}

export function buildActiveOrderPayload(params: {
  newOrder: Order;
  orderId: string;
  editingQuoteId: string | null;
  finalAccountId: string;
  finalCompanyName: string;
  finalContactId: string;
  sellerInfo: SellerAttribution;
  cleanItems: OrderItem[];
  breakdown: OrderBreakdown;
  collectedNum: number;
  compressedReceipt: string | null;
  paymentOptions?: PaymentOptions;
}): Record<string, unknown> {
  const {
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
  } = params;

  const baseCreationDate = newOrder.migrationDate ? new Date(newOrder.migrationDate).getTime() : Date.now();
  const baseCreationIso = newOrder.migrationDate
    ? new Date(newOrder.migrationDate).toISOString()
    : new Date().toISOString();
  const basePaymentDate = newOrder.customPaymentDate
    ? new Date(newOrder.customPaymentDate).getTime()
    : baseCreationDate;

  const paymentEntry = {
    id: `PAY-${basePaymentDate}`,
    amount: collectedNum,
    date: basePaymentDate,
    receipt: compressedReceipt,
    note:
      paymentOptions?.note ||
      (newOrder.paymentMethod === '100% Contado' ? 'Pago Total al Contado' : 'Pago Inicial / Adelanto (50%)'),
    method: paymentOptions?.method || newOrder.paymentMethod || 'Transferencia',
    recordedBy: sellerInfo.sellerName,
    sellerName: sellerInfo.sellerName,
    sellerUid: sellerInfo.sellerUid,
    tendered: paymentOptions?.tendered !== undefined ? paymentOptions.tendered : null,
    change: paymentOptions?.change !== undefined ? paymentOptions.change : null,
  };

  const autoProductionStatus = determineNewOrderProductionStatus(
    cleanItems,
    'Orden Activa',
    (newOrder.orderLogos || []).map((l: OrderLogo) => l.url || '').filter(Boolean)
  );

  const orderData: Record<string, unknown> = {
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
    totalPrice: breakdown.total,
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
      [autoProductionStatus]: baseCreationIso,
    },
    createdAt: baseCreationDate,
    updatedAt: baseCreationDate,
    createdBy: sellerInfo.sellerName,
    createdById: sellerInfo.sellerUid,
  };

  if (editingQuoteId) {
    orderData.convertedFromQuoteId = editingQuoteId;
    orderData.convertedAt = baseCreationDate;
  }

  return orderData;
}
