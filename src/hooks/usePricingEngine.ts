import {
  calculateVolumeScaledServiceUnitPrice,
  calculateOrderWideLogoQuantity,
  getGarmentPriceValue,
  getPricingTierFromClientType,
  collapseUdiItems,
  computeDiscountEngine,
  DiscountEngineResult,
  resolveGarmentPrice,
} from '../utils/pricingCalculator';
import { CatalogGarmentPricing, OrderItem, PricingData, ServicePricing } from '../types';
import { getUdiBundleBreakdown } from '../domains/udi/udiBundleEngine';
import { consolidateCommercialItems } from '../utils/orderItemConsolidation';
import { DEFAULT_PRICING } from '../utils/pricingDefaults';
import { areFabricsEquivalent } from '../domains/pricing/fabricAliasMap';

export type PricingItemInput = Partial<OrderItem> & {
  accountId?: string;
};

interface PresetVariantEntry {
  priceRaleo?: number | string;
  priceB2B?: number | string;
}

type PresetFabricMap = Record<string, number | string | PresetVariantEntry>;
type PresetGarmentMap = Record<string, number | string | PresetFabricMap>;

export const usePricingEngine = (pricing: PricingData | null | undefined) => {
  const effectivePricing: PricingData = pricing || DEFAULT_PRICING;

  const getItemUnitPrice = (item: PricingItemInput, category: string = 'Personal', accountId?: string): number => {
    if (item?.customUnitPrice !== undefined && item?.customUnitPrice !== null) {
      return Number(item.customUnitPrice);
    }
    if (!effectivePricing) return 0;

    const specialPresets = (effectivePricing.specialPresets || {
      'UDI Especial': effectivePricing.udiPricing || {},
    }) as Record<string, PresetGarmentMap>;
    const rawTier = item?.pricingTier || item?.specialPreset || category || item?.category || 'Personal';
    const finalAccountId = accountId || item?.accountId;

    // 1. FOR "Uniforme Completo UDI": ALWAYS dynamically calculate total by summing active UDI preset prices
    if (item?.name === 'Uniforme Completo UDI') {
      const presetData =
        item?.specialPreset && specialPresets[item.specialPreset]
          ? specialPresets[item.specialPreset]
          : specialPresets['UDI Especial'] || (effectivePricing.udiPricing as PresetGarmentMap) || {};
      const breakdown = getUdiBundleBreakdown(presetData as Record<string, unknown>);
      return breakdown.total;
    }

    // 2. Check if rawTier matches a custom Tab B preset or category is UDI
    let matchedPresetKey: string | null = null;
    if (item?.specialPreset && specialPresets[item.specialPreset]) {
      matchedPresetKey = item.specialPreset;
    } else if (item?.pricingTier && specialPresets[item.pricingTier]) {
      matchedPresetKey = item.pricingTier;
    } else if (specialPresets[category]) {
      matchedPresetKey = category;
    } else if (
      finalAccountId === 'ACC-001' ||
      category === 'UDI' ||
      category === 'Alumnos UDI' ||
      category === 'Estudiante UDI' ||
      item?.category === 'UDI' ||
      rawTier === 'Contrato Institucional' ||
      rawTier === 'Estudiante UDI' ||
      rawTier === 'UDI Especial' ||
      category === 'UDI Especial'
    ) {
      if (specialPresets['UDI Especial']) {
        matchedPresetKey = 'UDI Especial';
      }
    }

    if (matchedPresetKey && specialPresets[matchedPresetKey]) {
      const presetData = specialPresets[matchedPresetKey];

      let presetPrice = 0;
      const itemNameLower = (item.name || '').toLowerCase();
      const garmentKey =
        Object.keys(presetData).find((k) => k.toLowerCase() === itemNameLower) || (item.name || '');
      const gData = garmentKey ? presetData[garmentKey] : undefined;

      if (gData !== undefined) {
        if (typeof gData === 'number') {
          presetPrice = gData;
        } else if (typeof gData === 'string') {
          const parsed = parseFloat(gData);
          if (!Number.isNaN(parsed)) presetPrice = parsed;
        } else if (typeof gData === 'object' && gData !== null) {
          const extractPresetVal = (val: number | string | PresetVariantEntry | undefined): number => {
            if (typeof val === 'number') return val;
            if (typeof val === 'string') {
              const p = parseFloat(val);
              return Number.isNaN(p) ? 0 : p;
            }
            if (val && typeof val === 'object') {
              return Number(val.priceRaleo ?? val.priceB2B ?? 0);
            }
            return 0;
          };

          if (item.fabric && gData[item.fabric] !== undefined) {
            presetPrice = extractPresetVal(gData[item.fabric]);
          }
          if (presetPrice === 0 && item.fabric) {
            const fabKey = Object.keys(gData).find((f) => areFabricsEquivalent(f, item.fabric));
            if (fabKey && gData[fabKey] !== undefined) {
              presetPrice = extractPresetVal(gData[fabKey]);
            }
          }
          if (presetPrice === 0) {
            const vals = Object.values(gData);
            if (vals.length > 0) {
              presetPrice = extractPresetVal(vals[0]);
            }
          }
        }
      }

      if (presetPrice > 0) return presetPrice;
    }

    // 3. Tab A & Catalog Resolution by Pricing Tier (delegated to resolveGarmentPrice)
    const isB2B = rawTier === 'Estándar B2B' || rawTier === 'B2B Estándar' || rawTier === 'B2B';
    const resolved = resolveGarmentPrice({
      pricing: effectivePricing as {
        garments?: Record<string, unknown>;
        catalogGarments?: Record<string, CatalogGarmentPricing> | CatalogGarmentPricing[];
        specialPresets?: Record<string, unknown>;
        udiPricing?: Record<string, unknown>;
      },
      garmentName: item.name,
      fabricName: item.fabric,
      sku: item.sku,
      fabricSku: item.fabricSku,
      isB2B,
    });
    return resolved.price;
  };

  const getServiceUnitPrice = (s: string, item: PricingItemInput, orderItems?: OrderItem[]): number => {
    if (!effectivePricing) return 0;
    const srvDef = effectivePricing.services?.find((x: ServicePricing) => x.name === s);
    if (srvDef?.type === 'Escala de Volumen (Logos)' || (!srvDef && s.toUpperCase().includes('LOGO'))) {
      if (item?.customServicePrices && item.customServicePrices[s] !== undefined) {
        return Number(item.customServicePrices[s]) || 0;
      }
      const pooledQty =
        orderItems && Array.isArray(orderItems) && orderItems.length > 0
          ? calculateOrderWideLogoQuantity(orderItems, s)
          : Number(item?.qty) || 1;
      return calculateVolumeScaledServiceUnitPrice(pooledQty);
    }
    const customPrice =
      item.customServicePrices && item.customServicePrices[s] !== undefined
        ? Number(item.customServicePrices[s])
        : srvDef?.price || 0;
    return Number(customPrice) || 0;
  };

  const calculateItemPriceRaw = (
    item: PricingItemInput,
    category: string = 'Personal',
    accountId?: string,
    orderItems?: OrderItem[]
  ): number => {
    if (!effectivePricing) return 0;

    const getSrvCost = (s: string) => getServiceUnitPrice(s, item, orderItems);
    const unitBase = getItemUnitPrice(item, item.pricingTier || category, accountId || item?.accountId);

    const srvTotal =
      item.services?.reduce((a: number, s: string) => {
        return a + getSrvCost(s);
      }, 0) || 0;

    const customSrv =
      item.embroideries?.reduce((a: number, e: string) => {
        if (e.startsWith('Otro:')) {
          const parts = e.split('|');
          if (parts.length === 2) return a + parseFloat(parts[1]) || 0;
        }
        return a;
      }, 0) || 0;

    return (unitBase + srvTotal + customSrv) * (item.qty || 1);
  };

  const calculateDiscountEngine = (
    itemsList: PricingItemInput[],
    category: string = 'Personal',
    paymentMethod: string = '50/50 - Adelantado/Entrega',
    manualDiscount: number = 0,
    clientType?: string,
    accountId?: string,
    migrationFlatDiscount: number = 0
  ): DiscountEngineResult => {
    return computeDiscountEngine(
      itemsList,
      category,
      paymentMethod,
      manualDiscount,
      clientType,
      accountId,
      (it: PricingItemInput, cat?: string, accId?: string) =>
        calculateItemPriceRaw(it, cat, accId, itemsList as OrderItem[]),
      {
        discountRulesByTier: effectivePricing?.discountRulesByTier,
        specialPresetDiscounts: effectivePricing?.specialPresetDiscounts,
      },
      migrationFlatDiscount,
      effectivePricing?.services
    );
  };

  const calculateItemDiscountedPrice = (
    item: PricingItemInput,
    category: string,
    paymentMethod: string,
    manualDiscount: number = 0,
    clientType?: string,
    accountId?: string
  ) => {
    const rawTotal = calculateItemPriceRaw(item, category, accountId);
    if (rawTotal === 0) return 0;
    return calculateDiscountEngine([item], category, paymentMethod, manualDiscount, clientType, accountId).total;
  };

  const calculateTotalPrice = (
    itemsList: PricingItemInput[],
    category: string = 'Personal',
    paymentMethod: string = '50/50 - Adelantado/Entrega',
    manualDiscount: number = 0,
    clientType?: string,
    accountId?: string,
    migrationFlatDiscount: number = 0
  ) => {
    return calculateDiscountEngine(
      itemsList,
      category,
      paymentMethod,
      manualDiscount,
      clientType,
      accountId,
      migrationFlatDiscount
    ).total;
  };

  const getOrderBreakdown = (
    itemsList: PricingItemInput[],
    category: string = 'Personal',
    paymentMethod: string = '50/50 - Adelantado/Entrega',
    manualDiscount: number = 0,
    clientType?: string,
    accountId?: string,
    migrationFlatDiscount: number = 0
  ) => {
    return calculateDiscountEngine(
      itemsList,
      category,
      paymentMethod,
      manualDiscount,
      clientType,
      accountId,
      migrationFlatDiscount
    );
  };

  return {
    getGarmentPriceValue,
    getItemUnitPrice,
    getServiceUnitPrice,
    calculateItemPriceRaw,
    collapseUdiItems,
    consolidateCommercialItems,
    calculateDiscountEngine,
    calculateItemDiscountedPrice,
    calculateTotalPrice,
    getOrderBreakdown,
    getPricingTierFromClientType,
  };
};
