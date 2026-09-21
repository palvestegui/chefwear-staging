import { TierDiscountRules, VolumeTierRule } from '../types/pricing';

export type { TierDiscountRules, VolumeTierRule };

export interface VolumeTier {
  minQty: number;
  discountPct: number;
}

export interface PresetDiscountConfig {
  cashDiscountEnabled: boolean;
  cashDiscountPct: number;
  cashMinThreshold: number;
  volumeDiscountEnabled: boolean;
  volumeTiers: VolumeTier[];
  manualDiscountEnabled: boolean;
  manualMaxPct: number;
  udiPackageDiscountEnabled?: boolean;
}

export const DEFAULT_RALEO_DISCOUNT_RULES: TierDiscountRules = {
  cashDiscountEnabled: true,
  cashDiscountPercent: 10,
  cashDiscountMinAmount: 500,
  volumeDiscountEnabled: true,
  volumeTiers: [
    { minQuantity: 3, discountPercent: 3 },
    { minQuantity: 6, discountPercent: 7 },
    { minQuantity: 12, discountPercent: 10 }
  ],
  sellerDiscountEnabled: true,
  maxSellerDiscountPercent: 5,
  fullPackageDiscountEnabled: false,
  fullPackageDiscountPercent: 0
};

export const DEFAULT_B2B_DISCOUNT_RULES: TierDiscountRules = {
  cashDiscountEnabled: false,
  cashDiscountPercent: 0,
  cashDiscountMinAmount: 0,
  // B2B orders have wholesale pricing and MUST NOT receive volume discounts by default
  volumeDiscountEnabled: false,
  volumeTiers: [
    { minQuantity: 3, discountPercent: 3 },
    { minQuantity: 6, discountPercent: 7 },
    { minQuantity: 12, discountPercent: 10 }
  ],
  sellerDiscountEnabled: true,
  maxSellerDiscountPercent: 10,
  fullPackageDiscountEnabled: false,
  fullPackageDiscountPercent: 0
};

export const DEFAULT_UDI_DISCOUNT_RULES: TierDiscountRules = {
  cashDiscountEnabled: false,
  cashDiscountPercent: 10,
  cashDiscountMinAmount: 0,
  volumeDiscountEnabled: false,
  volumeTiers: [
    { minQuantity: 3, discountPercent: 3 },
    { minQuantity: 6, discountPercent: 7 },
    { minQuantity: 12, discountPercent: 10 }
  ],
  sellerDiscountEnabled: false,
  maxSellerDiscountPercent: 0,
  fullPackageDiscountEnabled: true,
  fullPackageDiscountPercent: 10
};

export const DEFAULT_INSTITUTIONAL_DISCOUNT_RULES: TierDiscountRules = {
  cashDiscountEnabled: false,
  cashDiscountPercent: 0,
  cashDiscountMinAmount: 0,
  volumeDiscountEnabled: false,
  volumeTiers: [
    { minQuantity: 3, discountPercent: 3 },
    { minQuantity: 6, discountPercent: 7 },
    { minQuantity: 12, discountPercent: 10 }
  ],
  sellerDiscountEnabled: true,
  maxSellerDiscountPercent: 5,
  fullPackageDiscountEnabled: false,
  fullPackageDiscountPercent: 0
};

// Backward-compatibility references
export const DEFAULT_STANDARD_DISCOUNT_CONFIG: PresetDiscountConfig = {
  cashDiscountEnabled: DEFAULT_RALEO_DISCOUNT_RULES.cashDiscountEnabled,
  cashDiscountPct: DEFAULT_RALEO_DISCOUNT_RULES.cashDiscountPercent,
  cashMinThreshold: DEFAULT_RALEO_DISCOUNT_RULES.cashDiscountMinAmount,
  volumeDiscountEnabled: DEFAULT_RALEO_DISCOUNT_RULES.volumeDiscountEnabled,
  volumeTiers: DEFAULT_RALEO_DISCOUNT_RULES.volumeTiers.map(t => ({ minQty: t.minQuantity, discountPct: t.discountPercent })),
  manualDiscountEnabled: DEFAULT_RALEO_DISCOUNT_RULES.sellerDiscountEnabled,
  manualMaxPct: DEFAULT_RALEO_DISCOUNT_RULES.maxSellerDiscountPercent,
  udiPackageDiscountEnabled: false
};

export const DEFAULT_UDI_DISCOUNT_CONFIG: PresetDiscountConfig = {
  cashDiscountEnabled: DEFAULT_UDI_DISCOUNT_RULES.cashDiscountEnabled,
  cashDiscountPct: DEFAULT_UDI_DISCOUNT_RULES.cashDiscountPercent,
  cashMinThreshold: DEFAULT_UDI_DISCOUNT_RULES.cashDiscountMinAmount,
  volumeDiscountEnabled: DEFAULT_UDI_DISCOUNT_RULES.volumeDiscountEnabled,
  volumeTiers: DEFAULT_UDI_DISCOUNT_RULES.volumeTiers.map(t => ({ minQty: t.minQuantity, discountPct: t.discountPercent })),
  manualDiscountEnabled: DEFAULT_UDI_DISCOUNT_RULES.sellerDiscountEnabled,
  manualMaxPct: DEFAULT_UDI_DISCOUNT_RULES.maxSellerDiscountPercent,
  udiPackageDiscountEnabled: true
};

export function getDefaultTierDiscountRules(tierKey?: string | null): TierDiscountRules {
  if (!tierKey) {
    return { ...DEFAULT_RALEO_DISCOUNT_RULES, volumeTiers: DEFAULT_RALEO_DISCOUNT_RULES.volumeTiers.map(t => ({ ...t })) };
  }
  const lower = tierKey.trim().toLowerCase();

  if (lower.includes('b2b') || lower.includes('mayorista')) {
    return { ...DEFAULT_B2B_DISCOUNT_RULES, volumeTiers: DEFAULT_B2B_DISCOUNT_RULES.volumeTiers.map(t => ({ ...t })) };
  }
  if (lower.includes('udi')) {
    return { ...DEFAULT_UDI_DISCOUNT_RULES, volumeTiers: DEFAULT_UDI_DISCOUNT_RULES.volumeTiers.map(t => ({ ...t })) };
  }
  if (lower.includes('institucional') || lower.includes('contrato')) {
    return { ...DEFAULT_INSTITUTIONAL_DISCOUNT_RULES, volumeTiers: DEFAULT_INSTITUTIONAL_DISCOUNT_RULES.volumeTiers.map(t => ({ ...t })) };
  }
  return { ...DEFAULT_RALEO_DISCOUNT_RULES, volumeTiers: DEFAULT_RALEO_DISCOUNT_RULES.volumeTiers.map(t => ({ ...t })) };
}

export function normalizeTierDiscountRules(raw: any, fallback: TierDiscountRules): TierDiscountRules {
  if (!raw || typeof raw !== 'object') return fallback;

  const cashEnabled = raw.cashDiscountEnabled !== undefined ? Boolean(raw.cashDiscountEnabled) : fallback.cashDiscountEnabled;
  const cashPct = raw.cashDiscountPercent !== undefined 
    ? Number(raw.cashDiscountPercent) 
    : (raw.cashDiscountPct !== undefined ? Number(raw.cashDiscountPct) : fallback.cashDiscountPercent);
  const cashMin = raw.cashDiscountMinAmount !== undefined 
    ? Number(raw.cashDiscountMinAmount) 
    : (raw.cashMinThreshold !== undefined ? Number(raw.cashMinThreshold) : fallback.cashDiscountMinAmount);

  const volEnabled = raw.volumeDiscountEnabled !== undefined ? Boolean(raw.volumeDiscountEnabled) : fallback.volumeDiscountEnabled;

  const rawTiers = Array.isArray(raw.volumeTiers) && raw.volumeTiers.length > 0 ? raw.volumeTiers : fallback.volumeTiers;
  const volumeTiers: VolumeTierRule[] = rawTiers.map((t: any) => ({
    minQuantity: Math.max(1, Number(t.minQuantity ?? t.minQty ?? 1)),
    discountPercent: Math.max(0, Number(t.discountPercent ?? t.discountPct ?? 0))
  })).sort((a, b) => a.minQuantity - b.minQuantity);

  const sellerEnabled = raw.sellerDiscountEnabled !== undefined 
    ? Boolean(raw.sellerDiscountEnabled) 
    : (raw.manualDiscountEnabled !== undefined ? Boolean(raw.manualDiscountEnabled) : fallback.sellerDiscountEnabled);
  const maxSellerPct = raw.maxSellerDiscountPercent !== undefined 
    ? Number(raw.maxSellerDiscountPercent) 
    : (raw.manualMaxPct !== undefined ? Number(raw.manualMaxPct) : fallback.maxSellerDiscountPercent);

  const fullPkgEnabled = raw.fullPackageDiscountEnabled !== undefined 
    ? Boolean(raw.fullPackageDiscountEnabled) 
    : (raw.udiPackageDiscountEnabled !== undefined ? Boolean(raw.udiPackageDiscountEnabled) : fallback.fullPackageDiscountEnabled);
  const fullPkgPct = raw.fullPackageDiscountPercent !== undefined 
    ? Number(raw.fullPackageDiscountPercent) 
    : fallback.fullPackageDiscountPercent;

  return {
    cashDiscountEnabled: cashEnabled,
    cashDiscountPercent: cashPct,
    cashDiscountMinAmount: cashMin,
    volumeDiscountEnabled: volEnabled,
    volumeTiers,
    sellerDiscountEnabled: sellerEnabled,
    maxSellerDiscountPercent: maxSellerPct,
    fullPackageDiscountEnabled: fullPkgEnabled,
    fullPackageDiscountPercent: fullPkgPct
  };
}

export function getEffectiveTierDiscountRules(
  tierKey?: string | null,
  discountRulesByTier?: Record<string, TierDiscountRules>,
  legacyPresetDiscounts?: Record<string, any>
): TierDiscountRules {
  const defaultRules = getDefaultTierDiscountRules(tierKey);
  if (!tierKey) return defaultRules;

  // Direct exact match
  if (discountRulesByTier && discountRulesByTier[tierKey]) {
    return normalizeTierDiscountRules(discountRulesByTier[tierKey], defaultRules);
  }

  // Case-insensitive match
  if (discountRulesByTier) {
    const matchedKey = Object.keys(discountRulesByTier).find(
      k => k.trim().toLowerCase() === tierKey.trim().toLowerCase()
    );
    if (matchedKey && discountRulesByTier[matchedKey]) {
      return normalizeTierDiscountRules(discountRulesByTier[matchedKey], defaultRules);
    }
  }

  // Fallback to legacy presets if present
  if (legacyPresetDiscounts && legacyPresetDiscounts[tierKey]) {
    return normalizeTierDiscountRules(legacyPresetDiscounts[tierKey], defaultRules);
  }

  return defaultRules;
}

export const getEffectiveDiscountConfig = (
  presetKey?: string | null,
  allPresetDiscounts?: Record<string, any>
): PresetDiscountConfig => {
  const rules = getEffectiveTierDiscountRules(presetKey, allPresetDiscounts, allPresetDiscounts);
  return {
    cashDiscountEnabled: rules.cashDiscountEnabled,
    cashDiscountPct: rules.cashDiscountPercent,
    cashMinThreshold: rules.cashDiscountMinAmount,
    volumeDiscountEnabled: rules.volumeDiscountEnabled,
    volumeTiers: rules.volumeTiers.map(t => ({ minQty: t.minQuantity, discountPct: t.discountPercent })),
    manualDiscountEnabled: rules.sellerDiscountEnabled,
    manualMaxPct: rules.maxSellerDiscountPercent,
    udiPackageDiscountEnabled: rules.fullPackageDiscountEnabled
  };
};

export const getVolumeDiscountPct = (
  qty: number,
  tiers: Array<{ minQuantity?: number; minQty?: number; discountPercent?: number; discountPct?: number }>
): number => {
  if (!tiers || tiers.length === 0) return 0;
  const sorted = [...tiers]
    .map(t => ({
      minQty: Number(t.minQuantity ?? t.minQty ?? 0),
      discountPct: Number(t.discountPercent ?? t.discountPct ?? 0)
    }))
    .sort((a, b) => b.minQty - a.minQty);

  for (const tier of sorted) {
    if (qty >= tier.minQty) {
      return tier.discountPct;
    }
  }
  return 0;
};
