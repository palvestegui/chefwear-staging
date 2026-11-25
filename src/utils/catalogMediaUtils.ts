import { parseCatalog } from '../domains/pricing/catalogLookupUtils';
import { normalizeLabel } from '../domains/pricing/fabricAliasMap';
import { CatalogGarmentPricing, PricingData } from '../types';

export interface CatalogMediaDoc {
  garmentName?: string;
  sku?: string;
  imageUrl?: string;
  backImageUrl?: string;
  updatedAt?: string;
}

export interface ResolvedGarmentMedia {
  imageUrl?: string;
  backImageUrl?: string;
}

export function hydratePricingWithMediaDocs(
  pricing: PricingData,
  mediaDocs: CatalogMediaDoc[]
): PricingData {
  if (!pricing?.catalogGarments || mediaDocs.length === 0) return pricing;

  const byName = new Map<string, CatalogMediaDoc>();
  const bySku = new Map<string, CatalogMediaDoc>();
  for (const m of mediaDocs) {
    if (m.garmentName) byName.set(normalizeLabel(m.garmentName), m);
    if (m.sku) bySku.set(m.sku.trim().toUpperCase(), m);
  }

  const mergeEntry = <T extends { name?: string; sku?: string; imageUrl?: string; backImageUrl?: string }>(
    entry: T,
    fallbackKey?: string
  ): T => {
    const nameKey = normalizeLabel(entry.name || fallbackKey || '');
    const skuKey = entry.sku ? entry.sku.trim().toUpperCase() : '';
    const media = (nameKey ? byName.get(nameKey) : undefined) || (skuKey ? bySku.get(skuKey) : undefined);
    if (!media) return entry;
    const imageUrl = entry.imageUrl || media.imageUrl;
    const backImageUrl = entry.backImageUrl || media.backImageUrl;
    if (imageUrl === entry.imageUrl && backImageUrl === entry.backImageUrl) return entry;
    return {
      ...entry,
      ...(imageUrl ? { imageUrl } : {}),
      ...(backImageUrl ? { backImageUrl } : {}),
    };
  };

  if (Array.isArray(pricing.catalogGarments)) {
    return {
      ...pricing,
      catalogGarments: pricing.catalogGarments.map((item) => mergeEntry(item)),
    };
  }

  const nextMap: Record<string, CatalogGarmentPricing> = {};
  for (const [key, item] of Object.entries(pricing.catalogGarments)) {
    nextMap[key] = mergeEntry(item, key);
  }
  return { ...pricing, catalogGarments: nextMap };
}

export function resolveGarmentMedia(
  pricing: PricingData | null | undefined,
  garmentName?: string
): ResolvedGarmentMedia {
  if (!pricing?.catalogGarments || !garmentName) return {};
  const target = normalizeLabel(garmentName);
  const matched = parseCatalog(pricing.catalogGarments).find(
    (entry) =>
      (entry.name && normalizeLabel(entry.name) === target) ||
      (entry.id && normalizeLabel(entry.id) === target)
  );
  if (!matched) return {};

  const imageUrl = matched.imageUrl || matched.frontImage || matched.image || undefined;
  const backImageUrl = matched.backImageUrl || matched.backImage || undefined;
  return {
    ...(imageUrl ? { imageUrl } : {}),
    ...(backImageUrl ? { backImageUrl } : {}),
  };
}
