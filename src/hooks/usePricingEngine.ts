import { 
  calculateVolumeScaledServiceUnitPrice,
  calculateOrderWideLogoQuantity,
  getGarmentPriceValue, 
  getPricingTierFromClientType, 
  collapseUdiItems, 
  computeDiscountEngine,
  DiscountEngineResult 
} from '../utils/pricingCalculator';
import { OrderItem, ServicePricing } from '../types';
import { getUdiBundleBreakdown } from '../domains/udi/udiBundleEngine';
import { consolidateCommercialItems } from '../utils/orderItemConsolidation';

export const usePricingEngine = (pricing: any) => {
  const getItemUnitPrice = (item: any, category: string = 'Personal', accountId?: string) => {
    if (item?.customUnitPrice !== undefined && item?.customUnitPrice !== null) {
      return Number(item.customUnitPrice);
    }
    if (!pricing) return 0;

    const specialPresets = pricing.specialPresets || { "UDI Especial": pricing.udiPricing || {} };
    const rawTier = item?.pricingTier || item?.specialPreset || category || item?.category || 'Personal';
    const finalAccountId = accountId || item?.accountId;

    // 1. FOR "Uniforme Completo UDI": ALWAYS dynamically calculate total by summing active UDI preset prices
    if (item?.name === 'Uniforme Completo UDI') {
      const presetData = (item?.specialPreset && specialPresets[item.specialPreset])
        ? specialPresets[item.specialPreset]
        : (specialPresets['UDI Especial'] || pricing.udiPricing || {});
      const breakdown = getUdiBundleBreakdown(presetData);
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
    } else if (finalAccountId === 'ACC-001' || category === 'UDI' || category === 'Alumnos UDI' || category === 'Estudiante UDI' || item?.category === 'UDI' || rawTier === 'Contrato Institucional' || rawTier === 'Estudiante UDI' || rawTier === 'UDI Especial' || category === 'UDI Especial') {
      if (specialPresets['UDI Especial']) {
        matchedPresetKey = 'UDI Especial';
      }
    }

    if (matchedPresetKey && specialPresets[matchedPresetKey]) {
      const presetData = specialPresets[matchedPresetKey];

      // Single item lookup in special preset
      let presetPrice = 0;
      const garmentKey = Object.keys(presetData).find(k => k.toLowerCase() === (item.name || '').toLowerCase()) || item.name;
      if (presetData[garmentKey]) {
        const gData = presetData[garmentKey];
        if (typeof gData === 'number') {
          presetPrice = gData;
        } else if (typeof gData === 'string') {
          const parsed = parseFloat(gData);
          if (!isNaN(parsed)) presetPrice = parsed;
        } else if (typeof gData === 'object' && gData !== null) {
          if (item.fabric && gData[item.fabric] !== undefined) {
            const fVal = gData[item.fabric];
            presetPrice = typeof fVal === 'number' ? fVal : Number(fVal?.priceRaleo ?? fVal?.priceB2B ?? 0);
          }
          if (presetPrice === 0 && item.fabric) {
            const fabKey = Object.keys(gData).find(f => f.toLowerCase() === item.fabric.toLowerCase());
            if (fabKey && gData[fabKey] !== undefined) {
              const fVal = gData[fabKey];
              presetPrice = typeof fVal === 'number' ? fVal : Number(fVal?.priceRaleo ?? fVal?.priceB2B ?? 0);
            }
          }
          if (presetPrice === 0) {
            const vals = Object.values(gData);
            if (vals.length > 0) {
              const first = vals[0];
              presetPrice = typeof first === 'number' ? first : Number((first as any)?.priceRaleo ?? (first as any)?.priceB2B ?? 0);
            }
          }
        }
      }

      if (presetPrice > 0) return presetPrice;
    }

    // 3. Tab A - Catalog Resolution by Pricing Tier (Basic Raleo vs Negotiated B2B)
    const isB2B = rawTier === 'Estándar B2B' || rawTier === 'B2B Estándar' || rawTier === 'B2B';

    return getGarmentPriceValue(pricing.garments, item.name, item.fabric, isB2B);
  };

  
  const getServiceUnitPrice = (s: string, item: OrderItem, orderItems?: OrderItem[]): number => {
    if (!pricing) return 0;
    const srvDef = pricing.services?.find((x: ServicePricing) => x.name === s);
    if (srvDef?.type === 'Escala de Volumen (Logos)' || (!srvDef && s.toUpperCase().includes('LOGO'))) { 
       if (item?.customServicePrices && item.customServicePrices[s] !== undefined) {
          return Number(item.customServicePrices[s]) || 0;
       }
       // Order-Wide Logo Pooling: aggregate quantity across all line items sharing this logo service
       const pooledQty = orderItems && Array.isArray(orderItems) && orderItems.length > 0
          ? calculateOrderWideLogoQuantity(orderItems, s)
          : (Number(item?.qty) || 1);
       return calculateVolumeScaledServiceUnitPrice(pooledQty);
    }
    const customPrice = (item.customServicePrices && item.customServicePrices[s] !== undefined) ? Number(item.customServicePrices[s]) : (srvDef?.price || 0);
    return Number(customPrice) || 0;
  };

  const calculateItemPriceRaw = (item: any, category: string = 'Personal', accountId?: string, orderItems?: OrderItem[]): number => {
    if (!pricing) return 0;
    
    const getSrvCost = (s: string) => getServiceUnitPrice(s, item as OrderItem, orderItems);

    const unitBase = getItemUnitPrice(item, item.pricingTier || category, accountId || item?.accountId);

    const srvTotal = item.services?.reduce((a: number, s: string) => {
       return a + getSrvCost(s);
    }, 0) || 0;

    const customSrv = item.embroideries?.reduce((a: number, e: string) => {
      if (e.startsWith('Otro:')) {
         const parts = e.split('|');
         if (parts.length === 2) return a + parseFloat(parts[1]) || 0;
      }
      return a;
    }, 0) || 0;

    return (unitBase + srvTotal + customSrv) * (item.qty || 1);
  };

  const calculateDiscountEngine = (
    itemsList: any[], 
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
      (it, cat, accId) => calculateItemPriceRaw(it, cat, accId, itemsList),
      {
        discountRulesByTier: pricing?.discountRulesByTier,
        specialPresetDiscounts: pricing?.specialPresetDiscounts
      },
      migrationFlatDiscount,
      pricing?.services
    );
  };

  const calculateItemDiscountedPrice = (item: any, category: string, paymentMethod: string, manualDiscount: number = 0, clientType?: string, accountId?: string) => {
    const rawTotal = calculateItemPriceRaw(item, category, accountId);
    if (rawTotal === 0) return 0;
    return calculateDiscountEngine([item], category, paymentMethod, manualDiscount, clientType, accountId).total;
  };

  const calculateTotalPrice = (itemsList: any[], category: string = 'Personal', paymentMethod: string = '50/50 - Adelantado/Entrega', manualDiscount: number = 0, clientType?: string, accountId?: string, migrationFlatDiscount: number = 0) => {
    return calculateDiscountEngine(itemsList, category, paymentMethod, manualDiscount, clientType, accountId, migrationFlatDiscount).total;
  };

  const getOrderBreakdown = (itemsList: any[], category: string = 'Personal', paymentMethod: string = '50/50 - Adelantado/Entrega', manualDiscount: number = 0, clientType?: string, accountId?: string, migrationFlatDiscount: number = 0) => {
    return calculateDiscountEngine(itemsList, category, paymentMethod, manualDiscount, clientType, accountId, migrationFlatDiscount);
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
    getPricingTierFromClientType
  };
};
