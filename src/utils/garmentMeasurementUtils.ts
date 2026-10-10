/**
 * Garment classification utilities for tailoring measurements.
 * Restricts tailoring measurements strictly to genuine tailored garments:
 * - Upper-body: Filipina, Chamarra, Camisa (8 points)
 * - Lower-body: Pantalón (4 points)
 * - Complete Bundles: Uniforme Completo UDI (12 points)
 * - Unitalla (0 points): Mandil, Gorro, Delantal, Accesorios
 */

export const isUpperTailored = (name: string): boolean => /filipina|chamarra|camisa/i.test(name || '');

export const isLowerTailored = (name: string): boolean => /pantalon|pantalón/i.test(name || '');

export const isBundleGarment = (name: string): boolean => /completo udi/i.test(name || '');

export const isTailored = (name: string): boolean => isUpperTailored(name) || isLowerTailored(name) || isBundleGarment(name);

export const getTailoredMeasurementCount = (name: string): number => {
  if (isBundleGarment(name)) return 12;
  if (isUpperTailored(name)) return 8;
  if (isLowerTailored(name)) return 4;
  return 0;
};

export const getMeasurementButtonLabel = (name: string): string => {
  const count = getTailoredMeasurementCount(name);
  if (count > 0) return `${count} Medidas`;
  return 'Medidas';
};

export interface MeasurementPoint {
  k: string;
  v: string | number | undefined;
}

export const getMeasurementPoints = (
  specs: Record<string, string | number | undefined> | null | undefined,
  isPan?: boolean
): MeasurementPoint[] => {
  if (!specs) return [];
  return isPan ? [
    { k: 'Cintura', v: specs.cintura || specs.P_Cintura },
    { k: 'Cadera', v: specs.cadera || specs.P_Cadera },
    { k: 'Ancho Pierna', v: specs.anchoPierna || specs.P_Ancho_Pierna },
    { k: 'Largo Pierna', v: specs.largoPierna || specs.P_Largo_Pierna }
  ] : [
    { k: 'Hombros', v: specs.hombros || specs.F_Hombros },
    { k: 'Cuello', v: specs.cuello || specs.F_Cuello },
    { k: 'Pecho', v: specs.anchoTorso || specs.F_Ancho_Torso },
    { k: 'Largo Torso', v: specs.largoTorso || specs.F_Largo_Torso },
    { k: 'Cintura', v: specs.cintura || specs.F_Cintura },
    { k: 'Cadera', v: specs.cadera || specs.F_Cadera },
    { k: 'Largo Brazo', v: specs.largoBrazo || specs.F_Largo_Brazo },
    { k: 'Ancho Brazo', v: specs.anchoBrazo || specs.F_Ancho_Brazo }
  ];
};
