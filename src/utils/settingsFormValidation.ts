import { isPricingMetadataKey } from '../domains/pricing/fabricAliasMap';
import { TierDiscountRules } from '../types/pricing';

export type GarmentVariantEntry =
  | number
  | {
      priceRaleo?: number;
      priceB2B?: number;
      isPrimary?: boolean;
      fabricSku?: string;
      sku?: string;
    };

export type GarmentFabricMap = Record<string, GarmentVariantEntry>;
export type PresetGarmentMap = Record<string, Record<string, unknown>>;

export interface SettingsServiceEntry {
  name?: string;
  type?: string;
  price?: number | null;
  exclusionGroup?: string;
  isGlobal?: boolean;
  garment?: string;
  appliesToStandard?: string[];
  appliesToSpecial?: Record<string, string[]>;
  [key: string]: unknown;
}

export interface SettingsFormState {
  garments: Record<string, GarmentFabricMap>;
  udiPricing: Record<string, unknown>;
  specialPresets: Record<string, PresetGarmentMap>;
  specialPresetServices: Record<string, unknown>;
  specialPresetIncludedServices: Record<string, unknown>;
  specialPresetBundles: Record<string, unknown>;
  specialPresetDiscounts: Record<string, unknown>;
  discountRulesByTier: Record<string, TierDiscountRules>;
  services: SettingsServiceEntry[];
  exclusionGroups?: string[];
  catalogGarments?: unknown;
  [key: string]: unknown;
}

export interface SettingsPricingLike {
  garments?: Record<string, GarmentFabricMap>;
  udiPricing?: Record<string, unknown>;
  specialPresets?: Record<string, PresetGarmentMap>;
  specialPresetServices?: Record<string, unknown>;
  specialPresetIncludedServices?: Record<string, unknown>;
  specialPresetBundles?: Record<string, unknown>;
  specialPresetDiscounts?: Record<string, unknown>;
  discountRulesByTier?: Record<string, TierDiscountRules>;
  services?: SettingsServiceEntry[];
  exclusionGroups?: string[];
  catalogGarments?: unknown;
  [key: string]: unknown;
}

function extractNumericPrice(val: unknown): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && val !== null) {
    const entry = val as { priceRaleo?: unknown; priceB2B?: unknown };
    return Number(entry.priceRaleo || entry.priceB2B || 0);
  }
  return 0;
}

export function validateSettingsPricingForm(settingsForm: SettingsFormState): Set<string> {
  const invalid = new Set<string>();

  Object.keys(settingsForm.garments).forEach((garment) => {
    const fabrics = settingsForm.garments[garment] || {};
    Object.keys(fabrics).forEach((fabric) => {
      if (isPricingMetadataKey(fabric)) return;
      if (garment === 'Gorro' && (fabric.includes('Tornado') || fabric.includes('Gabardina de 1ra'))) return;
      const val = fabrics[fabric];
      const numVal = extractNumericPrice(val);
      if (val === undefined || val === null || Number.isNaN(numVal) || numVal <= 0) {
        invalid.add(`tabA:${garment}:${fabric}`);
        invalid.add(`tabA:${garment}:${fabric}:raleo`);
        invalid.add(`tabA:${garment}:${fabric}:b2b`);
      }
    });
  });

  const currentPresets = settingsForm.specialPresets || {};
  Object.keys(currentPresets).forEach((pKey) => {
    const pData = currentPresets[pKey] || {};
    Object.keys(pData).forEach((garment) => {
      const fabrics = (pData[garment] || {}) as Record<string, unknown>;
      Object.keys(fabrics).forEach((fabric) => {
        if (isPricingMetadataKey(fabric)) return;
        const val = fabrics[fabric];
        const numVal = extractNumericPrice(val);
        if (val === undefined || val === null || Number.isNaN(numVal) || numVal <= 0) {
          invalid.add(`tabB:${pKey}:${garment}:${fabric}`);
        }
      });
    });
  });

  return invalid;
}
