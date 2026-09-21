/**
 * Utility functions for resolving service applicability across Tab A (Standard garments)
 * and Tab B (Special Presets like UDI Especial and custom contracts).
 */

export interface ServiceItem {
  name?: string;
  garment?: string;
  type?: string;
  price?: number | null;
  exclusionGroup?: string;
  isGlobal?: boolean;
  appliesToStandard?: string[];
  appliesToSpecial?: Record<string, string[]>;
  [key: string]: unknown;
}

/**
 * Initializes or normalizes the applicability of a service item.
 * Supports legacy formats (srv.garment === 'Global' or srv.garment === 'Mandil')
 * while enabling granular multi-garment mapping across Tab A and Tab B.
 */
export const normalizeServiceApplicability = (
  srv: any,
  allStandardGarments: string[] = [],
  allSpecialPresets: Record<string, Record<string, any>> = {}
): ServiceItem => {
  const isGlobal = srv.isGlobal === true || srv.garment === 'Global';
  
  let appliesToStandard: string[] = [];
  if (Array.isArray(srv.appliesToStandard)) {
    appliesToStandard = [...srv.appliesToStandard];
  } else if (isGlobal) {
    appliesToStandard = [...allStandardGarments];
  } else if (srv.garment && srv.garment !== 'Global') {
    appliesToStandard = [srv.garment];
  }

  const appliesToSpecial: Record<string, string[]> = {};
  Object.keys(allSpecialPresets).forEach(presetKey => {
    if (srv.appliesToSpecial && Array.isArray(srv.appliesToSpecial[presetKey])) {
      appliesToSpecial[presetKey] = [...srv.appliesToSpecial[presetKey]];
    } else if (isGlobal) {
      appliesToSpecial[presetKey] = Object.keys(allSpecialPresets[presetKey] || {});
    } else if (presetKey === 'UDI Especial' && srv.garment && srv.garment !== 'Global') {
      // Legacy compatibility: if srv was defined for 'Mandil', and UDI has 'Mandil'
      if (allSpecialPresets[presetKey]?.[srv.garment]) {
        appliesToSpecial[presetKey] = [srv.garment];
      }
    }
  });

  return {
    ...srv,
    isGlobal,
    appliesToStandard,
    appliesToSpecial
  };
};

/**
 * Determines if a service is allowed/applicable for a given garment
 * in either Standard mode (Tab A) or Special Preset mode (Tab B).
 */
export const isServiceApplicable = (
  service: any,
  context: {
    garmentName: string;
    presetKey?: string | null;
    isUdiMode?: boolean;
    allStandardGarments?: string[];
    allSpecialPresets?: Record<string, any>;
  }
): boolean => {
  if (!service) return false;
  const { garmentName, presetKey, isUdiMode } = context;
  const isUdiBundle = garmentName === 'Uniforme Completo UDI';
  const effectivePreset = presetKey || (isUdiMode || isUdiBundle ? 'UDI Especial' : null);

  if (service.isGlobal === true || service.garment === 'Global') {
    if (effectivePreset && service.appliesToSpecial?.[effectivePreset]) {
      const allowed = service.appliesToSpecial[effectivePreset];
      if (Array.isArray(allowed)) {
        if (allowed.length === 0) return false;
        if (isUdiBundle) return true;
        return allowed.some((g: string) => g.toLowerCase() === garmentName.toLowerCase());
      }
    }
    if (!effectivePreset && service.appliesToStandard && Array.isArray(service.appliesToStandard)) {
      if (service.appliesToStandard.length === 0) return false;
      return service.appliesToStandard.some((g: string) => g.toLowerCase() === garmentName.toLowerCase());
    }
    return true;
  }

  if (effectivePreset) {
    if (service.appliesToSpecial && Array.isArray(service.appliesToSpecial[effectivePreset])) {
      const allowedList = service.appliesToSpecial[effectivePreset];
      if (isUdiBundle) return allowedList.length > 0;
      return allowedList.some((g: string) => g.toLowerCase() === garmentName.toLowerCase());
    }
    if (effectivePreset === 'UDI Especial' || isUdiMode || isUdiBundle) {
      const defaultUdi = ['Tiros sencillos (estándar)', 'Tiros cruzados', 'Regulador de Cuero', 'Regulador de Argolla de Metal', 'Nombre en el bolsillo', 'Jogger', 'Botón/Cierre'];
      if (defaultUdi.some(u => u.toLowerCase() === (service.name || '').toLowerCase())) {
        if (!service.garment || service.garment === 'Global' || isUdiBundle || service.garment.toLowerCase() === garmentName.toLowerCase()) {
          return true;
        }
      }
    }
    return false;
  }

  if (service.appliesToStandard && Array.isArray(service.appliesToStandard)) {
    return service.appliesToStandard.some((g: string) => g.toLowerCase() === garmentName.toLowerCase());
  }
  return service.garment === 'Global' || (service.garment && service.garment.toLowerCase() === garmentName.toLowerCase());
};

/**
 * Returns a human-friendly summary text of where the service applies.
 */
export const getApplicabilitySummary = (
  service: any,
  standardGarments: string[] = [],
  specialPresets: Record<string, any> = {}
): string => {
  if (service.isGlobal === true || service.garment === 'Global') {
    return 'Todas las prendas (Global Tab A & Tab B)';
  }

  const parts: string[] = [];

  const stdList = service.appliesToStandard || (service.garment && service.garment !== 'Global' ? [service.garment] : []);
  if (stdList.length > 0) {
    if (stdList.length === standardGarments.length && standardGarments.length > 0) {
      parts.push('Tab A (Todas)');
    } else {
      parts.push(`Tab A: ${stdList.join(', ')}`);
    }
  }

  const specMap = service.appliesToSpecial || {};
  Object.entries(specMap).forEach(([pKey, gList]) => {
    const list = gList as string[];
    if (list && list.length > 0) {
      const allForPreset = Object.keys(specialPresets[pKey] || {});
      if (allForPreset.length > 0 && list.length === allForPreset.length) {
        parts.push(`${pKey} (Todas)`);
      } else {
        parts.push(`${pKey}: ${list.join(', ')}`);
      }
    }
  });

  if (parts.length === 0) {
    return 'Ninguna prenda seleccionada';
  }

  return parts.join(' | ');
};

export const DEFAULT_EXCLUSION_GROUPS: string[] = [
  'MANGA', 'TIROS', 'REGULADOR', 'CUELLO', 'TELA DEPORTIVA', 'CIERRE', 'BOLSILLO', 'ESPALDA', 'PECHERA', 'BOTONES', 'VIVO'
];

export type ServiceCategoryKey = 'ALL' | 'FILIPINAS' | 'MANDILES' | 'PANTALONES' | 'GORROS' | 'BORDADOS' | 'OTROS';

export const CATEGORY_FILTERS: Array<{ key: ServiceCategoryKey; label: string }> = [
  { key: 'ALL', label: 'Todos' },
  { key: 'FILIPINAS', label: 'Filipinas' },
  { key: 'MANDILES', label: 'Mandiles' },
  { key: 'PANTALONES', label: 'Pantalones' },
  { key: 'GORROS', label: 'Gorros' },
  { key: 'BORDADOS', label: 'Bordados & Logos' },
  { key: 'OTROS', label: 'Especiales / Otros' },
];

export const normalizeText = (text: string | undefined | null): string => {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

export const matchesCategory = (srv: ServiceItem, category: ServiceCategoryKey): boolean => {
  if (category === 'ALL') return true;

  const name = normalizeText(srv.name);
  const garment = normalizeText(srv.garment);
  const group = normalizeText(srv.exclusionGroup);
  const stdList = Array.isArray(srv.appliesToStandard)
    ? srv.appliesToStandard.map(normalizeText)
    : [];

  const isBordado =
    srv.type === 'Escala de Volumen (Logos)' ||
    name.includes('bordad') || name.includes('logo') || name.includes('matriz') ||
    name.includes('estampad') || name.includes('vinil') || name.includes('ponchad') ||
    group.includes('bordad') || group.includes('logo');

  if (category === 'BORDADOS') {
    return isBordado;
  }

  const isGorro =
    name.includes('gorro') || name.includes('cofia') || name.includes('bandana') ||
    name.includes('boina') || name.includes('toca') || garment.includes('gorro') || garment.includes('cofia') ||
    (stdList.length > 0 && stdList.some(g => g.includes('gorro') || g.includes('cofia')));

  if (category === 'GORROS') {
    return isGorro;
  }

  const isPantalon =
    name.includes('pantalon') || name.includes('jogger') || name.includes('pretina') ||
    garment.includes('pantalon') ||
    (stdList.length > 0 && stdList.some(g => g.includes('pantalon')));

  if (category === 'PANTALONES') {
    return isPantalon;
  }

  const isMandil =
    name.includes('mandil') || name.includes('delantal') || name.includes('tiro') ||
    name.includes('argolla') || name.includes('cuero') || name.includes('regulador') ||
    garment.includes('mandil') || group.includes('tiro') ||
    (stdList.length > 0 && stdList.some(g => g.includes('mandil')));

  if (category === 'MANDILES') {
    return isMandil;
  }

  const isFilipina =
    name.includes('filipina') || name.includes('manga') || name.includes('cuello') ||
    name.includes('pechera') || name.includes('broche') || name.includes('vivo') ||
    garment.includes('filipina') || group.includes('manga') || group.includes('cuello') ||
    (stdList.length > 0 && stdList.some(g => g.includes('filipina')));

  if (category === 'FILIPINAS') {
    return isFilipina;
  }

  if (category === 'OTROS') {
    const isSpecific = isBordado || isGorro || isPantalon || isMandil || isFilipina;
    const isExplicitlyOther =
      srv.isGlobal === true ||
      srv.garment === 'Global' ||
      Boolean(srv.appliesToSpecial && Object.keys(srv.appliesToSpecial).length > 0) ||
      srv.type === 'Variante Base';
    return !isSpecific || isExplicitlyOther;
  }

  return true;
};

export interface ExclusionConflict {
  group: string;
  services: string[];
}

export const detectServiceExclusionConflicts = (
  services: string[] | undefined | null,
  catalogServices?: ServiceItem[]
): ExclusionConflict[] => {
  if (!services || !Array.isArray(services) || services.length < 2) return [];
  const map: Record<string, string[]> = {};
  services.forEach(srvName => {
    if (!srvName) return;
    const cat = catalogServices?.find(c => c.name === srvName);
    const grp = cat?.exclusionGroup?.trim().toUpperCase() ||
      (srvName.toLowerCase().includes('manga') ? 'MANGA' : srvName.toLowerCase().includes('cuello') ? 'CUELLO' : '');
    if (grp) {
      if (!map[grp]) map[grp] = [];
      map[grp].push(srvName);
    }
  });
  return Object.entries(map)
    .filter(([_, list]) => list.length > 1)
    .map(([group, list]) => ({ group, services: list }));
};
