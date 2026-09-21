import { 
  getEffectiveTierDiscountRules,
  getEffectiveDiscountConfig, 
  getVolumeDiscountPct,
  TierDiscountRules
} from './discountRulesUtils';
import {
  getPricingTierFromClientType,
  resolveOrderTier
} from './pricingTierUtils';
import {
  calculateVolumeScaledServiceUnitPrice,
  isSubcontractedEmbroideryService,
  calculateOrderWideLogoQuantity,
  extractItemEmbroideryCostBreakdown
} from './embroideryPricingUtils';
import { collapseUdiItems } from './udiPackageUtils';
import { consolidateCommercialItems } from './orderItemConsolidation';
import { calculateUdiPackageDiscount } from '../domains/udi/udiBundleEngine';

export {
  calculateVolumeScaledServiceUnitPrice,
  isSubcontractedEmbroideryService,
  calculateOrderWideLogoQuantity,
  extractItemEmbroideryCostBreakdown,
  collapseUdiItems,
  consolidateCommercialItems,
  getPricingTierFromClientType,
  resolveOrderTier
};

export const getGarmentPriceValue = (garmentsObj: any, garmentName: string, fabricName: string, isB2B: boolean): number => {
  if (!garmentsObj || !garmentName || !fabricName) return 0;
  
  let garmentKey = garmentName;
  if (!garmentsObj[garmentKey]) {
    const foundGKey = Object.keys(garmentsObj).find(k => k.toLowerCase() === garmentName.toLowerCase());
    if (foundGKey) garmentKey = foundGKey;
    else return 0;
  }

  const gObj = garmentsObj[garmentKey];
  if (!gObj) return 0;

  let val = gObj[fabricName];
  if (val === undefined || val === null) {
    const foundFKey = Object.keys(gObj).find(f => f.toLowerCase() === fabricName.toLowerCase());
    if (foundFKey) val = gObj[foundFKey];
  }

  if ((val === undefined || val === null) && Object.keys(gObj).length > 0) {
    val = Object.values(gObj)[0];
  }

  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && val !== null) {
    if (isB2B) {
      return val.priceB2B !== undefined && val.priceB2B !== null ? Number(val.priceB2B) : (Number(val.priceRaleo) || 0);
    }
    return val.priceRaleo !== undefined && val.priceRaleo !== null ? Number(val.priceRaleo) : (Number(val.priceB2B) || 0);
  }
  return 0;
};

export interface DiscountEngineResult {
  subtotal: number;
  discountableSubtotal?: number;
  quarantinedSubtotal?: number;
  lines: { label: string; amount: number }[];
  volumeDiscountAmt: number;
  cashDiscountAmt: number;
  packageDiscountAmt: number;
  manualDiscountAmt: number;
  overallVolPct: number;
  overallCashPct: number;
  cashDiscountPct: number;
  overallAutoPct: number;
  manualDisc: number;
  total: number;
}

export const computeDiscountEngine = (
  itemsList: any[],
  category: string = 'Personal',
  paymentMethod: string = '50/50 - Adelantado/Entrega',
  manualDiscount: number = 0,
  clientType?: string,
  accountId?: string,
  calculateItemPriceRawFn?: (item: any, cat?: string, accId?: string, orderItems?: any[]) => number,
  discountRulesByTierOrPresets?: Record<string, any>,
  migrationFlatDiscount: number = 0,
  pricingServices?: any[]
): DiscountEngineResult => {
  const collapsedItems = collapseUdiItems(itemsList || []);
  const getPrice = calculateItemPriceRawFn || (() => 0);

  // MIGRATION OVERRIDE: If there's a migration flat discount, completely bypass ALL discount rules.
  if (migrationFlatDiscount > 0) {
    let subtotal = 0;
    collapsedItems.forEach(item => {
      subtotal += getPrice(item, category, accountId, collapsedItems);
    });

    const total = Math.max(0, subtotal - migrationFlatDiscount);
    const lines = [{ label: 'Descuento Aplicado', amount: migrationFlatDiscount }];

    return {
      subtotal,
      discountableSubtotal: subtotal,
      quarantinedSubtotal: 0,
      lines,
      volumeDiscountAmt: 0,
      cashDiscountAmt: 0,
      packageDiscountAmt: 0,
      manualDiscountAmt: migrationFlatDiscount,
      overallVolPct: 0,
      overallCashPct: 0,
      cashDiscountPct: 0,
      overallAutoPct: 0,
      manualDisc: 0,
      total
    };
  }

  // UNIFIED TIER DISCOUNTS LOOKUP:
  const activeTier = resolveOrderTier(collapsedItems, category, accountId, clientType);
  const rules = getEffectiveTierDiscountRules(
    activeTier,
    discountRulesByTierOrPresets?.discountRulesByTier || discountRulesByTierOrPresets,
    discountRulesByTierOrPresets?.specialPresetDiscounts
  );

  const pm = String(paymentMethod || '').toUpperCase();
  const isCash = Boolean(pm && (pm.includes('100%') || pm.includes('CONTADO')) && !pm.includes('50'));

  // Group items by garment name for per-garment volume thresholds
  const garmentCounts = new Map<string, number>();
  collapsedItems.forEach(it => {
    const gName = String(it.name || '').trim().toLowerCase();
    const qty = Number(it.qty) || 1;
    garmentCounts.set(gName, (garmentCounts.get(gName) || 0) + qty);
  });

  let subtotal = 0;
  let discountableSubtotal = 0;
  let quarantinedSubtotal = 0;
  let volumeDiscountAmt = 0;
  let packageDiscountAmt = 0;

  collapsedItems.forEach(item => {
    const itemRawPrice = getPrice(item, category, accountId, collapsedItems);
    
    // EMBROIDERY QUARANTINE: Subcontracted embroidery (logos, personalized names, matrices)
    // is strictly quarantined from discounts to protect external workshop outlays.
    const { totalQuarantinedCost } = extractItemEmbroideryCostBreakdown(
      item,
      pricingServices,
      collapsedItems
    );
    const itemDiscountablePrice = Math.max(0, itemRawPrice - totalQuarantinedCost);

    subtotal += itemRawPrice;
    discountableSubtotal += itemDiscountablePrice;
    quarantinedSubtotal += totalQuarantinedCost;

    // 1. Bundle Package Discount (if enabled and 100% cash) - applies ONLY to discountable garment base
    const isFullPackage = item.isPackage || item.isUdiGroup;
    if (isFullPackage) {
      const pkgPct = rules.fullPackageDiscountPercent !== undefined ? rules.fullPackageDiscountPercent : 10;
      const enabled = rules.fullPackageDiscountEnabled !== undefined ? rules.fullPackageDiscountEnabled : true;
      if (enabled && isCash) {
        packageDiscountAmt += itemDiscountablePrice * (pkgPct / 100);
      }
    }

    // 2. Per-Garment Volume Discount (if enabled) - applies ONLY to discountable garment base
    // Notice: If volumeDiscountEnabled === false (e.g. for B2B wholesale), volume discount is strictly 0.
    if (rules.volumeDiscountEnabled && !isFullPackage) {
      const gName = String(item.name || '').trim().toLowerCase();
      const totalUnitsOfGarment = garmentCounts.get(gName) || Number(item.qty) || 1;
      const itemVolPct = getVolumeDiscountPct(totalUnitsOfGarment, rules.volumeTiers);
      if (itemVolPct > 0) {
        volumeDiscountAmt += itemDiscountablePrice * (itemVolPct / 100);
      }
    }
  });

  // Cumulative discountable subtotal after volume and bundle discounts
  const cumulativeDiscountableAfterVolume = Math.max(0, discountableSubtotal - volumeDiscountAmt - packageDiscountAmt);

  // 3. Cash Discount (100% Adelantado) - strictly 0 if cashDiscountEnabled === false
  let cashDiscountAmt = 0;
  if (
    rules.cashDiscountEnabled && 
    isCash && 
    cumulativeDiscountableAfterVolume > rules.cashDiscountMinAmount
  ) {
    cashDiscountAmt = cumulativeDiscountableAfterVolume * (rules.cashDiscountPercent / 100);
  }

  // 4. Manual Closing Discount (Salesperson) - strictly 0 if sellerDiscountEnabled === false
  let manualDiscountAmt = 0;
  let effectiveManual = 0;
  if (rules.sellerDiscountEnabled) {
    const maxManual = Math.max(0, rules.maxSellerDiscountPercent || 0);
    effectiveManual = Math.min(Math.max(0, Number(manualDiscount) || 0), maxManual);
    manualDiscountAmt = cumulativeDiscountableAfterVolume * (effectiveManual / 100);
  }

  const lines: { label: string; amount: number }[] = [];
  if (packageDiscountAmt > 0) {
    lines.push({ 
      label: `Descuento Paquete Completo (${rules.fullPackageDiscountPercent || 10}% Contado)`, 
      amount: packageDiscountAmt 
    });
  }
  if (volumeDiscountAmt > 0) {
    lines.push({ 
      label: 'Descuento por Volumen', 
      amount: volumeDiscountAmt 
    });
  }
  if (cashDiscountAmt > 0) {
    lines.push({ 
      label: `Descuento por Pago al Contado (${rules.cashDiscountPercent}%)`, 
      amount: cashDiscountAmt 
    });
  }
  if (manualDiscountAmt > 0) {
    lines.push({ 
      label: `Descuento de Cierre (${effectiveManual}%)`, 
      amount: manualDiscountAmt 
    });
  }

  const totalDiscountAmt = volumeDiscountAmt + packageDiscountAmt + cashDiscountAmt + manualDiscountAmt;
  const total = Math.max(0, subtotal - totalDiscountAmt);

  const rawOverallVol = subtotal > 0 ? (volumeDiscountAmt / subtotal) * 100 : 0;
  const rawOverallCash = subtotal > 0 ? (cashDiscountAmt / subtotal) * 100 : 0;
  const overallVolPct = Math.round(rawOverallVol * 100) / 100;
  const overallCashPct = Math.round(rawOverallCash * 100) / 100;
  const cashDiscountPct = rules.cashDiscountPercent;
  const overallAutoPct = Math.round((overallVolPct + overallCashPct + (packageDiscountAmt > 0 ? (rules.fullPackageDiscountPercent || 10) : 0)) * 100) / 100;

  return {
    subtotal,
    discountableSubtotal,
    quarantinedSubtotal,
    lines,
    volumeDiscountAmt,
    cashDiscountAmt,
    packageDiscountAmt,
    manualDiscountAmt,
    overallVolPct,
    overallCashPct,
    cashDiscountPct,
    overallAutoPct,
    manualDisc: effectiveManual,
    total
  };
};
