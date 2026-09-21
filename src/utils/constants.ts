import { UserPermissions } from '../types';

export const DEFAULT_USER_CONFIGS: Record<string, UserPermissions> = {
  'palvestegui@gmail.com': {
    role: 'SUPER_ADMIN',
    name: 'Pablo Alvestegui',
    status: 'APPROVED',
    canExport: true,
    canEditPrices: true,
    canManageRoles: true,
    canAccessDangerZone: true,
  },
  'doriscampos@alvestegui.com': {
    role: 'ADMIN_PROD',
    name: 'Doris Campos',
    status: 'APPROVED',
    canExport: true,
    canEditPrices: true,
    canManageRoles: false,
    canAccessDangerZone: false,
  },
  'leonalvestegui@gmail.com': {
    role: 'OPS_LEON',
    name: 'León Alvestegui',
    status: 'APPROVED',
    canExport: true,
    canEditPrices: false,
    canManageRoles: false,
    canAccessDangerZone: false,
  },
  'matiasranda2002@gmail.com': {
    role: 'SALES',
    name: 'Matias Randa',
    status: 'APPROVED',
    canExport: false,
    canEditPrices: false,
    canManageRoles: false,
    canAccessDangerZone: false,
  }
};

export const fieldLabels: Record<string, string> = {
  hombros: 'Hombros',
  cuello: 'Cuello',
  largoBrazo: 'Largo Brazo',
  anchoBrazo: 'Ancho Brazo',
  anchoTorso: 'Ancho Torso',
  largoTorso: 'Largo Torso',
  cintura: 'Cintura',
  cadera: 'Cadera',
  anchoPierna: 'Ancho Pierna',
  largoPierna: 'Largo Pierna'
};

export const INITIAL_SIZE_TABLE = [
  { size: 'XS',  hombro: '38 - 40 cm', pecho: '84 - 88 cm',  cintura: '68 - 72 cm',  cadera: '88 - 92 cm',  largo: '68 cm' },
  { size: 'S',   hombro: '41 - 43 cm', pecho: '89 - 95 cm',  cintura: '73 - 79 cm',  cadera: '93 - 99 cm',  largo: '70 cm' },
  { size: 'M',   hombro: '44 - 46 cm', pecho: '96 - 103 cm', cintura: '80 - 87 cm',  cadera: '100 - 107 cm', largo: '72 cm' },
  { size: 'L',   hombro: '47 - 49 cm', pecho: '104 - 111 cm', cintura: '88 - 95 cm', cadera: '108 - 115 cm', largo: '74 cm' },
  { size: 'XL',  hombro: '50 - 52 cm', pecho: '112 - 119 cm', cintura: '96 - 103 cm', cadera: '116 - 123 cm', largo: '76 cm' },
  { size: 'XXL', hombro: '53 - 55 cm', pecho: '120 - 127 cm', cintura: '104 - 111 cm', cadera: '124 - 131 cm', largo: '78 cm' },
  { size: '3XL', hombro: '56 - 58 cm', pecho: '128 - 135 cm', cintura: '112 - 119 cm', cadera: '132 - 139 cm', largo: '80 cm' }
];

export const INITIAL_SIZE_TABLE_PANTALON = [
  { size: 'XS',  cintura: '68 - 72 cm',  cadera: '88 - 92 cm',  largo: '96 - 100 cm', tiro: '25 - 27 cm' },
  { size: 'S',   cintura: '73 - 79 cm',  cadera: '93 - 99 cm',  largo: '98 - 102 cm', tiro: '26 - 28 cm' },
  { size: 'M',   cintura: '80 - 87 cm',  cadera: '100 - 107 cm', largo: '100 - 104 cm', tiro: '27 - 29 cm' },
  { size: 'L',   cintura: '88 - 95 cm',  cadera: '108 - 115 cm', largo: '102 - 106 cm', tiro: '28 - 30 cm' },
  { size: 'XL',  cintura: '96 - 103 cm', cadera: '116 - 123 cm', largo: '104 - 108 cm', tiro: '29 - 31 cm' },
  { size: 'XXL', cintura: '104 - 111 cm', cadera: '124 - 131 cm', largo: '106 - 110 cm', tiro: '30 - 32 cm' },
  { size: '3XL', cintura: '112 - 119 cm', cadera: '132 - 139 cm', largo: '108 - 112 cm', tiro: '31 - 33 cm' }
];

export const getDocType = (o: { docType?: string; status?: string; id?: string }) => o.docType || (o.status === 'Cotización' || o.status === 'Estimado' || o.id?.startsWith('COT-') ? 'COTIZACION' : 'ORDEN');

export const ACCOUNT_TYPES = [
  'Universidad / Instituto',
  'Restaurante',
  'Panadería',
  'Empresa / Corporate',
  'Particular / Individuo'
] as const;

export type AccountType = typeof ACCOUNT_TYPES[number];

export const ROLES_BY_ACCOUNT_TYPE: Record<string, string[]> = {
  'Universidad / Instituto': ['ESTUDIANTE', 'DOCENTE', 'ADMINISTRATIVO', 'OTRO'],
  'Restaurante': ['CHEF', 'COCINERO', 'SOUS-CHEF', 'MESERO', 'BARTENDER', 'ADMINISTRATIVO', 'OTRO'],
  'Panadería': ['PANADERO', 'PASTELERO', 'VENDEDOR', 'ADMINISTRATIVO', 'OTRO'],
  'Empresa / Corporate': ['COLABORADOR', 'OPERARIO', 'ADMINISTRATIVO', 'EJECUTIVO', 'OTRO'],
  'Particular / Individuo': ['PARTICULAR']
};

export function normalizeAccountType(rawType: string | undefined | null): string {
  if (!rawType) return 'Universidad / Instituto';
  const trimmed = rawType.trim();
  if (ACCOUNT_TYPES.includes(trimmed as AccountType)) return trimmed;

  const lower = trimmed.toLowerCase();
  if (
    lower.includes('universidad') || 
    lower.includes('instituto') || 
    lower.includes('udi') || 
    lower.includes('institucional') ||
    lower.includes('estudiante') ||
    lower.includes('docente') ||
    lower.includes('alumno')
  ) {
    return 'Universidad / Instituto';
  }
  if (
    lower.includes('restaurant') || 
    lower.includes('resto') || 
    lower.includes('chef') || 
    lower.includes('cocin') || 
    lower.includes('garzon') || 
    lower.includes('garzón') || 
    lower.includes('bartender')
  ) {
    return 'Restaurante';
  }
  if (lower.includes('panader') || lower.includes('panific') || lower.includes('repost') || lower.includes('pastel')) {
    return 'Panadería';
  }
  if (lower.includes('empresa') || lower.includes('hotel') || lower.includes('corporate') || lower.includes('corporativ') || lower.includes('b2b') || lower.includes('staff')) {
    return 'Empresa / Corporate';
  }
  if (lower.includes('indiv') || lower.includes('partic') || lower.includes('particular') || lower.includes('personal') || lower.includes('independiente')) {
    return 'Particular / Individuo';
  }
  return 'Particular / Individuo';
}

export function getRolesForAccountType(accountType: string | undefined | null): string[] {
  const norm = normalizeAccountType(accountType);
  return ROLES_BY_ACCOUNT_TYPE[norm] || ['OTRO'];
}

export function normalizeRole(rawRole: string | undefined | null, accountType?: string): string {
  const roles = getRolesForAccountType(accountType);
  if (!rawRole) return roles[0] || 'OTRO';
  const upper = rawRole.trim().toUpperCase();
  if (roles.includes(upper)) return upper;

  // Synonyms mapping
  let mapped = upper;
  if (upper === 'GARZON') mapped = 'GARZÓN';
  if (upper === 'PERSONAL' || upper === 'PERSONAL (STAFF)' || upper === 'STAFF') mapped = roles[0] || 'OTRO';
  if (upper === 'SOUS CHEF') mapped = 'SOUS-CHEF';
  if (upper === 'INDIVIDUO' || upper === 'INDEPENDIENTE') mapped = 'PARTICULAR';

  if (roles.includes(mapped)) return mapped;

  // If the provided role (or mapped) is not valid for this account type, fallback to default for that account type
  return roles[0] || 'OTRO';
}
export const requiredFields: Record<string, string[]> = {'Filipina': ['hombros', 'cuello', 'largoBrazo', 'anchoBrazo', 'anchoTorso', 'largoTorso', 'cintura', 'cadera'],'Pantalón': ['cintura', 'cadera', 'anchoPierna', 'largoPierna'],'Mandil': [],'Gorro': []};

export const PRICING_TIERS = [
  'Estándar Raleo',
  'Estándar B2B',
  'Contrato Institucional',
  'Heredado'
] as const;

export function normalizePricingTier(rawTier: string | undefined | null): string {
  if (!rawTier) return 'Estándar Raleo';
  const trimmed = rawTier.trim();
  const lower = trimmed.toLowerCase();
  
  if (lower === 'estándar raleo' || lower === 'estandar raleo' || lower === 'raleo' || lower === 'minorista' || lower === 'standard' || lower === 'particular' || lower === 'personal') {
    return 'Estándar Raleo';
  }
  if (lower === 'estándar b2b' || lower === 'estandar b2b' || lower === 'b2b estándar' || lower === 'b2b estandar' || lower === 'b2b' || lower === 'b2b mayorista' || lower === 'mayorista') {
    return 'Estándar B2B';
  }
  if (lower === 'contrato institucional' || lower === 'institucional' || lower === 'udi especial' || lower === 'udi' || lower === 'especial udi' || lower === 'tab b') {
    return 'Contrato Institucional';
  }
  if (lower === 'heredado' || lower === 'de cuenta padre') {
    return 'Heredado';
  }
  
  return trimmed;
}

export function isSystemAccount(accountId: string | undefined | null): boolean {
  if (!accountId) return false;
  const clean = accountId.trim().toUpperCase();
  return clean === 'ACC-000' || clean === 'ACC-001';
}

export interface VolumeScaledTier {
  minQty: number;
  unitPrice: number;
}

export const LOGO_VOLUME_RATE_TABLE: VolumeScaledTier[] = [
  { minQty: 6, unitPrice: 20 },
  { minQty: 5, unitPrice: 22 },
  { minQty: 4, unitPrice: 25 },
  { minQty: 3, unitPrice: 30 },
  { minQty: 2, unitPrice: 40 },
  { minQty: 1, unitPrice: 70 },
];
