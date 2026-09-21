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
