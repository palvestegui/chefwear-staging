export const BASE_GARMENT_OPTIONS = [
  'Filipina',
  'Pantalón',
  'Mandil',
  'Gorro',
  'Camisa Columbia',
  'Camisa (servicio)',
  'Camisa (hospitalar)',
  'Guardapolvo',
  'Delantal'
] as const;

export type BaseGarmentType = typeof BASE_GARMENT_OPTIONS[number];

export const getInferredBaseFamily = (garmentName: string): string => {
  const norm = String(garmentName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (norm.includes('pantalon') || norm.includes('jogger')) return 'Pantalón';
  if (norm.includes('mandil') || norm.includes('delantal')) return 'Mandil';
  if (norm.includes('gorro') || norm.includes('cofia') || norm.includes('bandana')) return 'Gorro';
  if (norm.includes('guardapolvo') || norm.includes('bata')) return 'Guardapolvo';
  if (norm.includes('columbia')) return 'Camisa Columbia';
  if (norm.includes('hospitalar') || norm.includes('clinica')) return 'Camisa (hospitalar)';
  if (norm.includes('servicio') || norm.includes('mesero') || norm.includes('mesas')) return 'Camisa (servicio)';
  if (norm.includes('camisa')) return 'Camisa (servicio)';
  return 'Filipina';
};

export const METADATA_KEYS = new Set([
  'sku',
  'baseGarment',
  'id',
  'name',
  'category',
  'isPrimary',
  'fabricSku'
]);

export const deriveCandidateFabrics = (
  garments: Record<string, any> | undefined,
  baseGarment: string,
  rawGarmentRecord: Record<string, any>
): string[] => {
  const baseGarmentFabrics = garments?.[baseGarment] || {};
  const baseKeys = Object.keys(baseGarmentFabrics).filter(
    k => !METADATA_KEYS.has(k) && !k.startsWith('_') && !(k in rawGarmentRecord)
  );

  const allWorkshopFabrics = new Set<string>();
  Object.values(garments || {}).forEach((gData: any) => {
    if (gData && typeof gData === 'object') {
      Object.keys(gData).forEach(k => {
        if (!METADATA_KEYS.has(k) && !k.startsWith('_') && !(k in rawGarmentRecord)) {
          allWorkshopFabrics.add(k);
        }
      });
    }
  });

  const combined = Array.from(new Set([...baseKeys, ...Array.from(allWorkshopFabrics)]));
  return combined.sort((a, b) => a.localeCompare(b));
};
