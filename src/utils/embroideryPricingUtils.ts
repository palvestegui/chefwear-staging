import { LOGO_VOLUME_RATE_TABLE } from './constants';
import { ServicePricing, OrderItem } from '../types';

/**
 * Resolves the unit price for a volume-scaled service (such as corporate logos)
 * according to the centralized LOGO_VOLUME_RATE_TABLE.
 */
export const calculateVolumeScaledServiceUnitPrice = (qty: number): number => {
  const n = Number(qty) || 1;
  if (n <= 0) return 0;
  for (const tier of LOGO_VOLUME_RATE_TABLE) {
    if (n >= tier.minQty) return tier.unitPrice;
  }
  return 20;
};

/**
 * Checks if a service is an external/subcontracted embroidery service.
 * Subcontracted embroidery (logos, employee pocket names, custom embroideries)
 * must be quarantined from garment confection discounts to protect workshop outlays.
 *
 * In-house trims and hardware (argollas, reguladores, hebillas, tiros, bolsillos)
 * are NOT quarantined and remain part of the discountable garment total.
 */
export const isSubcontractedEmbroideryService = (
  serviceName: string, 
  srvDef?: ServicePricing | null
): boolean => {
  if (!serviceName) return false;
  if (srvDef?.type === 'Escala de Volumen (Logos)') return true;
  
  const norm = serviceName.trim().toLowerCase();
  
  // Specific pocket name embroidery (personalization)
  if (norm.includes('nombre en el bolsillo') || norm === 'nombre en el bolsillo') {
    return true;
  }
  
  // Explicit logo or embroidery services
  if (norm.includes('logo') || norm.includes('bordado')) {
    return true;
  }
  
  return false;
};

/**
 * Calculates the pooled quantity across all garments in the order that share a logo service.
 * Ensures multi-size line items (e.g. 2 S, 3 M, 3 L, 2 XL = 10 units) receive the bulk tier.
 */
export const calculateOrderWideLogoQuantity = (items: OrderItem[], serviceName: string): number => {
  if (!items || !Array.isArray(items) || items.length === 0) return 1;
  const isLogoSrv = serviceName.toUpperCase().includes('LOGO');
  
  const totalUnits = items.reduce((acc: number, it: OrderItem) => {
    const hasService = it.services && it.services.some((s: string) => {
      if (s === serviceName) return true;
      if (isLogoSrv && s.toUpperCase().includes('LOGO')) return true;
      return false;
    });
    return acc + (hasService ? (Number(it.qty) || 1) : 0);
  }, 0);
  
  return totalUnits > 0 ? totalUnits : 1;
};

export interface ItemEmbroideryCostBreakdown {
  quarantinedEmbroideryUnitCost: number;
  nonEmbroideryServicesUnitCost: number;
  totalQuarantinedCost: number;
  totalNonEmbroideryServicesCost: number;
}

/**
 * Deconstructs an item's services into:
 * - Subcontracted embroidery (exempt from discounts)
 * - In-house services & trims (eligible for discounts)
 */
export const extractItemEmbroideryCostBreakdown = (
  item: OrderItem,
  servicesCatalog?: ServicePricing[],
  orderItems?: OrderItem[],
  getServiceUnitPriceFn?: (s: string, it: OrderItem, orderItems?: OrderItem[]) => number
): ItemEmbroideryCostBreakdown => {
  const qty = Number(item.qty) || 1;
  let quarantinedEmbroideryUnitCost = 0;
  let nonEmbroideryServicesUnitCost = 0;

  if (item.services && Array.isArray(item.services)) {
    item.services.forEach((s: string) => {
      const srvDef = servicesCatalog?.find((x: ServicePricing) => x.name === s && x.garment === item.name) ||
                     servicesCatalog?.find((x: ServicePricing) => x.name === s && x.garment === 'Global') ||
                     servicesCatalog?.find((x: ServicePricing) => x.name === s);

      let unitPrice = 0;
      if (getServiceUnitPriceFn) {
        unitPrice = getServiceUnitPriceFn(s, item, orderItems);
      } else if (item.customServicePrices && item.customServicePrices[s] !== undefined) {
        unitPrice = Number(item.customServicePrices[s]) || 0;
      } else if (srvDef?.type === 'Escala de Volumen (Logos)' || s.toUpperCase().includes('LOGO')) {
        const pooledQty = orderItems ? calculateOrderWideLogoQuantity(orderItems, s) : qty;
        unitPrice = calculateVolumeScaledServiceUnitPrice(pooledQty);
      } else {
        unitPrice = Number(srvDef?.price) || 0;
      }

      if (isSubcontractedEmbroideryService(s, srvDef)) {
        quarantinedEmbroideryUnitCost += unitPrice;
      } else {
        nonEmbroideryServicesUnitCost += unitPrice;
      }
    });
  }

  // Handle custom ad-hoc embroideries (e.g. 'Otro:Logo Pecho|35')
  if (item.embroideries && Array.isArray(item.embroideries)) {
    item.embroideries.forEach((e: string) => {
      if (e.startsWith('Otro:')) {
        const parts = e.split('|');
        if (parts.length === 2) {
          quarantinedEmbroideryUnitCost += parseFloat(parts[1]) || 0;
        }
      }
    });
  }

  return {
    quarantinedEmbroideryUnitCost,
    nonEmbroideryServicesUnitCost,
    totalQuarantinedCost: quarantinedEmbroideryUnitCost * qty,
    totalNonEmbroideryServicesCost: nonEmbroideryServicesUnitCost * qty
  };
};
