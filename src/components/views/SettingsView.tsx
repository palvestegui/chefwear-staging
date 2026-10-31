import React, { useEffect } from 'react';
import { AlertTriangle, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettingsMutations } from '../../hooks/useSettingsMutations';
import { BasePricingTab } from './settings/BasePricingTab';
import { CatalogPricingTab, CatalogGarmentRecord } from './settings/CatalogPricingTab';
import { SpecialPresetsTab } from './settings/SpecialPresetsTab';
import { ServicesCatalogTab } from './settings/ServicesCatalogTab';
import { DiscountRulesTab } from '../pricing/DiscountRulesTab';
import { UsersManagementSection } from './settings/UsersManagementSection';
import { StagingMaintenanceView } from './settings/StagingMaintenanceView';
import { TierDiscountRules } from '../../types/pricing';
import { Firestore } from 'firebase/firestore';

export interface SettingsPricingInput {
  catalogGarments?: Record<string, CatalogGarmentRecord> | CatalogGarmentRecord[];
  garments?: Record<string, Record<string, { priceRaleo: number; priceB2B: number }>>;
  discountRulesByTier?: Record<string, TierDiscountRules>;
  specialPresetDiscounts?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SettingsViewProps {
  pricing: SettingsPricingInput;
  orders: unknown[];
  usersList: unknown[];
  db: unknown;
  isMigrationMode?: boolean;
  setIsMigrationMode?: (val: boolean) => void;
  settingsTab?: 'A' | 'B' | 'C' | 'D' | 'E' | 'seguridad' | 'mantenimiento';
  setSettingsTab?: (tab: 'A' | 'B' | 'C' | 'D' | 'E' | 'seguridad' | 'mantenimiento') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  pricing,
  orders,
  usersList: allUsers,
  db,
  settingsTab = 'A',
  setSettingsTab
}) => {
  const { userProfile, isSuperAdmin, isAdmin } = useAuth();

  const {
    activeSettingsTab, setActiveSettingsTab,
    settingsForm, setSettingsForm,
    showPricingConfirm, setShowPricingConfirm,
    showPricingSuccess,
    pricingValidationError, setPricingValidationError,
    invalidPriceFields,
    activeSpecialPreset, setActiveSpecialPreset,
    newPresetNameInput, setNewPresetNameInput,
    showAddPresetInput, setShowAddPresetInput,
    newPresetInput, setNewPresetInput,
    newPresetFabricInputs, setNewPresetFabricInputs,
    confirmDeletePreset, setConfirmDeletePreset,
    requestUpdatePricing,
    executeUpdatePricing
  } = useSettingsMutations(pricing, db, orders);

  useEffect(() => {
    if (settingsTab && settingsTab !== 'seguridad' && settingsTab !== 'mantenimiento' && settingsTab !== activeSettingsTab) {
      setActiveSettingsTab(settingsTab as 'A' | 'B' | 'C' | 'D' | 'E');
    }
  }, [settingsTab, activeSettingsTab, setActiveSettingsTab]);

  const currentMainTab = settingsTab === 'seguridad' 
    ? 'seguridad' 
    : settingsTab === 'mantenimiento' 
      ? 'mantenimiento' 
      : 'precios';
  const canEditPrices = isSuperAdmin || userProfile?.canEditPrices || isAdmin;
  const canManageRoles = isSuperAdmin || userProfile?.canManageRoles || isAdmin;

  return (
    <div className="w-full space-y-6 animate-in fade-in pb-12">
      {/* Bloque 1: Manejador de Precios */}
      {currentMainTab === 'precios' && (canEditPrices || isSuperAdmin) && (
        <form onSubmit={requestUpdatePricing} className="space-y-6">
          {pricingValidationError && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-2xl flex items-center justify-between text-xs font-bold animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={18} className="shrink-0 text-red-500" />
                <span>{pricingValidationError}</span>
              </div>
              <button type="button" onClick={() => setPricingValidationError(null)} className="text-red-400 hover:text-white transition">
                <X size={16} />
              </button>
            </div>
          )}

          {/* Submenu TARIFARIO BASE (Tab A) */}
          {activeSettingsTab === 'A' && (
            <BasePricingTab settingsForm={settingsForm} />
          )}

          {/* Submenu CATÁLOGO (Tab E) */}
          {activeSettingsTab === 'E' && (
            <CatalogPricingTab pricing={pricing} />
          )}

          {activeSettingsTab === 'B' && (
            <SpecialPresetsTab
              settingsForm={settingsForm}
              setSettingsForm={setSettingsForm}
              activeSpecialPreset={activeSpecialPreset}
              setActiveSpecialPreset={setActiveSpecialPreset}
              showAddPresetInput={showAddPresetInput}
              setShowAddPresetInput={setShowAddPresetInput}
              newPresetNameInput={newPresetNameInput}
              setNewPresetNameInput={setNewPresetNameInput}
              newPresetInput={newPresetInput}
              setNewPresetInput={setNewPresetInput}
              newPresetFabricInputs={newPresetFabricInputs}
              setNewPresetFabricInputs={setNewPresetFabricInputs}
              confirmDeletePreset={confirmDeletePreset}
              setConfirmDeletePreset={setConfirmDeletePreset}
              invalidPriceFields={invalidPriceFields}
              onRequestSave={() => setShowPricingConfirm(true)}
            />
          )}

          {activeSettingsTab === 'C' && (
            <ServicesCatalogTab
              settingsForm={settingsForm}
              setSettingsForm={setSettingsForm}
            />
          )}

          {activeSettingsTab === 'D' && (
            <DiscountRulesTab
              settingsForm={settingsForm}
              setSettingsForm={setSettingsForm}
              pricing={pricing}
            />
          )}
        </form>
      )}

      {/* Confirmation Modal */}
      {showPricingConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/80 p-4">
          <div className="bg-stone-900 border border-stone-800 p-8 rounded-3xl max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2 text-center">¿Estás seguro?</h3>
            <p className="text-sm font-bold text-stone-400 text-center mb-6">
              Esta acción modificará los convenios y tarifas especiales para todos los usuarios.
            </p>
            <div className="flex gap-4">
              <button type="button" onClick={() => setShowPricingConfirm(false)} className="flex-1 bg-stone-800 text-stone-300 font-black py-3 rounded-xl hover:bg-stone-700 transition uppercase tracking-widest text-xs">
                Cancelar
              </button>
              <button type="button" onClick={(e) => executeUpdatePricing(e)} className="flex-1 bg-amber-600 text-white font-black py-3 rounded-xl hover:bg-amber-500 transition uppercase tracking-widest text-xs">
                Sí, Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showPricingSuccess && (
        <div className="fixed top-4 right-4 z-[100] bg-green-500 text-stone-950 px-6 py-4 rounded-2xl font-black shadow-2xl animate-in slide-in-from-right flex items-center gap-3">
          <div className="bg-stone-950/20 p-1.5 rounded-full">
            <CheckCircle2 size={20} />
          </div>
          <span className="uppercase tracking-widest text-xs">
            Configuración Actualizada
          </span>
        </div>
      )}

      {/* Bloque 2: Asignación de Roles y Permisos Granulares */}
      {currentMainTab === 'seguridad' && (canManageRoles || isSuperAdmin) && (
        <UsersManagementSection
          allUsers={allUsers}
          db={db}
        />
      )}

      {/* Bloque 3: Mantenimiento y Purga de Datos (Staging) */}
      {currentMainTab === 'mantenimiento' && (canManageRoles || isSuperAdmin || isAdmin) && (
        <StagingMaintenanceView
          db={db as Firestore}
        />
      )}
    </div>
  );
};
