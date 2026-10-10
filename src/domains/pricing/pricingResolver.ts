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

interface GenericVariant {
  fabricName?: string;
  fabricSku?: string;
  sku?: string;
  priceRaleo?: number;
  priceB2B?: number;
  isPrimary?: boolean;
}

interface GenericCatalogGarment {
  id?: string;
  name?: string;
  sku?: string;
  defaultFabric?: string;
  priceRaleo?: number;
  priceB2B?: number;
  variants?: GenericVariant[];
  fabricVariants?: Record<string, GenericVariant>;
}

const norm = (s: string): string => s.toLowerCase().trim().replace(/[\s\-_]+/g, ' ');

function parseCatalog(raw: unknown): GenericCatalogGarment[] {
  if (Array.isArray(raw)) return raw as GenericCatalogGarment[];
  if (raw && typeof raw === 'object') {
    return Object.entries(raw as Record<string, GenericCatalogGarment>).map(([k, v]) => ({
      ...v,
      name: v?.name || k,
      id: v?.id || k
    }));
  }
  return [];
}

function extractVariants(g: GenericCatalogGarment): GenericVariant[] {
  if (Array.isArray(g.variants)) return g.variants;
  if (g.fabricVariants && typeof g.fabricVariants === 'object') {
    return Object.entries(g.fabricVariants).map(([fName, val]) => ({
      ...val,
      fabricName: val?.fabricName || fName
    }));
  }
  return [];
}

export function resolveGarmentPrice(params: ResolveGarmentPriceParams): ResolveGarmentPriceResult {
  const { pricing, garmentName = '', fabricName = '', sku, fabricSku, isB2B = false } = params;
  if (!pricing) return { price: 0, matchedBy: 'none' };

  const catalog = parseCatalog(pricing.catalogGarments);

  // 1. Sku-First in catalogGarments
  if (sku) {
    const targetSku = sku.toUpperCase();
    const g = catalog.find(x => (x.sku && x.sku.toUpperCase() === targetSku) || (x.id && x.id.toUpperCase() === targetSku));
    if (g) {
      const vars = extractVariants(g);
      const v = (fabricSku && vars.find(x => (x.fabricSku && x.fabricSku.toUpperCase() === fabricSku.toUpperCase()) || (x.sku && x.sku.toUpperCase() === fabricSku.toUpperCase()))) ||
                (fabricName && vars.find(x => x.fabricName && norm(x.fabricName) === norm(fabricName))) ||
                vars.find(x => x.isPrimary) || vars[0];
      const p = v ? (isB2B ? (v.priceB2B ?? v.priceRaleo ?? 0) : (v.priceRaleo ?? v.priceB2B ?? 0))
                  : (isB2B ? (g.priceB2B ?? g.priceRaleo ?? 0) : (g.priceRaleo ?? g.priceB2B ?? 0));
      return { price: Number(p) || 0, matchedBy: 'sku', sku: g.sku || g.id, fabricSku: v?.fabricSku || v?.sku };
    }
  }

  // 2. Sku-First in garments matrix
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

  // 3. Normalized Name Matching (Legacy Orders #ORD-00001 through #ORD-00026)
  if (garmentName) {
    const g = catalog.find(x => x.name && norm(x.name) === norm(garmentName));
    if (g) {
      const vars = extractVariants(g);
      const v = (fabricSku && vars.find(x => (x.fabricSku && x.fabricSku.toUpperCase() === fabricSku.toUpperCase()) || (x.sku && x.sku.toUpperCase() === fabricSku.toUpperCase()))) ||
                (fabricName && vars.find(x => x.fabricName && norm(x.fabricName) === norm(fabricName))) ||
                vars.find(x => x.isPrimary) || vars[0];
      if (v) {
        const p = isB2B ? (v.priceB2B ?? v.priceRaleo ?? 0) : (v.priceRaleo ?? v.priceB2B ?? 0);
        return { price: Number(p) || 0, matchedBy: 'name', sku: g.sku || g.id, fabricSku: v.fabricSku || v.sku };
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
  if (!garmentsObj || typeof garmentsObj !== 'object' || !garmentName || !fabricName) return 0;
  const gDict = garmentsObj as Record<string, Record<string, unknown>>;
  let gKey = garmentName;

  if (!gDict[gKey]) {
    const found = Object.keys(gDict).find(k => norm(k) === norm(garmentName));
    if (found) gKey = found;
    else return 0;
  }

  const gObj = gDict[gKey];
  if (!gObj || typeof gObj !== 'object') return 0;

  let val: unknown = undefined;
  if (fabricSku) {
    const target = fabricSku.toUpperCase();
    for (const [, fVal] of Object.entries(gObj)) {
      if (typeof fVal === 'object' && fVal !== null) {
        const s = (fVal as { fabricSku?: unknown; sku?: unknown }).fabricSku || (fVal as { sku?: unknown }).sku;
        if (typeof s === 'string' && s.toUpperCase() === target) { val = fVal; break; }
      }
    }
  }

  if (val === undefined || val === null) val = gObj[fabricName];
  if (val === undefined || val === null) {
    const found = Object.keys(gObj).find(f => norm(f) === norm(fabricName));
    if (found) val = gObj[found];
  }
  if ((val === undefined || val === null) && Object.keys(gObj).length > 0) {
    const firstKey = Object.keys(gObj).find(k => !k.startsWith('_') && k !== 'sku');
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

  // 1. Catalog check
  const catalog = parseCatalog(p.catalogGarments);
  const matchedG = catalog.find(g => (g.name && norm(g.name) === norm(garmentName)) || (g.id && norm(g.id) === norm(garmentName)));
  if (matchedG) {
    const sku = matchedG.sku || matchedG.id;
    const vars = extractVariants(matchedG);
    const v = fabricName ? vars.find(x => x.fabricName && norm(x.fabricName) === norm(fabricName)) : (vars.find(x => x.isPrimary) || vars[0]);
    return { sku, fabricSku: v?.fabricSku || v?.sku };
  }

  // 2. Standard garments matrix check
  if (p.garments && typeof p.garments === 'object') {
    const foundGKey = Object.keys(p.garments).find(k => norm(k) === norm(garmentName));
    if (foundGKey) {
      const fObj = p.garments[foundGKey];
      let sku: string | undefined = undefined;
      let fabricSku: string | undefined = undefined;

      if (typeof fObj === 'object' && fObj !== null) {
        const rawSku = (fObj as { sku?: unknown; _sku?: unknown }).sku || (fObj as { _sku?: unknown })._sku;
        if (typeof rawSku === 'string') sku = rawSku;
        if (fabricName) {
          const foundFKey = Object.keys(fObj).find(k => norm(k) === norm(fabricName));
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

/**
 * Resolves available fabrics for a garment with the Primary fabric pinned strictly at index 0,
 * followed by all remaining fabrics sorted alphabetically (A-Z).
 */
export function getSortedFabricsForGarment(
  pricing: unknown,
  garmentName?: string,
  presetFabrics?: string[] | null
): { sortedFabrics: string[]; primaryFabric: string } {
  if (!pricing || typeof pricing !== 'object' || !garmentName) {
    return { sortedFabrics: [], primaryFabric: '' };
  }

  const p = pricing as { catalogGarments?: unknown; garments?: Record<string, Record<string, unknown>> };
  const targetNameNorm = norm(garmentName);
  let availableFabrics: string[] = [];
  let detectedPrimary = '';

  if (presetFabrics && presetFabrics.length > 0) {
    availableFabrics = [...presetFabrics];
    detectedPrimary = presetFabrics[0] || '';
  }

  if (availableFabrics.length === 0) {
    const catalog = parseCatalog(p.catalogGarments);
    const matchedG = catalog.find(g => (g.name && norm(g.name) === targetNameNorm) || (g.id && norm(g.id) === targetNameNorm));
    if (matchedG) {
      const vars = extractVariants(matchedG);
      availableFabrics = vars.map(v => v.fabricName || '').filter(Boolean);
      const primaryVar = vars.find(v => v.isPrimary) || (matchedG.defaultFabric ? vars.find(v => v.fabricName === matchedG.defaultFabric) : null) || vars[0];
      if (primaryVar?.fabricName) detectedPrimary = primaryVar.fabricName;
    }
  }

  if (availableFabrics.length === 0 && p.garments && typeof p.garments === 'object') {
    const foundGKey = Object.keys(p.garments).find(k => norm(k) === targetNameNorm);
    if (foundGKey) {
      const fObj = p.garments[foundGKey];
      if (typeof fObj === 'object' && fObj !== null) {
        availableFabrics = Object.keys(fObj).filter(k => {
          if (k.startsWith('_') || k === 'sku') return false;
          if (garmentName === 'Gorro' && (k.includes('Tornado') || k.includes('1ra'))) return false;
          return true;
        });

        for (const [fName, fVal] of Object.entries(fObj)) {
          if (typeof fVal === 'object' && fVal !== null && (fVal as { isPrimary?: boolean }).isPrimary) {
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

