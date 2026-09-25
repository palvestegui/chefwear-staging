import React, { useState } from 'react';
import { 
  Wrench, 
  Trash2, 
  RefreshCw, 
  ShieldAlert, 
  Tag, 
  ShoppingCart, 
  Loader2, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  Download 
} from 'lucide-react';
import { doc, getDoc, Firestore } from 'firebase/firestore';
import { db as defaultDb } from '../../../firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useData } from '../../../contexts/DataContext';
import { showSuccessToast, showErrorToast } from '../../../utils/toastUtils';
import { 
  purgeQuotesAndOrders, 
  purgeStagingData, 
  resetCatalogPricing, 
  restoreCanonicalServices 
} from '../../../utils/maintenanceUtils';
import { MaintenanceActionCard } from './MaintenanceActionCard';
import canonicalData from '../../../data/canonicalServicesAndUdi.json';
import { PricingData } from '../../../types';

export interface StagingMaintenanceViewProps {
  db?: Firestore;
  onNotify?: (msg: string, type: 'success' | 'error') => void;
  setPricing?: (data: PricingData | null) => void;
}

export const StagingMaintenanceView: React.FC<StagingMaintenanceViewProps> = ({ 
  db: propDb,
  onNotify,
  setPricing: propSetPricing
}) => {
  const firestore = propDb || defaultDb;
  const { user } = useAuth();
  const { setPricing: contextSetPricing } = useData();
  const updatePricingState = propSetPricing || contextSetPricing;

  const [confirmingAction, setConfirmingAction] = useState<'catalog' | 'services' | 'orders' | 'total' | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isResettingCatalog, setIsResettingCatalog] = useState(false);
  const [isRestoringServices, setIsRestoringServices] = useState(false);
  const [isPurgingOrders, setIsPurgingOrders] = useState(false);
  const [isFactoryResetting, setIsFactoryResetting] = useState(false);

  const isBusy = isSyncing || isResettingCatalog || isRestoringServices || isPurgingOrders || isFactoryResetting;

  const notifyResult = (msg: string, isError = false) => {
    setSuccessMessage(msg);
    if (isError) {
      showErrorToast(msg);
      onNotify?.(msg, 'error');
    } else {
      showSuccessToast(msg);
      onNotify?.(msg, 'success');
    }
  };

  const handleSyncFromPrecios = async () => {
    setIsSyncing(true);
    setSuccessMessage(null);
    try {
      console.log("[Maintenance] Pulling fresh pricing/global from Firestore...");
      const snap = await getDoc(doc(firestore, "pricing", "global"));
      if (snap.exists()) {
        const data = snap.data() as PricingData;
        updatePricingState?.(data);
        notifyResult("✓ Tarifario y Catálogo sincronizados con éxito desde Precios");
      } else {
        notifyResult("⚠️ No se encontró el documento pricing/global en Firestore", true);
      }
    } catch (err: unknown) {
      console.error("[Maintenance] Error pulling pricing:", err);
      const errMsg = "❌ Error: " + (err instanceof Error ? err.message : String(err));
      notifyResult(errMsg, true);
    } finally {
      setIsSyncing(false);
    }
  };

  const executeResetCatalog = async () => {
    setIsResettingCatalog(true);
    setSuccessMessage(null);
    try {
      await resetCatalogPricing(firestore);
      notifyResult("✓ Catálogo de prendas vaciado con éxito en Firestore (Servicios y UDI preservados)");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      notifyResult(`Error al vaciar catálogo: ${msg}`, true);
    } finally {
      setIsResettingCatalog(false);
      setConfirmingAction(null);
    }
  };

  const executeRestoreServicesAndUdi = async () => {
    setIsRestoringServices(true);
    setSuccessMessage(null);
    try {
      await restoreCanonicalServices(firestore, canonicalData);
      notifyResult("✓ Servicios y tarifas UDI restaurados con éxito desde datos canónicos");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      notifyResult(`Error al restaurar servicios: ${msg}`, true);
    } finally {
      setIsRestoringServices(false);
      setConfirmingAction(null);
    }
  };

  const executePurgeQuotesAndOrders = async () => {
    setIsPurgingOrders(true);
    setSuccessMessage(null);
    try {
      const total = await purgeQuotesAndOrders(firestore);
      notifyResult(`✓ Cotizaciones y pedidos purgados (${total} registros)`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido al purgar pedidos';
      notifyResult(`Error al purgar pedidos: ${msg}`, true);
    } finally {
      setIsPurgingOrders(false);
      setConfirmingAction(null);
    }
  };

  const executeFactoryReset = async () => {
    setIsFactoryResetting(true);
    setSuccessMessage(null);
    try {
      await purgeStagingData(firestore, user, canonicalData);
      notifyResult('✓ Datos de staging purgados (ACC-000 y ACC-001 preservados)');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido en la limpieza total';
      notifyResult(`Error en limpieza total: ${msg}`, true);
    } finally {
      setIsFactoryResetting(false);
      setConfirmingAction(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in max-w-6xl">
      {/* Header Panel */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-stone-100 uppercase tracking-tight">
              Mantenimiento y Purga de Datos (Staging)
            </h2>
            <p className="text-xs text-stone-400 font-mono">
              Herramientas de depuración técnica para vaciar registros de prueba y sincronizar cuentas semilla.
            </p>
          </div>
        </div>

        {isBusy && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>
              {isSyncing && 'Sincronizando Precios...'}
              {isResettingCatalog && 'Vaciando Catálogo...'}
              {isRestoringServices && 'Restaurando Servicios...'}
              {isPurgingOrders && 'Purgando Pedidos...'}
              {isFactoryResetting && 'Limpieza Total en Curso...'}
            </span>
          </div>
        )}
      </div>

      {/* Inline Feedback Banner */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Safeguard Notice */}
      <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 flex items-start gap-3 text-xs font-mono">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold uppercase tracking-wider text-emerald-400">
            Salvaguarda de Cuentas Maestras
          </div>
          <p className="text-stone-300">
            Las cuentas <strong className="text-emerald-300">ACC-000 (Cliente Particular)</strong> y <strong className="text-emerald-300">ACC-001 (Universidad UDI)</strong> están blindadas del borrado y se re-sincronizan automáticamente para garantizar la integridad operativa.
          </p>
        </div>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Catálogo de Precios */}
        <MaintenanceActionCard
          icon={<Tag className="w-4 h-4" />}
          title="Catálogo de Precios"
          description={<>Sincroniza desde el tarifario oficial o vacía las prendas (<code className="text-stone-300">garments</code> y <code className="text-stone-300">catalog</code>).</>}
          actionKey="catalog"
          confirmingAction={confirmingAction}
          onStartConfirm={setConfirmingAction}
          onCancel={() => setConfirmingAction(null)}
          onExecute={executeResetCatalog}
          isLoading={isResettingCatalog}
          isBusy={isBusy}
          defaultLabel="Restablecer / Vaciar Catálogo"
          confirmLabel="⚠️ SÍ, VACIAR AHORA"
          defaultIcon={<RefreshCw className="w-4 h-4 text-stone-400" />}
          topAction={
            <button
              type="button"
              onClick={handleSyncFromPrecios}
              disabled={isBusy}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-500/20"
            >
              {isSyncing ? (
                <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
              ) : (
                <Download className="w-4 h-4 text-stone-950" />
              )}
              <span>Sincronizar desde Precios</span>
            </button>
          }
        />

        {/* Card 2: Restaurar Servicios y UDI */}
        <MaintenanceActionCard
          icon={<Sparkles className="w-4 h-4" />}
          title="Servicios y UDI"
          description={<>Restaura la matriz canónica de servicios, convenios especiales y tarifas UDI en <code className="text-stone-300">pricing/global</code>.</>}
          actionKey="services"
          confirmingAction={confirmingAction}
          onStartConfirm={setConfirmingAction}
          onCancel={() => setConfirmingAction(null)}
          onExecute={executeRestoreServicesAndUdi}
          isLoading={isRestoringServices}
          isBusy={isBusy}
          defaultLabel="Restaurar Servicios y UDI"
          confirmLabel="⚠️ SÍ, RESTAURAR AHORA"
          defaultIcon={<Sparkles className="w-4 h-4 text-amber-400" />}
        />

        {/* Card 3: Cotizaciones y Pedidos */}
        <MaintenanceActionCard
          icon={<ShoppingCart className="w-4 h-4" />}
          title="Cotizaciones y Pedidos"
          description="Elimina todos los pedidos, cotizaciones, ítems y modificadores de prueba en Firestore."
          actionKey="orders"
          confirmingAction={confirmingAction}
          onStartConfirm={setConfirmingAction}
          onCancel={() => setConfirmingAction(null)}
          onExecute={executePurgeQuotesAndOrders}
          isLoading={isPurgingOrders}
          isBusy={isBusy}
          defaultLabel="Purgar Cotizaciones y Pedidos"
          confirmLabel="⚠️ SÍ, PURGAR PEDIDOS"
          defaultIcon={<Trash2 className="w-4 h-4 text-stone-400" />}
        />

        {/* Card 4: Reinicio Completo */}
        <MaintenanceActionCard
          icon={<ShieldAlert className="w-4 h-4" />}
          title="Reinicio Completo"
          description={<>Limpieza total de staging. Conserva <strong className="text-amber-400">ACC-000</strong> y <strong className="text-amber-400">ACC-001</strong>.</>}
          actionKey="total"
          confirmingAction={confirmingAction}
          onStartConfirm={setConfirmingAction}
          onCancel={() => setConfirmingAction(null)}
          onExecute={executeFactoryReset}
          isLoading={isFactoryResetting}
          isBusy={isBusy}
          defaultLabel="Limpieza Total de Staging"
          confirmLabel="⚠️ SÍ, LIMPIAR TODO"
          defaultIcon={<CheckCircle2 className="w-4 h-4 text-white" />}
          isRedVariant={true}
        />
      </div>
    </div>
  );
};
