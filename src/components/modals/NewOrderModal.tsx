import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePricingEngine } from '../../hooks/usePricingEngine';
import { useOrderCreator } from '../../hooks/useOrderCreator';
import { X } from 'lucide-react';
import { CustomerSection } from './newOrder/CustomerSection';
import { GarmentConfigurator } from './newOrder/GarmentConfigurator';
import { OrderSummaryAndCheckout } from './newOrder/OrderSummaryAndCheckout';
import { InstitutionalRosterModal } from './newOrder/InstitutionalRosterModal';
import { expandRosterToOrderItems } from '../../utils/institutionalOrderUtils';
import { getEffectiveTierDiscountRules } from '../../utils/discountRulesUtils';
import { resolveOrderTier } from '../../utils/pricingTierUtils';

interface NewOrderModalProps {
  showNewOrder: boolean;
  setShowNewOrder: (val: boolean) => void;
  editingOrder?: any;
  setEditingOrder?: (val: any) => void;
  setOrderToCollect: (val: any) => void;
  setManualAmount: (val: string) => void;
  setManualReceipt: (val: any) => void;
  setShowQuickSizeModal?: (val: boolean) => void;
  directoryContacts?: any[];
  orderCreator?: any;
  isMigrationMode?: boolean;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  showNewOrder,
  setShowNewOrder,
  editingOrder,
  setEditingOrder,
  setOrderToCollect,
  setManualAmount,
  setManualReceipt,
  setShowQuickSizeModal,
  directoryContacts: customContacts,
  orderCreator,
  isMigrationMode
}) => {
  const { pricing, clientAccounts, accountContacts, masterContacts, orders, usersList } = useData();
  const { isSuperAdmin } = useAuth();
  const canBackdate = isSuperAdmin === true;
  const pricingEngine = usePricingEngine(pricing);

  const fallbackCreator = useOrderCreator(
    pricing,
    editingOrder,
    setEditingOrder || (() => {}),
    setShowNewOrder,
    setOrderToCollect,
    setManualAmount,
    setManualReceipt
  );

  const creator = orderCreator || fallbackCreator;
  const {
    newOrder,
    setNewOrder,
    currentItem,
    setCurrentItem,
    editingQuoteId,
    setEditingQuoteId,
    orderHeaderMode,
    setOrderHeaderMode,
    handleCreateOrder,
    calculateTotalPrice,
    getItemUnitPrice,
    getOrderBreakdown, getServiceUnitPrice,
    isSubmitting
  } = creator;

  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [isHistoricalMode, setIsHistoricalMode] = useState<boolean>(
    Boolean(isSuperAdmin && (isMigrationMode || (editingOrder && editingOrder.migrationDate)))
  );

  if (!showNewOrder || !pricing || !newOrder) return null;

  const directoryContacts = customContacts || masterContacts || [];

  // Find existing contacts belonging to this corporate account
  const accountContactsForRoster = (accountContacts || [])
    .filter(ac => ac.accountId === newOrder.accountId)
    .map(ac => {
      const mc = (masterContacts || []).find(m => (m.contactId || m.id) === ac.contactId);
      return mc || ac;
    });

  // Extract unique garment templates currently in the order, or build default 3
  const currentGarmentTemplates = (() => {
    if (newOrder.items && newOrder.items.length > 0) {
      const map = new Map<string, any>();
      newOrder.items.forEach((it: any) => {
        if (!map.has(it.name)) {
          map.set(it.name, { name: it.name, fabric: it.fabric, fabricColor: it.fabricColor });
        }
      });
      return Array.from(map.values());
    }
    return [
      { name: 'Filipina', fabric: 'Drill de 8oz', fabricColor: '' },
      { name: 'Pantalón', fabric: 'Drill de 8oz', fabricColor: '' },
      { name: 'Mandil', fabric: 'Drill de 8oz', fabricColor: '' }
    ];
  })();

  const handleConfirmRosterSync = (updatedRoster: any[]) => {
    if (updatedRoster.length > 0) {
      const expandedItems = expandRosterToOrderItems(updatedRoster);
      setNewOrder((prev: any) => ({
        ...prev,
        isInstitutional: true,
        institutionalRoster: updatedRoster,
        items: expandedItems
      }));
    } else {
      setNewOrder((prev: any) => ({
        ...prev,
        institutionalRoster: []
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 lg:p-4 overflow-hidden">
      <div className="w-full h-full lg:h-auto lg:max-h-[92vh] lg:w-[96vw] lg:max-w-[1560px] rounded-none lg:rounded-2xl m-0 lg:m-auto p-3 sm:p-4 lg:p-6 bg-stone-950 border-0 lg:border lg:border-stone-800 shadow-2xl overflow-hidden relative flex flex-col scrollbar-thin scrollbar-thumb-stone-800 animate-in slide-in-from-bottom">
        
        {/* Single-Row Unified Mobile Header with Segmented Mode Toggle & Controls */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-800/60 shrink-0 mb-2.5 sm:mb-3 min-h-[32px]">
          <h3 className="hidden lg:block text-sm lg:text-base font-black uppercase tracking-wider text-stone-200">
            {orderHeaderMode === 'Cotización' ? 'Creador de Cotización' : 'Creador de Orden Activa'}
          </h3>
          
          <div className="flex items-center justify-between lg:justify-end gap-1.5 sm:gap-2.5 w-full lg:w-auto">
            {/* Segmented Mode Toggle */}
            <div className="flex items-center bg-stone-900/80 p-0.5 rounded-lg border border-stone-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setOrderHeaderMode('Cotización')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer text-xs ${
                  orderHeaderMode === 'Cotización'
                    ? 'bg-stone-800 text-stone-200 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Cotización
              </button>
              <button
                type="button"
                onClick={() => setOrderHeaderMode('Orden Activa')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer text-xs ${
                  orderHeaderMode === 'Orden Activa'
                    ? 'bg-amber-500 text-stone-950 font-black shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Orden Activa
              </button>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {canBackdate && (
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !isHistoricalMode;
                    setIsHistoricalMode(nextVal);
                    if (!nextVal) {
                      setNewOrder((p: any) => ({
                        ...p,
                        migrationDate: null,
                        customPaymentDate: null,
                        migrationFlatDiscount: 0
                      }));
                    }
                  }}
                  className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition flex items-center gap-1 cursor-pointer ${
                    isHistoricalMode
                      ? 'bg-amber-500 text-stone-950 font-black shadow-sm'
                      : 'bg-stone-900/80 text-stone-400 border border-stone-800 hover:text-stone-200'
                  }`}
                  title="Activar Registro Histórico / Fechas Personalizadas"
                >
                  <span>🗓️</span>
                  <span className="hidden md:inline">Histórico</span>
                </button>
              )}

              <button 
                type="button"
                onClick={() => { 
                  setShowNewOrder(false); 
                  if (setEditingQuoteId) setEditingQuoteId(null);
                  if (setEditingOrder) setEditingOrder(null);
                }} 
                className="p-1 text-stone-400 hover:text-red-400 hover:bg-stone-800/60 rounded-lg transition cursor-pointer"
                title="Cerrar modal"
              >
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleCreateOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-800 pr-1 pb-2">
          {/* Left Column: Customer, Garment Configurator, Notes & Terms */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-2.5 sm:space-y-4">
            <CustomerSection
              newOrder={newOrder}
              setNewOrder={setNewOrder}
              showContactDropdown={showContactDropdown}
              setShowContactDropdown={setShowContactDropdown}
              directoryContacts={directoryContacts}
              clientAccounts={clientAccounts}
              accountContacts={accountContacts}
              orders={orders}
              usersList={usersList}
              onOpenRosterModal={() => setShowRosterModal(true)}
              isSuperAdmin={isSuperAdmin}
            />

            <GarmentConfigurator
              newOrder={newOrder}
              setNewOrder={setNewOrder}
              currentItem={currentItem}
              setCurrentItem={setCurrentItem}
              pricing={pricing}
              orderHeaderMode={orderHeaderMode}
              setShowQuickSizeModal={setShowQuickSizeModal || (() => {})}
              calculateItemPriceRaw={pricingEngine.calculateItemPriceRaw}
              getPricingTierFromClientType={pricingEngine.getPricingTierFromClientType}
            />

            {/* Special Details / Notes */}
            <div>
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1.5 block">Detalles Especiales / Notas</label>
              <textarea 
                value={newOrder.notes || ''} 
                onChange={e => setNewOrder({...newOrder, notes: e.target.value})} 
                className="w-full bg-stone-950 border border-stone-800 p-3 sm:p-4 rounded-2xl focus:border-amber-500 outline-none font-bold text-xs sm:text-sm text-stone-300 min-h-[60px] sm:min-h-[80px]" 
                placeholder="(Opcional) Nombres, direcciones, etc." 
              />
            </div>
            
            {/* Delivery Time & Payment Method */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1.5 block">Plazo de Entrega</label>
                <input 
                  value={newOrder.deliveryTime || ''} 
                  onChange={e => setNewOrder({...newOrder, deliveryTime: e.target.value})} 
                  className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl focus:border-amber-500 outline-none font-bold text-xs leading-normal text-stone-300 min-h-[44px]" 
                  placeholder="15 días hábiles a partir del primer depósito"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1.5 block">Método de Pago</label>
                <select 
                  value={newOrder.paymentMethod || '50/50 - Adelantado/Entrega'} 
                  onChange={e => setNewOrder({...newOrder, paymentMethod: e.target.value})} 
                  className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl focus:border-amber-500 outline-none font-bold text-xs text-stone-300 min-h-[44px]"
                >
                  <option value="50/50 - Adelantado/Entrega">50/50 - Adelantado/Entrega</option>
                  <option value="100% Contado">100% Contado</option>
                </select>
              </div>
            </div>
            
            {/* Closing Discount Slider (respects active tier discount configuration) */}
            {(() => {
              const activeTier = resolveOrderTier(
                newOrder.items,
                newOrder.category,
                newOrder.accountId,
                newOrder.clientType,
                newOrder.pricingTier
              );

              const rules = getEffectiveTierDiscountRules(
                activeTier,
                pricing?.discountRulesByTier,
                pricing?.specialPresetDiscounts
              );

              if (!rules.sellerDiscountEnabled) return null;

              const maxPct = Math.max(0, rules.maxSellerDiscountPercent || 0);
              if (maxPct === 0) return null;

              return (
                <div>
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2 flex justify-between">
                    <span>Descuento de Cierre ({activeTier})</span>
                    <span className="text-amber-500">{Math.min(newOrder.manualDiscount || 0, maxPct)}%</span>
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max={maxPct} 
                    step="1" 
                    value={Math.min(newOrder.manualDiscount || 0, maxPct)} 
                    onChange={e => setNewOrder({...newOrder, manualDiscount: Math.min(parseInt(e.target.value) || 0, maxPct)})} 
                    className="w-full accent-amber-500" 
                  />
                  <div className="flex justify-between text-[8px] text-stone-600 mt-1 font-bold">
                    {Array.from({ length: maxPct + 1 }, (_, idx) => (
                      <span key={idx}>{idx}%</span>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Right Column: Order Summary & Action Buttons */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-4">
            <OrderSummaryAndCheckout
              newOrder={newOrder}
              setNewOrder={setNewOrder}
              pricing={pricing}
              orderHeaderMode={orderHeaderMode}
              editingQuoteId={editingQuoteId}
              setOrderToCollect={setOrderToCollect}
              setManualAmount={setManualAmount}
              setManualReceipt={setManualReceipt}
              getItemUnitPrice={getItemUnitPrice}
              getServiceUnitPrice={getServiceUnitPrice}
              getOrderBreakdown={getOrderBreakdown}
              calculateTotalPrice={calculateTotalPrice}
              isMigrationMode={Boolean(isSuperAdmin && isHistoricalMode)}
              isSubmitting={isSubmitting}
            />
          </div>
        </form>

        {/* Institutional Roster Modal */}
        <InstitutionalRosterModal
          show={showRosterModal}
          onClose={() => setShowRosterModal(false)}
          roster={newOrder.institutionalRoster || []}
          setRoster={(valOrFn: any) => {
            setNewOrder((prev: any) => {
              const nextRoster = typeof valOrFn === 'function' ? valOrFn(prev.institutionalRoster || []) : valOrFn;
              return {
                ...prev,
                institutionalRoster: nextRoster
              };
            });
          }}
          garmentTemplates={currentGarmentTemplates}
          companyName={newOrder.companyName || newOrder.customer || ''}
          accountId={newOrder.accountId || 'ACC-000'}
          clientType={newOrder.clientType}
          pricing={pricing}
          existingAccountContacts={accountContactsForRoster}
          onConfirmSync={handleConfirmRosterSync}
        />
      </div>
    </div>
  );
};
