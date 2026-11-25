export const PRICING_METADATA_KEYS = new Set<string>([
  'sku',
  'baseGarment',
  'id',
  'name',
  'category',
  'isPrimary',
  'fabricSku',
]);

export function isPricingMetadataKey(key: string): boolean {
  return key.startsWith('_') || PRICING_METADATA_KEYS.has(key);
}

export function isValidFabricPriceValue(val: unknown): boolean {
  return (typeof val === 'object' && val !== null) || typeof val === 'number';
}

export function extractValidFabricEntries(
  record: unknown
): Array<[string, Record<string, unknown> | number]> {
  if (!record || typeof record !== 'object') return [];
  return Object.entries(record as Record<string, unknown>).filter(
    (entry): entry is [string, Record<string, unknown> | number] =>
      !isPricingMetadataKey(entry[0]) && isValidFabricPriceValue(entry[1])
  );
}

export function extractValidFabricKeys(record: unknown): string[] {
  return extractValidFabricEntries(record).map(([key]) => key);
}

export function normalizeLabel(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/[\s\-_/]+/g, ' ');
}

/**
 * Maps legacy Ventas fabric names (and common shorthand variants) to canonical
 * Azafrán Precios upstream fabric names so legacy orders resolve cleanly.
 */
export const LEGACY_TO_CANONICAL_FABRIC: Readonly<Record<string, string>> = {
  'drill de 8oz': 'Tela Drill 8oz',
  'drill 8oz': 'Tela Drill 8oz',
  'tela drill de 8oz': 'Tela Drill 8oz',
  'tela drill 8oz': 'Tela Drill 8oz',
  'drill de 6oz': 'Tela Drill 6oz',
  'drill 6oz': 'Tela Drill 6oz',
  'tela drill de 6oz': 'Tela Drill 6oz',
  'tela drill 6oz': 'Tela Drill 6oz',
  'gabardina de 1ra': 'Gabardina / Caqui 1ra',
  'gabardina 1ra': 'Gabardina / Caqui 1ra',
  'caqui 1ra': 'Gabardina / Caqui 1ra',
  'caqui de 1ra': 'Gabardina / Caqui 1ra',
  'gabardina caqui 1ra': 'Gabardina / Caqui 1ra',
  'gabardina de 2da': 'Gabardina / Caqui 2da',
  'gabardina 2da': 'Gabardina / Caqui 2da',
  'caqui 2da': 'Gabardina / Caqui 2da',
  'caqui de 2da': 'Gabardina / Caqui 2da',
  'gabardina caqui 2da': 'Gabardina / Caqui 2da',
  'tornado (bull denim)': 'Tela Tornado',
  'tornado bull denim': 'Tela Tornado',
  'tornado': 'Tela Tornado',
  'tela tornado': 'Tela Tornado',
  'bull denim': 'Tela Bull Denim',
  'tela bull denim': 'Tela Bull Denim',
  'cristal': 'Cristal Camisero',
  'tela cristal': 'Cristal Camisero',
  'cristal camisero': 'Cristal Camisero',
  'drill mixto 62 38': 'Camisería Mix',
  'drill mixto': 'Camisería Mix',
  'camiseria mix': 'Camisería Mix',
  'popelina': 'Popelina Office',
  'popelina office': 'Popelina Office',
  'ultra hospitalar': 'Ultra Hospitalar',
  'tela ultra hospitalar': 'Ultra Hospitalar',
  'cuero': 'Cuero',
};

export function canonicalizeFabricName(name: string): string {
  const key = normalizeLabel(name);
  return LEGACY_TO_CANONICAL_FABRIC[key] || name.trim();
}

export function fabricMatchKey(name: string): string {
  return normalizeLabel(canonicalizeFabricName(name));
}

export function areFabricsEquivalent(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  return fabricMatchKey(a) === fabricMatchKey(b);
}
