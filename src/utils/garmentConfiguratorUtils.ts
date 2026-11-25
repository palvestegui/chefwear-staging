import { parseCatalog } from '../domains/pricing/catalogLookupUtils';
import { normalizeLabel } from '../domains/pricing/fabricAliasMap';
import { PricingData } from '../types';
import { requiredFields } from './constants';
import { isServiceApplicable, ServiceItem } from './serviceUtils';

export type GarmentPillKey = 'convenio' | 'base' | 'filipinas' | 'mandiles' | 'chamarras' | 'otros';

export interface GarmentComboboxItem {
  name: string;
  source: 'convenio' | 'base' | 'catalogo';
  category?: string;
  sku?: string;
  pillBucket: Exclude<GarmentPillKey, 'convenio' | 'base'>;
}

export interface GarmentPickerCatalog {
  pills: Record<GarmentPillKey, GarmentComboboxItem[]>;
  allUnique: GarmentComboboxItem[];
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

export function resolveGarmentPillBucket(
  garmentName: string,
  catalogCategory?: string
): Exclude<GarmentPillKey, 'convenio' | 'base'> {
  const family = resolveGarmentBaseFamily(garmentName, catalogCategory);
  if (family === 'Filipina') return 'filipinas';
  if (family === 'Mandil') return 'mandiles';
  if (family === 'Chamarra') return 'chamarras';
  return 'otros';
}

export function buildGarmentPickerCatalog(
  pricing: PricingData | null | undefined,
  activePresetKey: string | null,
  specialPresets: Record<string, Record<string, unknown>>,
  includeUdiBundle: boolean
): GarmentPickerCatalog {
  const sortEs = (a: { name: string }, b: { name: string }) =>
    a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });

  const pills: Record<GarmentPillKey, GarmentComboboxItem[]> = {
    convenio: [],
    base: [],
    filipinas: [],
    mandiles: [],
    chamarras: [],
    otros: [],
  };

  if (activePresetKey && specialPresets[activePresetKey]) {
    const presetNames = Object.keys(specialPresets[activePresetKey])
      .filter((n) => n.trim().length > 0 && n !== 'Uniforme Completo UDI')
      .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    if (includeUdiBundle) {
      pills.convenio.push({
        name: 'Uniforme Completo UDI',
        source: 'convenio',
        category: 'Pack UDI',
        pillBucket: 'otros',
      });
    }
    for (const name of presetNames) {
      pills.convenio.push({
        name,
        source: 'convenio',
        pillBucket: resolveGarmentPillBucket(name),
      });
    }
  } else if (includeUdiBundle) {
    pills.convenio.push({
      name: 'Uniforme Completo UDI',
      source: 'convenio',
      category: 'Pack UDI',
      pillBucket: 'otros',
    });
  }

  const baseRaw = (pricing?.garments || {}) as Record<string, Record<string, unknown>>;
  const baseSeen = new Set<string>();
  const baseItems: GarmentComboboxItem[] = [];
  for (const name of Object.keys(baseRaw)) {
    const norm = normalizeLabel(name);
    if (!name.trim() || !norm || baseSeen.has(norm)) continue;
    baseSeen.add(norm);
    const gObj = baseRaw[name];
    const sku = gObj && typeof gObj === 'object' && typeof gObj.sku === 'string' ? gObj.sku : undefined;
    baseItems.push({
      name,
      source: 'base',
      sku,
      pillBucket: resolveGarmentPillBucket(name),
    });
  }
  baseItems.sort(sortEs);
  pills.base = baseItems;

  const catalogItems: GarmentComboboxItem[] = [];
  const catSeen = new Set<string>(baseSeen);
  for (const entry of parseCatalog(pricing?.catalogGarments)) {
    const rawName = (entry.name || entry.id || '').trim();
    const norm = normalizeLabel(rawName);
    if (!rawName || !norm || catSeen.has(norm)) continue;
    catSeen.add(norm);
    catalogItems.push({
      name: rawName,
      source: 'catalogo',
      category: entry.category,
      sku: entry.sku,
      pillBucket: resolveGarmentPillBucket(rawName, entry.category),
    });
  }
  catalogItems.sort(sortEs);

  for (const item of baseItems) {
    pills[item.pillBucket].push(item);
  }
  for (const item of catalogItems) {
    pills[item.pillBucket].push(item);
  }

  const allUniqueMap = new Map<string, GarmentComboboxItem>();
  for (const item of [...pills.convenio, ...pills.base, ...catalogItems]) {
    const norm = normalizeLabel(item.name);
    if (norm && !allUniqueMap.has(norm)) {
      allUniqueMap.set(norm, item);
    }
  }

  return { pills, allUnique: Array.from(allUniqueMap.values()) };
}

export function filterComboboxItems(
  catalog: GarmentPickerCatalog,
  activePill: GarmentPillKey,
  query: string
): GarmentComboboxItem[] {
  const cleanQuery = normalizeLabel(query);
  if (!cleanQuery) return catalog.pills[activePill];

  const pillSet = new Set(catalog.pills[activePill].map((i) => normalizeLabel(i.name)));
  return catalog.allUnique
    .filter((item) => {
      const hay = normalizeLabel(`${item.name} ${item.category || ''} ${item.sku || ''}`);
      return hay.includes(cleanQuery);
    })
    .sort((a, b) => {
      const aIn = pillSet.has(normalizeLabel(a.name)) ? 0 : 1;
      const bIn = pillSet.has(normalizeLabel(b.name)) ? 0 : 1;
      if (aIn !== bIn) return aIn - bIn;
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });
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
