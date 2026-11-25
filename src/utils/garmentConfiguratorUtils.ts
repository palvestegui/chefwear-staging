import { parseCatalog } from '../domains/pricing/catalogLookupUtils';
import { normalizeLabel } from '../domains/pricing/fabricAliasMap';
import { PricingData } from '../types';
import { requiredFields } from './constants';
import { isServiceApplicable, ServiceItem } from './serviceUtils';

export interface CatalogOptionItem {
  name: string;
  category?: string;
  sku?: string;
}

export interface GroupedGarmentOptions {
  presetGarments: string[];
  baseGarments: string[];
  catalogGarments: CatalogOptionItem[];
}

export function buildGroupedGarmentOptions(
  pricing: PricingData | null | undefined,
  activePresetKey: string | null,
  specialPresets: Record<string, Record<string, unknown>>
): GroupedGarmentOptions {
  const seen = new Set<string>();
  const sortEs = (a: string, b: string) => a.localeCompare(b, 'es', { sensitivity: 'base' });

  const presetRaw = activePresetKey && specialPresets[activePresetKey]
    ? Object.keys(specialPresets[activePresetKey])
    : [];
  const presetGarments = presetRaw
    .filter((name) => {
      const norm = normalizeLabel(name);
      if (!norm || seen.has(norm)) return false;
      seen.add(norm);
      return true;
    })
    .sort(sortEs);

  const baseRaw = Object.keys(pricing?.garments || {});
  const baseGarments = baseRaw
    .filter((name) => {
      const norm = normalizeLabel(name);
      if (!norm || seen.has(norm)) return false;
      seen.add(norm);
      return true;
    })
    .sort(sortEs);

  const parsedCatalog = parseCatalog(pricing?.catalogGarments);
  const catalogGarments: CatalogOptionItem[] = [];
  for (const entry of parsedCatalog) {
    const rawName = (entry.name || entry.id || '').trim();
    const norm = normalizeLabel(rawName);
    if (!rawName || !norm || seen.has(norm)) continue;
    seen.add(norm);
    catalogGarments.push({
      name: rawName,
      category: entry.category,
      sku: entry.sku,
    });
  }
  catalogGarments.sort((a, b) => sortEs(a.name, b.name));

  return { presetGarments, baseGarments, catalogGarments };
}

export function resolveCatalogCategory(
  pricing: PricingData | null | undefined,
  garmentName?: string
): string | undefined {
  if (!pricing?.catalogGarments || !garmentName) return undefined;
  const target = normalizeLabel(garmentName);
  const matched = parseCatalog(pricing.catalogGarments).find(
    (entry) =>
      (entry.name && normalizeLabel(entry.name) === target) ||
      (entry.id && normalizeLabel(entry.id) === target)
  );
  return matched?.category;
}

export function resolveGarmentBaseFamily(
  garmentName: string,
  catalogCategory?: string
): string {
  const haystack = normalizeLabel(`${garmentName || ''} ${catalogCategory || ''}`);
  if (haystack.includes('pantalon') || haystack.includes('jogger')) return 'Pantalón';
  if (haystack.includes('mandil') || haystack.includes('delantal')) return 'Mandil';
  if (
    haystack.includes('gorro') ||
    haystack.includes('cofia') ||
    haystack.includes('bandana') ||
    haystack.includes('boina') ||
    haystack.includes('toca')
  ) {
    return 'Gorro';
  }
  if (
    haystack.includes('regulador') ||
    haystack.includes('conector') ||
    haystack.includes('accesorio') ||
    haystack.includes('tirante')
  ) {
    return 'Accesorios';
  }
  if (haystack.includes('guardapolvo') || haystack.includes('bata')) return 'Guardapolvo';
  if (haystack.includes('camisa')) {
    if (haystack.includes('hospitalar') || haystack.includes('clinica')) return 'Camisa (hospitalar)';
    if (haystack.includes('columbia')) return 'Camisa Columbia';
    return 'Camisa (servicio)';
  }
  if (haystack.includes('chamarra') || haystack.includes('chaqueta')) return 'Chamarra';
  if (haystack.includes('filipina')) return 'Filipina';
  return garmentName;
}

export function resolveGarmentSizingKey(
  garmentName: string,
  catalogCategory?: string
): string {
  if (!garmentName) return '';
  if (garmentName === 'Uniforme Completo UDI') return 'Uniforme Completo UDI';
  if (Object.prototype.hasOwnProperty.call(requiredFields, garmentName)) {
    return garmentName;
  }

  const family = resolveGarmentBaseFamily(garmentName, catalogCategory);
  if (family === 'Pantalón') return 'Pantalón';
  if (
    family === 'Filipina' ||
    family === 'Chamarra' ||
    family === 'Guardapolvo' ||
    family === 'Camisa (servicio)' ||
    family === 'Camisa (hospitalar)' ||
    family === 'Camisa Columbia'
  ) {
    return 'Filipina';
  }
  if (family === 'Mandil' || family === 'Gorro' || family === 'Accesorios') {
    return 'Mandil';
  }
  return '';
}

export interface RelevantServicesParams {
  services?: ServiceItem[];
  garmentName: string;
  baseFamily: string;
  presetKey: string | null;
  isUdiMode: boolean;
  allStandardGarments: string[];
  allSpecialPresets: Record<string, Record<string, unknown>>;
}

export function getUniqueRelevantServices(params: RelevantServicesParams): ServiceItem[] {
  const {
    services = [],
    garmentName,
    baseFamily,
    presetKey,
    isUdiMode,
    allStandardGarments,
    allSpecialPresets,
  } = params;

  const relevant = services.filter((srv) => {
    if (
      isServiceApplicable(srv, {
        garmentName,
        presetKey,
        isUdiMode,
        allStandardGarments,
        allSpecialPresets,
      })
    ) {
      return true;
    }
    if (baseFamily && baseFamily !== garmentName) {
      return isServiceApplicable(srv, {
        garmentName: baseFamily,
        presetKey,
        isUdiMode,
        allStandardGarments,
        allSpecialPresets,
      });
    }
    return false;
  });

  const uniqueMap = new Map<string, ServiceItem>();
  for (const srv of relevant) {
    const key = srv.name || '';
    if (!key) continue;
    const existing = uniqueMap.get(key);
    if (!existing) {
      uniqueMap.set(key, srv);
    } else if (srv.garment === garmentName) {
      uniqueMap.set(key, srv);
    } else if (srv.garment === baseFamily && existing.garment !== garmentName) {
      uniqueMap.set(key, srv);
    }
  }
  return Array.from(uniqueMap.values());
}
