import { areFabricsEquivalent, isPricingMetadataKey, normalizeLabel } from './fabricAliasMap';
import { extractVariants, matchCatalogVariant, parseCatalog } from './catalogLookupUtils';

export interface ResolveGarmentPriceParams {
  pricing?: {
    garments?: Record<string, unknown>;
    catalogGarments?: unknown;
    specialPresets?: Record<string, unknown>;
    udiPricing?: Record<string, unknown>;
  } | null;
  garmentName?: string;
  fabricName?: string;
  sku?: string;
  fabricSku?: string;
  isB2B?: boolean;
}

export interface ResolveGarmentPriceResult {
  price: number;
  matchedBy: 'sku' | 'name' | 'fallback' | 'none';
  sku?: string;
  fabricSku?: string;
}

export function resolveGarmentPrice(params: ResolveGarmentPriceParams): ResolveGarmentPriceResult {
  const { pricing, garmentName = '', fabricName = '', sku, fabricSku, isB2B = false } = params;
  if (!pricing) return { price: 0, matchedBy: 'none' };

  const catalog = parseCatalog(pricing.catalogGarments);

  if (sku) {
    const targetSku = sku.toUpperCase();
    const g = catalog.find(
      (x) => (x.sku && x.sku.toUpperCase() === targetSku) || (x.id && x.id.toUpperCase() === targetSku)
    );
    if (g) {
      const v = matchCatalogVariant(extractVariants(g), fabricName, fabricSku);
      const p = v
        ? isB2B ? (v.priceB2B ?? v.priceRaleo ?? 0) : (v.priceRaleo ?? v.priceB2B ?? 0)
        : isB2B ? (g.priceB2B ?? g.priceRaleo ?? 0) : (g.priceRaleo ?? g.priceB2B ?? 0);
      return { price: Number(p) || 0, matchedBy: 'sku', sku: g.sku || g.id, fabricSku: v?.fabricSku || v?.sku };
    }
  }

  const gDict = pricing.garments as Record<string, Record<string, unknown>> | undefined;
  if (sku && gDict && typeof gDict === 'object') {
    for (const [gKey, fObj] of Object.entries(gDict)) {
      if (typeof fObj === 'object' && fObj !== null) {
        const rawSku = (fObj as { sku?: unknown; _sku?: unknown }).sku || (fObj as { _sku?: unknown })._sku;
        if (typeof rawSku === 'string' && rawSku.toUpperCase() === sku.toUpperCase()) {
          const price = getGarmentPriceValue(gDict, gKey, fabricName, isB2B, sku, fabricSku);
          return { price, matchedBy: 'sku', sku: rawSku };
        }
      }
    }
  }

  if (garmentName) {
    const g = catalog.find((x) => x.name && normalizeLabel(x.name) === normalizeLabel(garmentName));
    if (g) {
      const v = matchCatalogVariant(extractVariants(g), fabricName, fabricSku);
      const p = v
        ? isB2B ? (v.priceB2B ?? v.priceRaleo ?? 0) : (v.priceRaleo ?? v.priceB2B ?? 0)
        : isB2B ? (g.priceB2B ?? g.priceRaleo ?? 0) : (g.priceRaleo ?? g.priceB2B ?? 0);
      if (Number(p) > 0) {
        return { price: Number(p), matchedBy: 'name', sku: g.sku || g.id, fabricSku: v?.fabricSku || v?.sku };
      }
    }

    const price = getGarmentPriceValue(gDict, garmentName, fabricName, isB2B, sku, fabricSku);
    if (price > 0) return { price, matchedBy: 'name' };
  }

  return { price: 0, matchedBy: 'none' };
}

export function getGarmentPriceValue(
  garmentsObj: unknown,
  garmentName: string,
  fabricName: string,
  isB2B: boolean,
  _sku?: string,
  fabricSku?: string
): number {
  if (!garmentsObj || typeof garmentsObj !== 'object' || !garmentName) return 0;
  const gDict = garmentsObj as Record<string, Record<string, unknown>>;
  let gKey = garmentName;

  if (!gDict[gKey]) {
    const found = Object.keys(gDict).find((k) => normalizeLabel(k) === normalizeLabel(garmentName));
    if (found) gKey = found;
    else return 0;
  }

  const gObj = gDict[gKey];
  if (!gObj || typeof gObj !== 'object') return 0;

  let val: unknown = undefined;
  if (fabricSku) {
    const target = fabricSku.toUpperCase();
    for (const [k, fVal] of Object.entries(gObj)) {
      if (isPricingMetadataKey(k)) continue;
      if (typeof fVal === 'object' && fVal !== null) {
        const s = (fVal as { fabricSku?: unknown; sku?: unknown }).fabricSku || (fVal as { sku?: unknown }).sku;
        if (typeof s === 'string' && s.toUpperCase() === target) {
          val = fVal;
          break;
        }
      }
    }
  }

  if ((val === undefined || val === null) && fabricName) {
    if (!isPricingMetadataKey(fabricName) && gObj[fabricName] !== undefined) {
      val = gObj[fabricName];
    }
    if (val === undefined || val === null) {
      const found = Object.keys(gObj).find((f) => !isPricingMetadataKey(f) && areFabricsEquivalent(f, fabricName));
      if (found) val = gObj[found];
    }
  }
  if ((val === undefined || val === null) && Object.keys(gObj).length > 0) {
    const primaryKey = Object.keys(gObj).find(
      (k) => !isPricingMetadataKey(k) && typeof gObj[k] === 'object' && gObj[k] !== null && (gObj[k] as { isPrimary?: boolean }).isPrimary
    );
    const firstKey = primaryKey || Object.keys(gObj).find((k) => !isPricingMetadataKey(k));
    if (firstKey) val = gObj[firstKey];
  }

  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && val !== null) {
    const o = val as { priceB2B?: unknown; priceRaleo?: unknown };
    return isB2B
      ? (o.priceB2B !== undefined && o.priceB2B !== null ? Number(o.priceB2B) : Number(o.priceRaleo) || 0)
      : (o.priceRaleo !== undefined && o.priceRaleo !== null ? Number(o.priceRaleo) : Number(o.priceB2B) || 0);
  }
  return 0;
}

export function findGarmentMetadata(
  pricing: unknown,
  garmentName?: string,
  fabricName?: string
): { sku?: string; fabricSku?: string } {
  if (!pricing || typeof pricing !== 'object' || !garmentName) return {};
  const p = pricing as { catalogGarments?: unknown; garments?: Record<string, Record<string, unknown>> };

  const catalog = parseCatalog(p.catalogGarments);
  const matchedG = catalog.find(
    (g) => (g.name && normalizeLabel(g.name) === normalizeLabel(garmentName)) || (g.id && normalizeLabel(g.id) === normalizeLabel(garmentName))
  );
  if (matchedG) {
    const sku = matchedG.sku || matchedG.id;
    const vars = extractVariants(matchedG);
    const v = fabricName
      ? vars.find((x) => x.fabricName && areFabricsEquivalent(x.fabricName, fabricName))
      : vars.find((x) => x.isPrimary) || vars[0];
    return { sku, fabricSku: v?.fabricSku || v?.sku };
  }

  if (p.garments && typeof p.garments === 'object') {
    const foundGKey = Object.keys(p.garments).find((k) => normalizeLabel(k) === normalizeLabel(garmentName));
    if (foundGKey) {
      const fObj = p.garments[foundGKey];
      let sku: string | undefined;
      let fabricSku: string | undefined;

      if (typeof fObj === 'object' && fObj !== null) {
        const rawSku = (fObj as { sku?: unknown; _sku?: unknown }).sku || (fObj as { _sku?: unknown })._sku;
        if (typeof rawSku === 'string') sku = rawSku;
        if (fabricName) {
          const foundFKey = Object.keys(fObj).find((k) => !isPricingMetadataKey(k) && areFabricsEquivalent(k, fabricName));
          if (foundFKey) {
            const v = fObj[foundFKey];
            if (typeof v === 'object' && v !== null) {
              const rawFSku = (v as { fabricSku?: unknown; sku?: unknown }).fabricSku || (v as { sku?: unknown }).sku;
              if (typeof rawFSku === 'string') fabricSku = rawFSku;
            }
          }
        }
      }
      return { sku, fabricSku };
    }
  }

  return {};
}

export function getSortedFabricsForGarment(
  pricing: unknown,
  garmentName?: string,
  presetFabrics?: string[] | null
): { sortedFabrics: string[]; primaryFabric: string } {
  if (!pricing || typeof pricing !== 'object' || !garmentName) {
    return { sortedFabrics: [], primaryFabric: '' };
  }

  const p = pricing as { catalogGarments?: unknown; garments?: Record<string, Record<string, unknown>> };
  const targetNameNorm = normalizeLabel(garmentName);
  let availableFabrics: string[] = [];
  let detectedPrimary = '';

  if (presetFabrics && presetFabrics.length > 0) {
    availableFabrics = [...presetFabrics];
    detectedPrimary = presetFabrics[0] || '';
  }

  if (availableFabrics.length === 0) {
    const catalog = parseCatalog(p.catalogGarments);
    const matchedG = catalog.find(
      (g) => (g.name && normalizeLabel(g.name) === targetNameNorm) || (g.id && normalizeLabel(g.id) === targetNameNorm)
    );
    if (matchedG) {
      const vars = extractVariants(matchedG);
      availableFabrics = vars.map((v) => v.fabricName || '').filter(Boolean);
      const defaultFab = matchedG.defaultFabricName || matchedG.defaultFabric;
      const primaryVar =
        vars.find((v) => v.isPrimary) ||
        (defaultFab ? vars.find((v) => v.fabricName && areFabricsEquivalent(v.fabricName, defaultFab)) : undefined) ||
        vars[0];
      if (primaryVar?.fabricName) detectedPrimary = primaryVar.fabricName;
    }
  }

  if (availableFabrics.length === 0 && p.garments && typeof p.garments === 'object') {
    const foundGKey = Object.keys(p.garments).find((k) => normalizeLabel(k) === targetNameNorm);
    if (foundGKey) {
      const fObj = p.garments[foundGKey];
      if (typeof fObj === 'object' && fObj !== null) {
        availableFabrics = Object.keys(fObj).filter((k) => {
          if (isPricingMetadataKey(k)) return false;
          if (garmentName === 'Gorro' && (k.includes('Tornado') || k.includes('1ra'))) return false;
          return true;
        });

        for (const [fName, fVal] of Object.entries(fObj)) {
          if (!isPricingMetadataKey(fName) && typeof fVal === 'object' && fVal !== null && (fVal as { isPrimary?: boolean }).isPrimary) {
            detectedPrimary = fName;
            break;
          }
        }
        if (!detectedPrimary && availableFabrics.length > 0) detectedPrimary = availableFabrics[0];
      }
    }
  }

  if (availableFabrics.length === 0) return { sortedFabrics: [], primaryFabric: '' };

  const uniqueFabrics = Array.from(new Set(availableFabrics));
  if (!detectedPrimary || !uniqueFabrics.includes(detectedPrimary)) detectedPrimary = uniqueFabrics[0] || '';

  const sorted = uniqueFabrics.sort((a, b) => {
    if (a === detectedPrimary) return -1;
    if (b === detectedPrimary) return 1;
    return a.localeCompare(b, 'es', { sensitivity: 'base' });
  });

  return { sortedFabrics: sorted, primaryFabric: detectedPrimary };
}
