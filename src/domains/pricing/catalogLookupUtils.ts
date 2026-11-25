import { areFabricsEquivalent } from './fabricAliasMap';

export interface GenericVariant {
  fabricName?: string;
  fabricSku?: string;
  sku?: string;
  priceRaleo?: number;
  priceB2B?: number;
  isPrimary?: boolean;
}

export interface GenericCatalogGarment {
  id?: string;
  name?: string;
  sku?: string;
  category?: string;
  defaultFabric?: string;
  defaultFabricName?: string;
  priceRaleo?: number;
  priceB2B?: number;
  variants?: GenericVariant[];
  fabricVariants?: Record<string, GenericVariant>;
}

export function parseCatalog(raw: unknown): GenericCatalogGarment[] {
  if (Array.isArray(raw)) return raw as GenericCatalogGarment[];
  if (raw && typeof raw === 'object') {
    return Object.entries(raw as Record<string, GenericCatalogGarment>).map(([k, v]) => ({
      ...v,
      name: v?.name || k,
      id: v?.id || k,
    }));
  }
  return [];
}

export function extractVariants(g: GenericCatalogGarment): GenericVariant[] {
  if (Array.isArray(g.variants)) return g.variants;
  if (g.fabricVariants && typeof g.fabricVariants === 'object') {
    return Object.entries(g.fabricVariants).map(([fName, val]) => ({
      ...val,
      fabricName: val?.fabricName || fName,
    }));
  }
  return [];
}

export function matchCatalogVariant(
  vars: GenericVariant[],
  fabricName?: string,
  fabricSku?: string
): GenericVariant | undefined {
  if (fabricSku) {
    const targetSku = fabricSku.toUpperCase();
    const bySku = vars.find(
      (x) => (x.fabricSku && x.fabricSku.toUpperCase() === targetSku) || (x.sku && x.sku.toUpperCase() === targetSku)
    );
    if (bySku) return bySku;
  }
  if (fabricName) {
    const byFabric = vars.find((x) => x.fabricName && areFabricsEquivalent(x.fabricName, fabricName));
    if (byFabric) return byFabric;
  }
  return vars.find((x) => x.isPrimary) || vars[0];
}
