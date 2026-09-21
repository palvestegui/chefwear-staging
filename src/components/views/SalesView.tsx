import React from 'react';
import * as LucideIcons from 'lucide-react';
import { ActiveOrdersList } from './sales/ActiveOrdersList';
import { QuotesList } from './sales/QuotesList';
import { QuotesHistoryList } from './sales/QuotesHistoryList';

const { Plus } = LucideIcons;

export interface SalesViewProps {
  ventasTab: string;
  setVentasTab: (tab: string) => void;
  ventasHistorialTimeframe: string;
  setVentasHistorialTimeframe: (tf: string) => void;
  setShowNewOrder: (show: boolean) => void;
  orders: any[];
  pricing: any;
  db: any;
  getDocType: (order: any) => string;
  getCurrentProductionStatus: (order: any) => string;
  collapseUdiItems: (items: any[]) => any[];
  getItemUnitPrice: (item: any, category?: string, accountId?: string) => number;
  getOrderBreakdown: (items: any[], category?: string, paymentMethod?: string, manualDiscount?: number, clientType?: string, accountId?: string, migrationFlatDiscount?: number) => any,
  setOrderToCollect: (order: any) => void;
  setManualAmount: (amount: string) => void;
  setManualReceipt: (receipt: any) => void;
  setViewingInvoiceId: (id: string | null) => void;
  setViewingRefImagesOrderId: (id: string | null) => void;
  showWhatsappFormatId: string | null;
  setShowWhatsappFormatId: (id: string | null) => void;
  downloadOrderImage: (id: string, name: string, format: string, whatsappText: string) => void;
  getWhatsAppText: (order: any, isOrder?: boolean) => string;
  normRole: (role?: string) => string;
  setCancelActiveOrderModal: (modal: any) => void;
  setCancelResolutionType: (type: string) => void;
  setCancelPartialRefund: (refund: any) => void;
  setCancelJustification: (just: string) => void;
  handleEditQuote: (order: any) => void;
  setCancelQuoteModal: (modal: any) => void;
  setCancelQuoteReason: (reason: string) => void;
  confirmDeleteId: string | null;
  setConfirmDeleteId: (id: string | null) => void;
  handleDeleteOrder: (id: string) => Promise<void>;
  handleReactivateQuote: (order: any) => Promise<void>;
  setViewingCancellationVoucherId: (id: string | null) => void;
  setViewingReceiptId?: (id: string | null) => void;
  setViewingHistoryOrderId?: (id: string | null) => void;
  onOpenEditRoster?: (order: any) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  setVentasTab,
  ventasTab,
  ventasHistorialTimeframe,
  setVentasHistorialTimeframe,
  setShowNewOrder,
  orders,
  pricing,
  db,
  getDocType,
  getCurrentProductionStatus,
  collapseUdiItems,
  getItemUnitPrice,
  getOrderBreakdown,
  setOrderToCollect,
  setManualAmount,
  setManualReceipt,
  setViewingInvoiceId,
  setViewingRefImagesOrderId,
  showWhatsappFormatId,
  setShowWhatsappFormatId,
  downloadOrderImage,
  getWhatsAppText,
  normRole,
  setCancelActiveOrderModal,
  setCancelResolutionType,
  setCancelPartialRefund,
  setCancelJustification,
  handleEditQuote,
  setCancelQuoteModal,
  setCancelQuoteReason,
  confirmDeleteId,
  setConfirmDeleteId,
  handleDeleteOrder,
  handleReactivateQuote,
  setViewingCancellationVoucherId,
  setViewingReceiptId,
  setViewingHistoryOrderId,
  onOpenEditRoster
}) => {
  const getSectionTitle = () => {
    switch (ventasTab) {
      case 'cotizaciones':
        return 'Cotizaciones';
      case 'activas':
        return 'Órdenes Activas';
      case 'entregado':
      case 'historial':
        return 'Entregados';
      case 'sin_pendientes':
        return 'Sin Pendientes';
      case 'cancelado':
      case 'canceladas':
        return 'Cancelados';
      case 'expirado':
      case 'expiradas':
        return 'Expirados';
      default:
        return 'Ventas';
    }
  };

  const isActivas = ventasTab === 'activas';
  const isCotizaciones = ventasTab === 'cotizaciones';
  const isHistorialGroup = ['historial', 'entregado', 'sin_pendientes', 'canceladas', 'cancelado', 'expiradas', 'expirado'].includes(ventasTab);
  const normalizedHistoryTab =
    ventasTab === 'entregado' ? 'historial' :
    ventasTab === 'cancelado' ? 'canceladas' :
    ventasTab === 'expirado' ? 'expiradas' :
    ventasTab;

  return (
    <div className="w-full space-y-4 animate-in fade-in">
      {/* Sleek Single-Line Action Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-black text-stone-200 tracking-tight">
            {getSectionTitle()}
          </h2>
          {(normalizedHistoryTab === 'historial' || normalizedHistoryTab === 'sin_pendientes') && (
            <div className="flex bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setVentasHistorialTimeframe('todo')}
                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition ${
                  ventasHistorialTimeframe === 'todo' ? 'bg-stone-700 text-white' : 'text-stone-500 hover:bg-stone-800'
                }`}
              >
                Todo
              </button>
              <button
                onClick={() => setVentasHistorialTimeframe('semana')}
                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition ${
                  ventasHistorialTimeframe === 'semana' ? 'bg-stone-700 text-white' : 'text-stone-500 hover:bg-stone-800'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setVentasHistorialTimeframe('mes')}
                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition ${
                  ventasHistorialTimeframe === 'mes' ? 'bg-stone-700 text-white' : 'text-stone-500 hover:bg-stone-800'
                }`}
              >
                Mes
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowNewOrder(true)}
          className="bg-amber-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-amber-500 transition shadow-xl active:scale-95 font-black uppercase text-xs tracking-widest shrink-0"
        >
          <Plus size={16} /> Nueva Cotización
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 items-start">
        {isActivas && (
          <ActiveOrdersList
            orders={orders}
            pricing={pricing}
            getDocType={getDocType}
            getCurrentProductionStatus={getCurrentProductionStatus}
            collapseUdiItems={collapseUdiItems}
            getItemUnitPrice={getItemUnitPrice}
            getOrderBreakdown={getOrderBreakdown}
            setOrderToCollect={setOrderToCollect}
            setManualAmount={setManualAmount}
            setManualReceipt={setManualReceipt}
            setViewingInvoiceId={setViewingInvoiceId}
            setViewingRefImagesOrderId={setViewingRefImagesOrderId}
            showWhatsappFormatId={showWhatsappFormatId}
            setShowWhatsappFormatId={setShowWhatsappFormatId}
            downloadOrderImage={downloadOrderImage}
            getWhatsAppText={getWhatsAppText}
            normRole={normRole}
            setCancelActiveOrderModal={setCancelActiveOrderModal}
            setViewingReceiptId={setViewingReceiptId}
            setCancelResolutionType={setCancelResolutionType}
            setCancelPartialRefund={setCancelPartialRefund}
            setCancelJustification={setCancelJustification}
            onOpenEditRoster={onOpenEditRoster}
            confirmDeleteId={confirmDeleteId}
            setConfirmDeleteId={setConfirmDeleteId}
            handleDeleteOrder={handleDeleteOrder}
          />
        )}

        {ventasTab === 'cotizaciones' && (
          <QuotesList
            orders={orders}
            pricing={pricing}
            db={db}
            getDocType={getDocType}
            collapseUdiItems={collapseUdiItems}
            getItemUnitPrice={getItemUnitPrice}
            getOrderBreakdown={getOrderBreakdown}
            setOrderToCollect={setOrderToCollect}
            setManualAmount={setManualAmount}
            setManualReceipt={setManualReceipt}
            handleEditQuote={handleEditQuote}
            showWhatsappFormatId={showWhatsappFormatId}
            setShowWhatsappFormatId={setShowWhatsappFormatId}
            downloadOrderImage={downloadOrderImage}
            getWhatsAppText={getWhatsAppText}
            setCancelQuoteModal={setCancelQuoteModal}
            setCancelResolutionType={setCancelResolutionType}
            setCancelPartialRefund={setCancelPartialRefund}
            setCancelJustification={setCancelJustification}
            setCancelQuoteReason={setCancelQuoteReason}
            confirmDeleteId={confirmDeleteId}
            setConfirmDeleteId={setConfirmDeleteId}
            handleDeleteOrder={handleDeleteOrder}
            normRole={normRole}
          />
        )}

        {isHistorialGroup && (
          <QuotesHistoryList
            orders={orders}
            ventasTab={normalizedHistoryTab}
            ventasHistorialTimeframe={ventasHistorialTimeframe}
            collapseUdiItems={collapseUdiItems}
            getItemUnitPrice={getItemUnitPrice}
            handleReactivateQuote={handleReactivateQuote}
            setViewingCancellationVoucherId={setViewingCancellationVoucherId}
            confirmDeleteId={confirmDeleteId}
            setConfirmDeleteId={setConfirmDeleteId}
            handleDeleteOrder={handleDeleteOrder}
            normRole={normRole}
            setOrderToCollect={setOrderToCollect}
            setManualAmount={setManualAmount}
            setManualReceipt={setManualReceipt}
            setViewingReceiptId={setViewingReceiptId}
            setViewingHistoryOrderId={setViewingHistoryOrderId}
            setViewingInvoiceId={setViewingInvoiceId}
          />
        )}
      </div>
    </div>
  );
};
