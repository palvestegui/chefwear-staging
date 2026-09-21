import React, { useState } from 'react';
import { 
  Percent, 
  ChevronDown, 
  ChevronUp, 
  DollarSign, 
  UserCheck, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { 
  TierDiscountRules,
  getEffectiveTierDiscountRules 
} from '../../utils/discountRulesUtils';
import { TierVolumeDiscountEditor } from './TierVolumeDiscountEditor';

export interface TierDiscountRulesCardProps {
  initialTier?: string;
  selectedTier?: string;
  onSelectTier?: (tier: string) => void;
  showTierSelector?: boolean;
  settingsForm: any;
  setSettingsForm: React.Dispatch<React.SetStateAction<any>>;
}

export const TierDiscountRulesCard: React.FC<TierDiscountRulesCardProps> = ({
  initialTier = 'Estándar Raleo',
  selectedTier: controlledTier,
  onSelectTier,
  showTierSelector = true,
  settingsForm,
  setSettingsForm
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [internalTier, setInternalTier] = useState<string>(initialTier);
  const activeTier = controlledTier !== undefined ? controlledTier : internalTier;

  const setActiveTier = (tier: string) => {
    if (onSelectTier) onSelectTier(tier);
    setInternalTier(tier);
  };

  const coreTiers = ['Estándar Raleo', 'Estándar B2B', 'UDI Especial', 'Contrato Institucional'];
  const specialPresetKeys = Object.keys(settingsForm.specialPresets || {}).filter(k => !coreTiers.includes(k));
  const allTiers = [...coreTiers, ...specialPresetKeys];

  const currentRules: TierDiscountRules = getEffectiveTierDiscountRules(
    activeTier,
    settingsForm.discountRulesByTier,
    settingsForm.specialPresetDiscounts
  );

  const updateTierRules = (updates: Partial<TierDiscountRules>) => {
    const updatedTierRule: TierDiscountRules = {
      ...currentRules,
      ...updates
    };

    const updatedDiscountRulesByTier = {
      ...(settingsForm.discountRulesByTier || {}),
      [activeTier]: updatedTierRule
    };

    // Backward-compatibility mirror into specialPresetDiscounts
    const updatedSpecialPresetDiscounts = {
      ...(settingsForm.specialPresetDiscounts || {}),
      [activeTier]: {
        ...updatedTierRule,
        cashDiscountPct: updatedTierRule.cashDiscountPercent,
        cashMinThreshold: updatedTierRule.cashDiscountMinAmount,
        manualDiscountEnabled: updatedTierRule.sellerDiscountEnabled,
        manualMaxPct: updatedTierRule.maxSellerDiscountPercent,
        udiPackageDiscountEnabled: updatedTierRule.fullPackageDiscountEnabled
      }
    };

    setSettingsForm((prev: any) => ({
      ...prev,
      discountRulesByTier: updatedDiscountRulesByTier,
      specialPresetDiscounts: updatedSpecialPresetDiscounts
    }));
  };

  const isUdi = activeTier.toLowerCase().includes('udi');

  return (
    <div className="bg-stone-950 border border-stone-800 hover:border-stone-700/80 rounded-2xl transition-all overflow-hidden shadow-sm">
      {/* Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-900/40 transition cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Percent size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-stone-200 uppercase tracking-wider">
                Reglas de Descuento por Tarifario
              </span>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                {activeTier}
              </span>
              {!currentRules.volumeDiscountEnabled && (
                <span className="text-[9px] font-black text-stone-400 bg-stone-900 border border-stone-800 px-1.5 py-0.5 rounded">
                  Sin Volumen
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-stone-400 shrink-0">
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {isOpen && (
        <div className="p-4 pt-1 border-t border-stone-800/80 space-y-5">
          {/* Tier Selector Navigation (optional) */}
          {showTierSelector && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                Seleccionar Tarifario a Configurar:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {allTiers.map(tier => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setActiveTier(tier)}
                    className={`px-2.5 py-1 rounded-xl text-xs uppercase font-bold transition-all ${
                      activeTier === tier
                        ? 'bg-amber-500 text-stone-950 font-black shadow-sm'
                        : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Embroidery Quarantine Notice */}
          <div className="bg-stone-900/60 border border-stone-800 rounded-xl p-3 flex items-start gap-2.5">
            <ShieldAlert size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <span className="text-[10px] text-stone-400 leading-relaxed">
              <strong className="text-stone-300 uppercase">Cuarentena de Bordados Activa:</strong> Ningún descuento (volumen, contado o vendedor) afectará los servicios de bordado computarizado o matrices. Aplican exclusivamente sobre la confección base.
            </span>
          </div>

          {/* Cash Discount (100% Adelantado) */}
          <div className="bg-stone-900/40 p-3.5 rounded-xl border border-stone-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign size={14} className="text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider text-stone-300">
                  Descuento Pago 100% Contado
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentRules.cashDiscountEnabled}
                  onChange={e => updateTierRules({ cashDiscountEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {currentRules.cashDiscountEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                    Porcentaje Descuento (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={currentRules.cashDiscountPercent}
                    onChange={e => updateTierRules({ cashDiscountPercent: Math.max(0, Number(e.target.value)) })}
                    className="w-full bg-stone-950 border border-stone-800 p-2 rounded-lg text-xs font-bold text-stone-200 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                    Monto Mínimo Requerido (Bs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={currentRules.cashDiscountMinAmount}
                    onChange={e => updateTierRules({ cashDiscountMinAmount: Math.max(0, Number(e.target.value)) })}
                    className="w-full bg-stone-950 border border-stone-800 p-2 rounded-lg text-xs font-bold text-stone-200 outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Volume Discount Section (Modularized) */}
          <TierVolumeDiscountEditor
            activeTier={activeTier}
            volumeDiscountEnabled={currentRules.volumeDiscountEnabled}
            volumeTiers={currentRules.volumeTiers}
            onToggleEnabled={enabled => updateTierRules({ volumeDiscountEnabled: enabled })}
            onUpdateTiers={tiers => updateTierRules({ volumeTiers: tiers })}
          />

          {/* Seller Closing Discount Cap */}
          <div className="bg-stone-900/40 p-3.5 rounded-xl border border-stone-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck size={14} className="text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider text-stone-300">
                  Descuento de Cierre (Vendedor)
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentRules.sellerDiscountEnabled}
                  onChange={e => updateTierRules({ sellerDiscountEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {currentRules.sellerDiscountEnabled && (
              <div className="pt-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                  Tope Máximo Permitido al Vendedor (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={currentRules.maxSellerDiscountPercent}
                    onChange={e => updateTierRules({ maxSellerDiscountPercent: Math.max(0, Number(e.target.value)) })}
                    className="w-32 bg-stone-950 border border-stone-800 p-2 rounded-lg text-xs font-bold text-stone-200 outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Paquete Completo Discount (Set completo institucional o bundle) */}
          <div className="bg-stone-900/40 p-3.5 rounded-xl border border-stone-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider text-stone-300">
                  Descuento Paquete Completo
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(currentRules.fullPackageDiscountEnabled)}
                  onChange={e => updateTierRules({ 
                    fullPackageDiscountEnabled: e.target.checked,
                    fullPackageDiscountPercent: currentRules.fullPackageDiscountPercent || 10
                  })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {currentRules.fullPackageDiscountEnabled && (
              <div className="pt-1">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                  Porcentaje de Descuento por Paquete Completo (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={currentRules.fullPackageDiscountPercent ?? 10}
                    onChange={e => updateTierRules({ fullPackageDiscountPercent: Math.max(0, Number(e.target.value)) })}
                    className="w-32 bg-stone-950 border border-stone-800 p-2 rounded-lg text-xs font-bold text-stone-200 outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-stone-400">
                    Porcentaje aplicado al paquete completo en {activeTier}.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
