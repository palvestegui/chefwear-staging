import { AssignedUserRole, UserPermissions } from '../types';

export interface RolePermissionsConfig {
  dbRole: string;
  label: string;
  description: string;
  permissions: {
    canExport: boolean;
    canEditPrices: boolean;
    canManageRoles: boolean;
    canAccessDangerZone: boolean;
  };
}

export const ASSIGNED_ROLE_CONFIG: Record<AssignedUserRole, RolePermissionsConfig> = {
  ventas: {
    dbRole: 'VENTAS',
    label: 'Ventas',
    description: 'Gestión comercial, cotizaciones, órdenes activas y clientes',
    permissions: {
      canExport: false,
      canEditPrices: false,
      canManageRoles: false,
      canAccessDangerZone: false
    }
  },
  operaciones: {
    dbRole: 'OPERACIONES',
    label: 'Operaciones',
    description: 'Control de compras de material, insumos y corte de prendas',
    permissions: {
      canExport: true,
      canEditPrices: false,
      canManageRoles: false,
      canAccessDangerZone: false
    }
  },
  produccion: {
    dbRole: 'PRODUCCION',
    label: 'Producción',
    description: 'Taller de confección, bordados y seguimiento de prendas',
    permissions: {
      canExport: true,
      canEditPrices: true,
      canManageRoles: false,
      canAccessDangerZone: false
    }
  },
  logistica: {
    dbRole: 'LOGISTICA',
    label: 'Logística',
    description: 'Control de inventario, despachos, entregas y envíos',
    permissions: {
      canExport: false,
      canEditPrices: false,
      canManageRoles: false,
      canAccessDangerZone: false
    }
  },
  admin: {
    dbRole: 'ADMIN',
    label: 'Administración',
    description: 'Acceso total a precios, exportación, roles y sistema',
    permissions: {
      canExport: true,
      canEditPrices: true,
      canManageRoles: true,
      canAccessDangerZone: true
    }
  }
};

/**
 * Standard RFC 5322 regex for comprehensive email validation.
 * Ensures proper local-part and domain structure according to RFC 5322 specification.
 */
export const RFC_5322_EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validateRFC5322Email(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;
  return RFC_5322_EMAIL_REGEX.test(trimmed);
}

export function getDefaultPermissionsForRole(role: string): UserPermissions['canExport'] extends boolean ? {
  canExport: boolean;
  canEditPrices: boolean;
  canManageRoles: boolean;
  canAccessDangerZone: boolean;
} : never {
  const upper = (role || '').toUpperCase();
  if (upper === 'SUPER_ADMIN' || upper === 'SUPERADMIN' || upper === 'ADMIN') {
    return { canExport: true, canEditPrices: true, canManageRoles: true, canAccessDangerZone: true };
  }
  if (upper === 'ADMIN_PROD' || upper === 'PRODUCCION') {
    return { canExport: true, canEditPrices: true, canManageRoles: false, canAccessDangerZone: false };
  }
  if (upper === 'OPS_LEON' || upper === 'OPERACIONES') {
    return { canExport: true, canEditPrices: false, canManageRoles: false, canAccessDangerZone: false };
  }
  return { canExport: false, canEditPrices: false, canManageRoles: false, canAccessDangerZone: false };
}
