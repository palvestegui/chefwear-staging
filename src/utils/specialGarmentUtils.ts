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
