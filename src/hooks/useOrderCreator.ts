import { Order, PricingData } from '../types';
import { INITIAL_ORDER_STATE, INITIAL_ITEM_STATE } from '../utils/orderFormDefaults';
import { usePricingEngine } from './usePricingEngine';
import { useOrderState } from './useOrderState';
import { useOrderSubmission } from './useOrderSubmission';

export { INITIAL_ORDER_STATE, INITIAL_ITEM_STATE };

export const useOrderCreator = (
  pricing: PricingData,
  editingOrder: Order | null,
  setEditingOrder: (order: Order | null) => void,
  setShowNewOrder: (val: boolean) => void,
  setOrderToCollect: (val: Order | null) => void,
  setManualAmount: (val: string) => void,
  setManualReceipt: (val: string | null) => void
) => {
  const pricingEngine = usePricingEngine(pricing);
  const state = useOrderState(editingOrder, setEditingOrder);
  
  const submission = useOrderSubmission(
    state,
    { setShowNewOrder, setOrderToCollect, setManualAmount, setManualReceipt },
    pricingEngine
  );

  return {
    newOrder: state.newOrder,
    setNewOrder: state.setNewOrder,
    currentItem: state.currentItem,
    setCurrentItem: state.setCurrentItem,
    orderHeaderMode: state.orderHeaderMode,
    setOrderHeaderMode: state.setOrderHeaderMode,
    editingQuoteId: state.editingQuoteId,
    setEditingQuoteId: state.setEditingQuoteId,
    handleCreateOrder: submission.handleCreateOrder,
    isSubmitting: state.isSubmitting,
    resetForm: state.resetForm,
    calculateTotalPrice: pricingEngine.calculateTotalPrice,
    getItemUnitPrice: pricingEngine.getItemUnitPrice,
    getOrderBreakdown: pricingEngine.getOrderBreakdown,
    getServiceUnitPrice: pricingEngine.getServiceUnitPrice
  };
};
