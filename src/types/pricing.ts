export interface VolumeTierRule {
  minQuantity: number;
  discountPercent: number;
}

export interface TierDiscountRules {
  cashDiscountEnabled: boolean;
  cashDiscountPercent: number;
  cashDiscountMinAmount: number;
  volumeDiscountEnabled: boolean;
  volumeTiers: Array<{ minQuantity: number; discountPercent: number }>;
  sellerDiscountEnabled: boolean;
  maxSellerDiscountPercent: number; // Discretionary cap for salespeople
  fullPackageDiscountEnabled?: boolean;
  fullPackageDiscountPercent?: number;
}

export type DiscountRulesByTier = Record<string, TierDiscountRules>;

export interface FabricVariantPricing {
  priceRaleo: number;
  priceB2B: number;
  fabricSku?: string;
  sku?: string;
}

export interface FabricVariant {
  fabricName?: string;
  fabricSku?: string;
  sku?: string;
  priceRaleo: number;
  priceB2B: number;
  isPrimary?: boolean;
}

export interface PricingGarment {
  name?: string;
  sku?: string;
  category?: string;
  fabrics?: Record<string, FabricVariant | number>;
  [fabricName: string]: unknown;
}

export interface CatalogGarmentEntry {
  id?: string;
  name?: string;
  sku?: string;
  category?: string;
  description?: string;
  defaultFabric?: string;
  defaultFabricName?: string;
  defaultFabricId?: string;
  priceRaleo?: number;
  priceB2B?: number;
  fabricVariants?: Record<string, FabricVariant>;
  variants?: FabricVariant[];
}

export interface CatalogGarmentPricing {
  priceRaleo: number; // PVP Minorista (Bs)
  priceB2B: number;   // B2B Mayorista (Bs)
  sku?: string;
  fabric?: string;
  consumptionMeters?: number;
  description?: string;
  category?: string;
  imageUrl?: string;
  frontImage?: string;
  image?: string;
  backImageUrl?: string;
  backImage?: string;
  fabricVariants?: Record<string, FabricVariantPricing>;
}

export interface SpecialPresetBundle {
  id: string;
  name: string;
  garments: string[];
}

export interface SpecialGarmentData {
  baseGarment?: string;
  [fabricName: string]: number | string | undefined;
}
