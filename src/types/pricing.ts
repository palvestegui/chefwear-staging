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
}

export interface CatalogGarmentPricing {
  priceRaleo: number; // PVP Minorista (Bs)
  priceB2B: number;   // B2B Mayorista (Bs)
  fabric?: string;
  consumptionMeters?: number;
  description?: string;
  category?: string;
  imageUrl?: string;
  fabricVariants?: Record<string, FabricVariantPricing>;
}
