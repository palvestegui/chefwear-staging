import React, { useState, useMemo } from 'react';
import { Percent, Building2, User, Users, GraduationCap, CheckCircle2 } from 'lucide-react';
import { TierDiscountRulesCard } from './TierDiscountRulesCard';
import { getEffectiveTierDiscountRules } from '../../utils/discountRulesUtils';
import { TierDiscountRules } from '../../types/pricing';

export interface DiscountRulesTabProps {
  settingsForm: {
    specialPresets?: Record<string, unknown>;
    discountRulesByTier?: Record<string, TierDiscountRules>;
    specialPresetDiscounts?: Record<string, unknown>;
    [key: string]: unknown;
  };
  setSettingsForm: React.Dispatch<React.SetStateAction<unknown>>;
  pricing?: {
    discountRulesByTier?: Record<string, TierDiscountRules>;
    specialPresetDiscounts?: Record<string, unknown>;
    [key: string]: unknown;
  } | null;
}

export const DiscountRulesTab: React.FC<DiscountRulesTabProps> = ({
  settingsForm,
  setSettingsForm,
  pricing
}) => {
  const [selectedTier, setSelectedTier] = useState<string>('Estándar Raleo');

  const hasChanges = useMemo(() => {
    if (!pricing) return false;
    const initialRules = JSON.stringify({
      discountRulesByTier: pricing.discountRulesByTier || {},
      specialPresetDiscounts: pricing.specialPresetDiscounts || {}
    });
    const currentRules = JSON.stringify({
      discountRulesByTier: settingsForm.discountRulesByTier || {},
      specialPresetDiscounts: settingsForm.specialPresetDiscounts || {}
    });
    return initialRules !== currentRules;
  }, [pricing, settingsForm.discountRulesByTier, settingsForm.specialPresetDiscounts]);

  // Core tiers strictly: Estándar Raleo, Estándar B2B. Corporate tiers derived dynamically from specialPresets
  const coreTiers = ['Estándar Raleo', 'Estándar B2B'];
  const specialPresetKeys = Object.keys(settingsForm?.specialPresets || {}).filter(
    k => !coreTiers.includes(k) && k !== 'Contrato Institucional'
  );
  const allTiers = [...coreTiers, ...specialPresetKeys];

  const activeTierEffective = allTiers.includes(selectedTier) ? selectedTier : 'Estándar Raleo';

  const getTierIcon = (tier: string) => {
    if (tier === 'Estándar Raleo') return <User size={14} className="text-amber-400" />;
    if (tier === 'Estándar B2B') return <Building2 size={14} className="text-amber-400" />;
    if (tier.includes('UDI')) return <GraduationCap size={14} className="text-amber-400" />;
    return <Users size={14} className="text-stone-400" />;
  };

  const getTierBadge = (tier: string) => {
    if (tier === 'Estándar Raleo') return 'Minorista / Público';
    if (tier === 'Estándar B2B') return 'Mayorista';
    if (tier === 'UDI Especial') return 'Convenio UDI';
    return 'Tarifario Personalizado';
  };

  return (
    <div className="animate-in fade-in space-y-6">
      {/* Informational Header */}
      <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 flex items-center gap-3 shadow-sm">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
          <Percent size={18} className="text-amber-500" />
        </div>
        <h3 className="text-sm font-black uppercase tracking-wider text-white">
          Políticas Financieras y Reglas de Descuento
        </h3>
      </div>

      {/* Tier Selector Grid / Pills */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">
            Seleccionar Tarifario a Configurar:
          </label>
          <span className="text-[10px] text-amber-500 font-bold">
            Tarifario seleccionado: {activeTierEffective}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {allTiers.map(tier => {
            const isSelected = activeTierEffective === tier;
            const rules = getEffectiveTierDiscountRules(
              tier,
              settingsForm?.discountRulesByTier as Record<string, TierDiscountRules> | undefined,
              settingsForm?.specialPresetDiscounts as Record<string, unknown> | undefined
            );

            return (
              <button
                key={tier}
                type="button"
                id={`tier-select-btn-${tier.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => setSelectedTier(tier)}
                className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/60 shadow-lg shadow-amber-950/30 ring-1 ring-amber-500/40'
                    : 'bg-stone-950 hover:bg-stone-900/60 border-stone-800 text-stone-400'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 truncate">
                    {getTierIcon(tier)}
                    <span className={`text-xs font-black truncate uppercase ${isSelected ? 'text-amber-400' : 'text-stone-300'}`}>
                      {tier}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  )}
                </div>

                <div className="flex items-center justify-between text-[9px] text-stone-500 font-bold pt-1 border-t border-stone-800/60">
                  <span>{getTierBadge(tier)}</span>
                  <div className="flex items-center gap-1.5">
                    {rules.cashDiscountEnabled && (
                      <span className="text-emerald-400" title="Contado activo">
                        {rules.cashDiscountPercent}% Cont
                      </span>
                    )}
                    {rules.volumeDiscountEnabled ? (
                      <span className="text-amber-400" title="Volumen habilitado">
                        Vol: On
                      </span>
                    ) : (
                      <span className="text-stone-600" title="Volumen inactivo">
                        Vol: Off
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Discount Rules Editor for Selected Tier */}
      <TierDiscountRulesCard
        key={activeTierEffective}
        selectedTier={activeTierEffective}
        onSelectTier={setSelectedTier}
        showTierSelector={false}
        settingsForm={settingsForm}
        setSettingsForm={setSettingsForm as unknown as React.Dispatch<React.SetStateAction<unknown>>}
      />

      {/* Sticky Save Bar matching Servicios */}
      <div className="sticky bottom-3 z-20 bg-stone-900/95 backdrop-blur-md p-3 rounded-2xl border border-amber-500/30 shadow-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-stone-300 font-medium">
          <span className={`w-2 h-2 rounded-full ${hasChanges ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
          <span>
            {hasChanges ? (
              <strong className="text-amber-400">Cambios pendientes de guardar</strong>
            ) : (
              <span className="text-stone-400">Políticas sincronizadas</span>
            )}
          </span>
        </div>
        <button
          type="submit"
          id="btn-save-discounts-sticky"
          disabled={!hasChanges}
          className="w-auto ml-auto px-6 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl bg-amber-500 text-stone-950 hover:bg-amber-400 shadow-md shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CheckCircle2 size={15} /> Guardar Políticas de Descuento
        </button>
      </div>
    </div>
  );
};
