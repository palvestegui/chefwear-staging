import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useData } from './contexts/DataContext';
import { db } from './firebase';
import { INITIAL_SIZE_TABLE, INITIAL_SIZE_TABLE_PANTALON, getDocType } from './utils/constants';
import { usePricingEngine } from './hooks/usePricingEngine';
import { useFinanceActions } from './hooks/useFinanceActions';
import { useOrderMutations } from './hooks/useOrderMutations';
import { useOrderCreator } from './hooks/useOrderCreator';
import { downloadOrderImage, getWhatsAppText, getCancellationWhatsAppText } from './utils/pdfGenerator';
import { getCurrentProductionStatus } from './utils/orderUtils';

// Layout & Views
import { MainLayout } from './components/layout/MainLayout';
import { SalesView } from './components/views/SalesView';
import { CRMView } from './components/views/CRMView';
import { OperationsView } from './components/views/OperationsView';
import { ProductionView } from './components/views/ProductionView';
import { LogisticsView } from './components/views/LogisticsView';
import { ReportsView } from './components/views/ReportsView';
import { HistoryView } from './components/views/HistoryView';
import { SizesView } from './components/views/SizesView';
import { PricesView } from './components/views/PricesView';
import { SettingsView } from './components/views/SettingsView';

// Modales Globales
import { NewOrderModal } from './components/modals/NewOrderModal';
import { CollectPaymentModal } from './components/modals/CollectPaymentModal';
import { InvoiceModal } from './components/modals/InvoiceModal';
import { CancellationVoucherModal } from './components/modals/CancellationVoucherModal';
import { ReceiptsModal } from './components/modals/ReceiptsModal';
import { HistoryOrderModal } from './components/modals/HistoryOrderModal';
import { AccountHistoryModal } from './components/modals/AccountHistoryModal';
import { LogosModal } from './components/modals/LogosModal';
import { RefImagesModal } from './components/modals/RefImagesModal';
import { QuickSizeModal } from './components/modals/QuickSizeModal';
import { EditInstitutionalRosterModal } from './components/modals/EditInstitutionalRosterModal';
import { CancelActiveOrderModal } from './components/modals/CancelActiveOrderModal';
import { CancelQuoteModal } from './components/modals/CancelQuoteModal';
import { LoginView } from './components/auth/LoginView';

export const App: React.FC = () => {
  const { user, userProfile, isLoading: authLoading, login, loginAsStagingAdmin, authError, clearAuthError, activeViewRole } = useAuth();
  const { clientAccounts, masterContacts, orders, sizeTables: garmentSizeTablesFromDb, usersList: allUsers, pricing, isLoading: dataLoading } = useData();

  const [activeTab, setActiveTab] = useState('ventas');
  const [settingsTab, setSettingsTab] = useState<'A' | 'B' | 'C' | 'D' | 'E' | 'seguridad'>('A');

  // Role-based landing tab router (runs strictly once upon initial authenticated load)
  const hasSetInitialLandingTab = useRef(false);
  useEffect(() => {
    if (authLoading || !user || !userProfile || hasSetInitialLandingTab.current) return;

    const role = userProfile.role ? userProfile.role.toUpperCase() : '';
    if (role === 'VENTAS') {
      setActiveTab('ventas');
    } else if (role === 'OPERACIONES') {
      setActiveTab('operaciones');
    } else if (role === 'PRODUCCION') {
      setActiveTab('produccion');
    } else if (role === 'ADMIN' || role === 'SUPERADMIN') {
      if (activeViewRole && activeViewRole !== 'admin') {
        setActiveTab(activeViewRole);
      } else {
        setActiveTab('ventas');
      }
    }
    hasSetInitialLandingTab.current = true;
  }, [authLoading, user, userProfile, activeViewRole]);
  const [openNavDropdown, setOpenNavDropdown] = useState<string | null>(null);
  const [ventasTab, setVentasTab] = useState<string>('activas');
  const [ventasHistorialTimeframe, setVentasHistorialTimeframe] = useState<'month' | 'lastMonth' | 'all'>('month');

  // Modales
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [orderToCollect, setOrderToCollect] = useState<any>(null);
  const [manualAmount, setManualAmount] = useState('');
  const [manualReceipt, setManualReceipt] = useState<any>(null);
  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);
  const [viewingCancellationVoucherId, setViewingCancellationVoucherId] = useState<string | null>(null);
  const [viewingReceiptId, setViewingReceiptId] = useState<string | null>(null);
  const [viewingHistoryOrderId, setViewingHistoryOrderId] = useState<string | null>(null);
  const [viewingAccountHistoryId, setViewingAccountHistoryId] = useState<string | null>(null);
  const [viewingLogosOrderId, setViewingLogosOrderId] = useState<string | null>(null);
  const [viewingRefImagesOrderId, setViewingRefImagesOrderId] = useState<string | null>(null);
  const [showQuickSizeModal, setShowQuickSizeModal] = useState(false);
  const [expandedLogoUrl, setExpandedLogoUrl] = useState<string | null>(null);
  const [showWhatsappFormatId, setShowWhatsappFormatId] = useState<string | null>(null);
  const [editingRosterOrder, setEditingRosterOrder] = useState<any | null>(null);
  const [isRosterReadOnly, setIsRosterReadOnly] = useState(false);

  // Estados de Cancelación
  const [cancelActiveOrderModal, setCancelActiveOrderModal] = useState<{ open: boolean; orderId: string; customer: string } | null>(null);
  const [cancelQuoteModal, setCancelQuoteModal] = useState<{ open: boolean; quoteId: string; customer: string } | null>(null);
  const [cancelResolutionType, setCancelResolutionType] = useState('Devolución Total');
  const [cancelPartialRefund, setCancelPartialRefund] = useState(0);
  const [cancelJustification, setCancelJustification] = useState('');
  const [cancelQuoteReason, setCancelQuoteReason] = useState('Presupuesto Alto');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [isMigrationMode, setIsMigrationMode] = useState(() => {
    return localStorage.getItem('isMigrationMode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('isMigrationMode', String(isMigrationMode));
  }, [isMigrationMode]);

  // Tablas de Tallas
  const [garmentSizeTables, setGarmentSizeTables] = useState<any>(garmentSizeTablesFromDb || { filipina: INITIAL_SIZE_TABLE, pantalon: INITIAL_SIZE_TABLE_PANTALON });
  useEffect(() => {
    if (garmentSizeTablesFromDb) setGarmentSizeTables(garmentSizeTablesFromDb);
  }, [garmentSizeTablesFromDb]);

  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenNavDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const isApproved = userProfile?.approved !== false;
  const isWriteDisabled = (view: string) => userProfile?.role === 'LECTURA' || ((userProfile?.role === 'VENDEDOR_PREVENTA' || userProfile?.role === 'VENTAS') && view !== 'ventas');
  const normRole = (r?: string) => r || userProfile?.role || 'LECTURA';
  const formatDate = (d: any) => new Date(d).toLocaleDateString();

  const { getItemUnitPrice, getOrderBreakdown, collapseUdiItems } = usePricingEngine(pricing);
  const { collectBalance, convertToOrder, isProcessingPayment } = useFinanceActions(
    userProfile,
    getOrderBreakdown,
    setOrderToCollect,
    setViewingInvoiceId
  );
  const orderCreator = useOrderCreator(
    pricing,
    editingOrder,
    setEditingOrder,
    setShowNewOrder,
    setOrderToCollect,
    setManualAmount,
    setManualReceipt
  );
  const { updateStatus, handleDeleteOrder, handleReactivateQuote, handleConfirmCancelQuote, handleConfirmCancelActiveOrder } = useOrderMutations(
    orders,
    cancelActiveOrderModal, cancelQuoteModal,
    cancelResolutionType, cancelPartialRefund, cancelJustification, cancelQuoteReason,
    setCancelActiveOrderModal, setCancelQuoteModal, setCancelJustification,
    setCancelPartialRefund, setCancelResolutionType, setConfirmDeleteId,
    setViewingCancellationVoucherId
  );

  const handleEditQuote = (quote: any) => {
    setEditingOrder(quote);
    setShowNewOrder(true);
  };

  if (authLoading || dataLoading) {
    return <div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-300 font-bold">Cargando Sistema...</div>;
  }

  if (!user || !userProfile) {
    return (
      <LoginView
        onLogin={login}
        onBypassLogin={loginAsStagingAdmin}
        authError={authError}
        onClearError={clearAuthError}
      />
    );
  }

  return (
    <MainLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      openNavDropdown={openNavDropdown}
      setOpenNavDropdown={setOpenNavDropdown}
      navRef={navRef}
      isApproved={isApproved}
      ventasTab={ventasTab}
      setVentasTab={setVentasTab}
      settingsTab={settingsTab}
      setSettingsTab={setSettingsTab}
    >
      {activeTab === 'ventas' && (
        <SalesView 
          ventasTab={ventasTab} setVentasTab={setVentasTab}
          ventasHistorialTimeframe={ventasHistorialTimeframe} setVentasHistorialTimeframe={setVentasHistorialTimeframe}
          setShowNewOrder={setShowNewOrder} orders={orders} pricing={pricing} db={db}
          getDocType={getDocType} getCurrentProductionStatus={getCurrentProductionStatus}
          collapseUdiItems={collapseUdiItems} getItemUnitPrice={getItemUnitPrice} getOrderBreakdown={getOrderBreakdown}
          setOrderToCollect={setOrderToCollect} setManualAmount={setManualAmount} setManualReceipt={setManualReceipt}
          setViewingInvoiceId={setViewingInvoiceId} setViewingRefImagesOrderId={setViewingRefImagesOrderId}
          showWhatsappFormatId={showWhatsappFormatId} setShowWhatsappFormatId={setShowWhatsappFormatId}
          downloadOrderImage={downloadOrderImage} getWhatsAppText={getWhatsAppText} normRole={normRole}
          setCancelActiveOrderModal={setCancelActiveOrderModal} setCancelResolutionType={setCancelResolutionType}
          setCancelPartialRefund={setCancelPartialRefund} setCancelJustification={setCancelJustification}
          handleEditQuote={handleEditQuote} setCancelQuoteModal={setCancelQuoteModal} setCancelQuoteReason={setCancelQuoteReason}
          confirmDeleteId={confirmDeleteId} setConfirmDeleteId={setConfirmDeleteId}
          handleDeleteOrder={handleDeleteOrder} handleReactivateQuote={handleReactivateQuote}
          setViewingCancellationVoucherId={setViewingCancellationVoucherId}
          setViewingReceiptId={setViewingReceiptId}
          setViewingHistoryOrderId={setViewingHistoryOrderId}
          onOpenEditRoster={order => {
            setIsRosterReadOnly(false);
            setEditingRosterOrder(order);
          }}
        />
      )}
      
      {activeTab === 'clientes' && isApproved && userProfile?.role !== 'VENTAS' && (
        <CRMView 
          clientAccounts={clientAccounts}
          masterContacts={masterContacts}
          orders={orders}
          pricing={pricing}
          db={db}
          user={user}
          setViewingAccountHistoryId={setViewingAccountHistoryId}
        />
      )}

      {activeTab === 'operaciones' && (
        <OperationsView 
          orders={orders} getDocType={getDocType}
          setViewingLogosOrderId={setViewingLogosOrderId} setViewingReceiptId={setViewingReceiptId}
          setViewingInvoiceId={setViewingInvoiceId} isWriteDisabled={isWriteDisabled}
          updateStatus={updateStatus} setExpandedLogoUrl={setExpandedLogoUrl}
          onOpenEditRoster={(order, readOnly = true) => {
            setIsRosterReadOnly(readOnly);
            setEditingRosterOrder(order);
          }}
        />
      )}

      {activeTab === 'produccion' && (
        <ProductionView 
          orders={orders} setViewingLogosOrderId={setViewingLogosOrderId}
          setViewingInvoiceId={setViewingInvoiceId} isWriteDisabled={isWriteDisabled}
          updateStatus={updateStatus} setExpandedLogoUrl={setExpandedLogoUrl}
          onOpenEditRoster={(order, readOnly = true) => {
            setIsRosterReadOnly(readOnly);
            setEditingRosterOrder(order);
          }}
        />
      )}

      {activeTab === 'logistica' && (
        <LogisticsView orders={orders} isWriteDisabled={isWriteDisabled} updateStatus={updateStatus} />
      )}

      {activeTab === 'reportes' && isApproved && userProfile?.role !== 'VENTAS' && (
        <ReportsView 
          orders={orders} pricing={pricing}
          setExpandedLogoUrl={setExpandedLogoUrl}
          setViewingCancellationVoucherId={setViewingCancellationVoucherId}
        />
      )}

      {activeTab === 'historial' && (
        <HistoryView 
          orders={orders} setViewingInvoiceId={setViewingInvoiceId}
          setOrderToCollect={setOrderToCollect} setManualAmount={setManualAmount}
          setManualReceipt={setManualReceipt} setViewingHistoryOrderId={setViewingHistoryOrderId} setViewingReceiptId={setViewingReceiptId}
          handleDeleteOrder={handleDeleteOrder} confirmDeleteId={confirmDeleteId}
          setConfirmDeleteId={setConfirmDeleteId} normRole={normRole}
        />
      )}

      {activeTab === 'ajustes' && isApproved && userProfile?.role !== 'VENTAS' && pricing && (
        <SettingsView
          pricing={pricing}
          orders={orders}
          usersList={allUsers}
          db={db}
          isMigrationMode={isMigrationMode}
          setIsMigrationMode={setIsMigrationMode}
          settingsTab={settingsTab}
          setSettingsTab={setSettingsTab}
        />
      )}

      {activeTab === 'tallas' && (
        <SizesView garmentSizeTables={garmentSizeTables} setGarmentSizeTables={setGarmentSizeTables} db={db} />
      )}

      {activeTab === 'precios' && pricing && <PricesView pricing={pricing} />}

      {/* Modales Globales */}
      {showNewOrder && (
        <NewOrderModal 
          showNewOrder={showNewOrder}
          setShowNewOrder={setShowNewOrder}
          editingOrder={editingOrder}
          setEditingOrder={setEditingOrder}
          setOrderToCollect={setOrderToCollect}
          setManualAmount={setManualAmount}
          setManualReceipt={setManualReceipt}
          setShowQuickSizeModal={setShowQuickSizeModal}
          orderCreator={orderCreator}
          isMigrationMode={isMigrationMode}
        />
      )}

      {orderToCollect && (
        <CollectPaymentModal 
          orderToCollect={orderToCollect}
          setOrderToCollect={setOrderToCollect}
          manualAmount={manualAmount}
          setManualAmount={setManualAmount}
          manualReceipt={manualReceipt}
          setManualReceipt={setManualReceipt}
          collectBalance={collectBalance}
          convertToOrder={convertToOrder}
          handleCreateOrder={orderCreator.handleCreateOrder}
          getOrderBreakdown={getOrderBreakdown}
          isProcessingPayment={isProcessingPayment || orderCreator.isSubmitting}
          isMigrationMode={isMigrationMode}
        />
      )}

      {viewingInvoiceId && (
        <InvoiceModal 
          viewingInvoice={orders.find(o => o.id === viewingInvoiceId)}
          setViewingInvoiceId={setViewingInvoiceId}
          showWhatsappFormatId={showWhatsappFormatId}
          setShowWhatsappFormatId={setShowWhatsappFormatId}
          getDocType={getDocType}
          formatDate={formatDate}
          collapseUdiItems={collapseUdiItems}
          pricing={pricing}
          getItemUnitPrice={getItemUnitPrice}
          getOrderBreakdown={getOrderBreakdown}
          downloadOrderImage={downloadOrderImage}
          getWhatsAppText={getWhatsAppText}
          onOpenEditRoster={order => {
            setViewingInvoiceId(null);
            setIsRosterReadOnly(false);
            setEditingRosterOrder(order);
          }}
        />
      )}

      {editingRosterOrder && (
        <EditInstitutionalRosterModal
          order={editingRosterOrder}
          isOpen={Boolean(editingRosterOrder)}
          onClose={() => {
            setEditingRosterOrder(null);
            setIsRosterReadOnly(false);
          }}
          db={db}
          pricing={pricing}
          masterContacts={masterContacts}
          readOnly={isRosterReadOnly}
        />
      )}

      {viewingCancellationVoucherId && (
        <CancellationVoucherModal 
          viewingCancellationVoucherId={viewingCancellationVoucherId}
          setViewingCancellationVoucherId={setViewingCancellationVoucherId}
          orders={orders}
          showWhatsappFormatId={showWhatsappFormatId}
          setShowWhatsappFormatId={setShowWhatsappFormatId}
          getDocType={getDocType}
          formatDate={formatDate}
          collapseUdiItems={collapseUdiItems}
          getItemUnitPrice={getItemUnitPrice}
          downloadOrderImage={downloadOrderImage}
          getCancellationWhatsAppText={getCancellationWhatsAppText}
        />
      )}

      {viewingReceiptId && (
        <ReceiptsModal 
          viewingReceiptId={viewingReceiptId}
          setViewingReceiptId={setViewingReceiptId}
          orders={orders}
          showWhatsappFormatId={showWhatsappFormatId}
          setShowWhatsappFormatId={setShowWhatsappFormatId}
          downloadOrderImage={downloadOrderImage}
          formatDate={formatDate}
          setOrderToCollect={setOrderToCollect}
          setManualAmount={setManualAmount}
          setManualReceipt={setManualReceipt}
        />
      )}

      {viewingHistoryOrderId && (
        <HistoryOrderModal 
          viewingHistoryOrderId={viewingHistoryOrderId}
          setViewingHistoryOrderId={setViewingHistoryOrderId}
          orders={orders}
          formatDate={formatDate}
          setViewingInvoiceId={setViewingInvoiceId}
          setOrderToCollect={setOrderToCollect}
          setManualAmount={setManualAmount}
          setManualReceipt={setManualReceipt}
        />
      )}

      {viewingAccountHistoryId && (
        <AccountHistoryModal 
          viewingAccountHistoryId={viewingAccountHistoryId}
          setViewingAccountHistoryId={setViewingAccountHistoryId}
          clientAccounts={clientAccounts}
          orders={orders}
          formatDate={formatDate}
        />
      )}

      {viewingLogosOrderId && (
        <LogosModal 
          order={orders.find(o => o.id === viewingLogosOrderId)} 
          onClose={() => setViewingLogosOrderId(null)} 
          setExpandedLogoUrl={setExpandedLogoUrl} 
        />
      )}

      {viewingRefImagesOrderId && (
        <RefImagesModal 
          order={orders.find(o => o.id === viewingRefImagesOrderId)} 
          onClose={() => setViewingRefImagesOrderId(null)} 
          setExpandedLogoUrl={setExpandedLogoUrl} 
        />
      )}

      {showQuickSizeModal && (
        <QuickSizeModal 
          onClose={() => setShowQuickSizeModal(false)} 
          garmentSizeTables={garmentSizeTables} 
        />
      )}

      {expandedLogoUrl && (
        <div className="fixed inset-0 bg-stone-950/98 backdrop-blur-xl z-[120] flex items-center justify-center p-4">
          <button 
            onClick={() => setExpandedLogoUrl(null)}
            className="absolute top-6 right-6 text-stone-500 hover:text-white transition p-3 rounded-full hover:bg-stone-900 bg-stone-950 border border-stone-800 shadow-xl"
          >
            ✕
          </button>
          <img src={expandedLogoUrl} alt="Expanded Logo" className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl border border-stone-800 shadow-2xl" />
        </div>
      )}

      <CancelActiveOrderModal
        cancelActiveOrderModal={cancelActiveOrderModal}
        setCancelActiveOrderModal={setCancelActiveOrderModal}
        cancelResolutionType={cancelResolutionType}
        setCancelResolutionType={setCancelResolutionType}
        cancelPartialRefund={cancelPartialRefund}
        setCancelPartialRefund={setCancelPartialRefund}
        cancelJustification={cancelJustification}
        setCancelJustification={setCancelJustification}
        handleConfirmCancelActiveOrder={handleConfirmCancelActiveOrder}
      />

      <CancelQuoteModal
        cancelQuoteModal={cancelQuoteModal}
        setCancelQuoteModal={setCancelQuoteModal}
        cancelQuoteReason={cancelQuoteReason}
        setCancelQuoteReason={setCancelQuoteReason}
        handleConfirmCancelQuote={handleConfirmCancelQuote}
      />
    </MainLayout>
  );
};
export default App;
