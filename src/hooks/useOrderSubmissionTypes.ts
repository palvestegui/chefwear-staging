import { Order, OrderItem, AuthUserProfile, FirebaseUserSubset } from '../types';

export interface OrderSubmissionState {
  newOrder: Order;
  orderHeaderMode: 'Cotización' | 'Orden Activa';
  editingQuoteId: string | null;
  userProfile: AuthUserProfile | null;
  user: FirebaseUserSubset | null;
  setIsSubmitting: (val: boolean) => void;
  resetForm: () => void;
}

export interface OrderSubmissionActions {
  setShowNewOrder: (val: boolean) => void;
  setOrderToCollect: (val: Order | null) => void;
  setManualAmount: (val: string) => void;
  setManualReceipt: (val: string | null) => void;
}

export interface OrderBreakdown {
  total: number;
  subtotal: number;
  lines: Array<{ label: string; amount: number }>;
}

export interface OrderPricingEngine {
  getOrderBreakdown: (
    items: OrderItem[],
    category?: string,
    paymentMethod?: string,
    manualDiscount?: number,
    clientType?: string,
    accountId?: string,
    migrationFlatDiscount?: number
  ) => OrderBreakdown;
}

export interface PaymentOptions {
  note?: string;
  method?: string;
  tendered?: number;
  change?: number;
}
