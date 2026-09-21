/**
 * UDI Student Bundle Engine (Ring-Fenced Domain Module)
 * 
 * Exclusively handles student bundle kit calculations and aggregation:
 * - Dynamic summing of 4-piece student kits (Mandil, Filipina, Pantalón, Gorro)
 * - Collapsing grouped student items into "Uniforme Completo UDI"
 * - Calculating the 10% cash discount on student packages
 * 
 * ZERO generic product merging. ZERO external B2B dependencies.
 */

import { OrderItem } from '../../types';

export interface UdiGarmentPriceInfo {
  name: string;
  price: number;
  fabric: string;
}

export interface UdiBundleBreakdown {
  mandil: UdiGarmentPriceInfo;
  filipina: UdiGarmentPriceInfo;
  pantalon: UdiGarmentPriceInfo;
  gorro: UdiGarmentPriceInfo;
  total: number;
  items: UdiGarmentPriceInfo[];
}

const normalize = (str: string): string =>
  String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const extractNumericPriceFromGarmentData = (
  gData: unknown,
  defaultFallback: number = 0
): { price: number; fabric: string } => {
  if (gData === undefined || gData === null) {
    return { price: defaultFallback, fabric: 'Estándar' };
  }
  if (typeof gData === 'number') {
    return { price: gData > 0 ? gData : defaultFallback, fabric: 'Estándar' };
  }
  if (typeof gData === 'string') {
    const parsed = parseFloat(gData);
    return { price: !isNaN(parsed) && parsed > 0 ? parsed : defaultFallback, fabric: 'Estándar' };
  }
  if (typeof gData === 'object' && gData !== null) {
    const record = gData as Record<string, unknown>;
    const keys = Object.keys(record);
    if (keys.length === 0) {
      return { price: defaultFallback, fabric: 'Estándar' };
    }
    for (const key of keys) {
      const v = record[key];
      if (typeof v === 'number' && v > 0) {
        return { price: v, fabric: key };
      }
      if (typeof v === 'object' && v !== null) {
        const sub = v as Record<string, unknown>;
        const num = Number(sub.priceRaleo ?? sub.priceB2B ?? sub.price ?? sub.cost ?? 0);
        if (num > 0) return { price: num, fabric: key };
      }
      if (typeof v === 'string') {
        const parsed = parseFloat(v);
        if (!isNaN(parsed) && parsed > 0) return { price: parsed, fabric: key };
      }
    }
    return { price: defaultFallback, fabric: keys[0] || 'Estándar' };
  }
  return { price: defaultFallback, fabric: 'Estándar' };
};

export const getUdiBundleBreakdown = (presetData: Record<string, unknown> | undefined): UdiBundleBreakdown => {
  const data = presetData || {};
  const keys = Object.keys(data);
  const matchedKeys = new Set<string>();

  const findBestKey = (targetType: 'mandil' | 'filipina' | 'pantalon' | 'gorro'): string | null => {
    const keywords: Record<string, string[]> = {
      mandil: ['mandil', 'bata', 'guardapolvo', 'delantal'],
      filipina: ['filipina', 'camisa', 'blusa', 'chaqueta', 'casaca'],
      pantalon: ['pantalon', 'jogger', 'buzo'],
      gorro: ['gorro', 'cofia', 'turbante', 'bonete']
    };

    const targetKeywords = keywords[targetType] || [targetType];

    for (const k of keys) {
      if (matchedKeys.has(k)) continue;
      const normK = normalize(k);
      if (targetKeywords.some(kw => normK.includes(kw))) {
        matchedKeys.add(k);
        return k;
      }
    }

    const remainingKeys = keys.filter(k => !matchedKeys.has(k));
    if (remainingKeys.length > 0) {
      const selected = remainingKeys[0];
      matchedKeys.add(selected);
      return selected;
    }

    return null;
  };

  const mandilKey = findBestKey('mandil');
  const filipinaKey = findBestKey('filipina');
  const pantalonKey = findBestKey('pantalon');
  const gorroKey = findBestKey('gorro');

  const mandilRes = extractNumericPriceFromGarmentData(mandilKey ? data[mandilKey] : undefined);
  const filipinaRes = extractNumericPriceFromGarmentData(filipinaKey ? data[filipinaKey] : undefined);
  const pantalonRes = extractNumericPriceFromGarmentData(pantalonKey ? data[pantalonKey] : undefined);
  const gorroRes = extractNumericPriceFromGarmentData(gorroKey ? data[gorroKey] : undefined);

  const mandil: UdiGarmentPriceInfo = { name: mandilKey || 'Mandil', price: mandilRes.price, fabric: mandilRes.fabric };
  const filipina: UdiGarmentPriceInfo = { name: filipinaKey || 'Filipina', price: filipinaRes.price, fabric: filipinaRes.fabric };
  const pantalon: UdiGarmentPriceInfo = { name: pantalonKey || 'Pantalón', price: pantalonRes.price, fabric: pantalonRes.fabric };
  const gorro: UdiGarmentPriceInfo = { name: gorroKey || 'Gorro', price: gorroRes.price, fabric: gorroRes.fabric };

  const total = mandil.price + filipina.price + pantalon.price + gorro.price;

  return {
    mandil,
    filipina,
    pantalon,
    gorro,
    total,
    items: [mandil, filipina, pantalon, gorro]
  };
};

/**
 * Pure function that merges ONLY items with isUdiGroup && udiGroupId into "Uniforme Completo UDI".
 * Non-UDI items are untouched and returned as-is.
 * ZERO generic product merging.
 */
export const collapseUdiStudentPackage = (items: OrderItem[]): OrderItem[] => {
  const udiGrouped = new Map<string, OrderItem>();
  const otherItems: OrderItem[] = [];

  (items || []).forEach(it => {
    if (it.isUdiGroup && it.udiGroupId) {
      if (!udiGrouped.has(it.udiGroupId)) {
        udiGrouped.set(it.udiGroupId, {
          ...it,
          name: 'Uniforme Completo UDI',
          fabric: 'CONJUNTO COMPLETO',
          qty: 1
        });
      } else {
        const existing = udiGrouped.get(it.udiGroupId)!;
        const newServices = [...(existing.services || []), ...(it.services || [])];
        existing.services = [...new Set(newServices)];
        if (it.customServicePrices) {
          existing.customServicePrices = {
            ...(existing.customServicePrices || {}),
            ...it.customServicePrices
          };
        }
      }
    } else if (it.isPackage || it.isUdiGroup) {
      otherItems.push({ ...it, fabric: 'CONJUNTO COMPLETO' });
    } else {
      otherItems.push(it);
    }
  });

  return [...otherItems, ...Array.from(udiGrouped.values())];
};

/**
 * Enforces the 10% cash discount on UDI student sets.
 */
export const calculateUdiPackageDiscount = (
  itemDiscountablePrice: number,
  isCash: boolean,
  discountEnabled: boolean = true
): number => {
  if (!discountEnabled || !isCash) return 0;
  return itemDiscountablePrice * 0.10;
};
