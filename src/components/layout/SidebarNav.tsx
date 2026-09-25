import React, { useState } from 'react';
import { 
  ChefHat, 
  ShoppingCart, 
  Scissors, 
  Shirt, 
  Truck, 
  Package, 
  BarChart, 
  UserCircle, 
  History, 
  Settings, 
  LogOut, 
  Ruler, 
  Tag, 
  ChevronDown,
  X,
  Menu
} from 'lucide-react';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';

export interface SidebarNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  onCloseMobile?: () => void;
  isApproved: boolean;
  onToggleCollapse?: () => void;
  ventasTab?: string;
  setVentasTab?: (tab: any) => void;
  settingsTab?: 'A' | 'B' | 'C' | 'D' | 'E' | 'seguridad';
  setSettingsTab?: (tab: 'A' | 'B' | 'C' | 'D' | 'E' | 'seguridad') => void;
  invalidPriceFields?: Set<string>;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  onCloseMobile,
  isApproved,
  onToggleCollapse,
  ventasTab,
  setVentasTab,
  settingsTab = 'A',
  setSettingsTab,
  invalidPriceFields
}) => {
  const { userProfile, isSuperAdmin, isAdmin } = useAuth();
  const canManageRoles = Boolean(isSuperAdmin || userProfile?.canManageRoles || isAdmin);
  
  // Taller sub-menu expanded state in sidebar
  const isTallerActive = ['operaciones', 'produccion', 'logistica'].includes(activeTab);
  const [tallerExpanded, setTallerExpanded] = useState<boolean>(true);

  // Ventas sub-menu expanded state
  const isVentasActive = ['ventas', 'tallas', 'precios'].includes(activeTab);
  const [ventasExpanded, setVentasExpanded] = useState<boolean>(true);

  // Ajustes sub-menu expanded state
  const isAjustesActive = activeTab === 'ajustes';
  const [ajustesExpanded, setAjustesExpanded] = useState<boolean>(true);

  const hasTabAErrors = Array.from(invalidPriceFields || []).some(k => String(k).startsWith('tabA:'));
  const hasTabBErrors = Array.from(invalidPriceFields || []).some(k => String(k).startsWith('tabB:'));

  const handleSelect = (tab: string) => {
    setActiveTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleSettingsSubTab = (tab: 'A' | 'B' | 'C' | 'D' | 'E' | 'seguridad') => {
    setActiveTab('ajustes');
    if (setSettingsTab) {
      setSettingsTab(tab);
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleStatusClick = (status: string) => {
    setActiveTab('ventas');
    if (setVentasTab) {
      setVentasTab(status);
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <div className={`flex flex-col justify-between h-full w-full ${isCollapsed ? 'items-center' : ''}`}>
      {/* Top Header & Brand */}
      <div className="w-full flex flex-col gap-4">
        <div className={`flex items-center justify-between pb-3 border-b border-stone-800/80 ${isCollapsed ? 'justify-center' : 'px-1'}`}>
          {isCollapsed ? (
            <button
              onClick={onToggleCollapse}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition flex items-center justify-center"
              title="Expandir Menú Lateral"
              aria-label="Expandir Menú Lateral"
            >
              <Menu size={18} />
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <ChefHat size={18} />
                </div>
                <div>
                  <div className="flex items-center">
                    <h1 className="text-sm font-black tracking-tight text-stone-100 uppercase">Azafrán</h1>
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/40">
                      STAGING
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-500 font-semibold tracking-wider uppercase">Chefwear CRM</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {onToggleCollapse && (
                  <button
                    onClick={onToggleCollapse}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition hidden lg:flex"
                    title="Colapsar Menú Lateral"
                    aria-label="Colapsar Menú Lateral"
                  >
                    <Menu size={18} />
                  </button>
                )}
                {onCloseMobile && (
                  <button 
                    onClick={onCloseMobile}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition lg:hidden"
                    title="Cerrar Menú"
                    aria-label="Cerrar Menú"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1 w-full">
          {/* 1. VENTAS */}
          <div>
            <div className={`w-full flex items-center justify-between rounded-xl transition-all ${
              isVentasActive
                ? 'bg-amber-600 text-white font-black shadow-md shadow-amber-950/40'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}>
              <button
                onClick={() => handleSelect('ventas')}
                className={`flex items-center gap-2.5 px-3 py-2.5 text-xs uppercase tracking-wider flex-1 text-left ${
                  isCollapsed ? 'justify-center px-2' : ''
                }`}
                title="Ventas"
              >
                <ShoppingCart size={16} className="shrink-0" />
                {!isCollapsed && <span>Ventas</span>}
              </button>
              {!isCollapsed && (
                <button
                  onClick={() => setVentasExpanded(prev => !prev)}
                  className="px-2 py-2.5 text-stone-300 hover:text-white transition"
                  title="Opciones de Ventas"
                >
                  <ChevronDown size={14} className={`transition-transform ${ventasExpanded ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>

            {!isCollapsed && ventasExpanded && (
              <div className="pl-6 pr-1 py-1 flex flex-col gap-0.5 mt-0.5 border-l border-stone-800 ml-4">
                {activeTab === 'ventas' && (
                  <>
                    {[
                      { id: 'cotizaciones', label: 'Cotizaciones' },
                      { id: 'activas', label: 'Órdenes Activas' },
                      { id: 'entregado', label: 'Entregados' },
                      { id: 'sin_pendientes', label: 'Sin Pendientes' },
                      { id: 'cancelado', label: 'Cancelados' },
                      { id: 'expirado', label: 'Expirados' },
                    ].map(link => {
                      const isActive = ventasTab === link.id;
                      return (
                        <button
                          key={link.id}
                          onClick={() => handleStatusClick(link.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-left transition flex items-center justify-between ${
                            isActive
                              ? 'text-amber-400 bg-amber-500/10 font-black'
                              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
                          }`}
                        >
                          <span>{link.label}</span>
                        </button>
                      );
                    })}
                  </>
                )}
                <button
                  onClick={() => handleSelect('tallas')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-left transition flex items-center gap-2 ${
                    activeTab === 'tallas'
                      ? 'text-amber-400 bg-amber-500/10 font-black'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
                  }`}
                >
                  <Ruler size={13} />
                  <span>Tallas</span>
                </button>
                <button
                  onClick={() => handleSelect('precios')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-left transition flex items-center gap-2 ${
                    activeTab === 'precios'
                      ? 'text-amber-400 bg-amber-500/10 font-black'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
                  }`}
                >
                  <Tag size={13} />
                  <span>Tarifario</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. TALLER */}
          <div>
            <div className={`w-full flex items-center justify-between rounded-xl transition-all ${
              isTallerActive
                ? 'bg-amber-600 text-white font-black shadow-md shadow-amber-950/40'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}>
              <button
                onClick={() => handleSelect(isTallerActive ? activeTab : 'operaciones')}
                className={`flex items-center gap-2.5 px-3 py-2.5 text-xs uppercase tracking-wider flex-1 text-left ${
                  isCollapsed ? 'justify-center px-2' : ''
                }`}
                title="Taller"
              >
                <Scissors size={16} className="shrink-0" />
                {!isCollapsed && <span>Taller</span>}
              </button>
              {!isCollapsed && (
                <button
                  onClick={() => setTallerExpanded(prev => !prev)}
                  className="px-2 py-2.5 text-stone-300 hover:text-white transition"
                  title="Opciones de Taller"
                >
                  <ChevronDown size={14} className={`transition-transform ${tallerExpanded ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>

            {!isCollapsed && tallerExpanded && (
              <div className="pl-6 pr-1 py-1 flex flex-col gap-0.5 mt-0.5 border-l border-stone-800 ml-4">
                <button
                  onClick={() => handleSelect('operaciones')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-left transition flex items-center gap-2 ${
                    activeTab === 'operaciones'
                      ? 'text-amber-400 bg-amber-500/10 font-black'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
                  }`}
                >
                  <Package size={13} />
                  <span>Operaciones</span>
                </button>
                <button
                  onClick={() => handleSelect('produccion')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-left transition flex items-center gap-2 ${
                    activeTab === 'produccion'
                      ? 'text-amber-400 bg-amber-500/10 font-black'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
                  }`}
                >
                  <Shirt size={13} />
                  <span>Producción</span>
                </button>
                <button
                  onClick={() => handleSelect('logistica')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-left transition flex items-center gap-2 ${
                    activeTab === 'logistica'
                      ? 'text-amber-400 bg-amber-500/10 font-black'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
                  }`}
                >
                  <Truck size={13} />
                  <span>Logística</span>
                </button>
              </div>
            )}
          </div>

          {/* 3. DIRECTORIO / CLIENTES */}
          {isApproved && userProfile?.role !== 'VENTAS' && (
            <button
              onClick={() => handleSelect('clientes')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs uppercase tracking-wider text-left transition-all ${
                activeTab === 'clientes' || activeTab === 'crm'
                  ? 'bg-amber-600 text-white font-black shadow-md shadow-amber-950/40'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
              title="Directorio de Clientes"
            >
              <UserCircle size={16} className="shrink-0" />
              {!isCollapsed && <span>Directorio</span>}
            </button>
          )}

          {/* 4. REPORTES */}
          {isApproved && userProfile?.role !== 'VENTAS' && (
            <button
              onClick={() => handleSelect('reportes')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs uppercase tracking-wider text-left transition-all ${
                activeTab === 'reportes'
                  ? 'bg-amber-600 text-white font-black shadow-md shadow-amber-950/40'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
              title="Reportes y Análisis"
            >
              <BarChart size={16} className="shrink-0" />
              {!isCollapsed && <span>Reportes</span>}
            </button>
          )}

          {/* 5. HISTORIAL */}
          <button
            onClick={() => handleSelect('historial')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs uppercase tracking-wider text-left transition-all ${
              activeTab === 'historial'
                ? 'bg-amber-600 text-white font-black shadow-md shadow-amber-950/40'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            } ${isCollapsed ? 'justify-center px-2' : ''}`}
            title="Historial de Órdenes"
          >
            <History size={16} className="shrink-0" />
            {!isCollapsed && <span>Historial</span>}
          </button>

          {/* 6. AJUSTES */}
          {isApproved && userProfile?.role !== 'VENTAS' && (
            <div>
              <div className={`w-full flex items-center justify-between rounded-xl transition-all ${
                isAjustesActive
                  ? 'bg-amber-600 text-white font-black shadow-md shadow-amber-950/40'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
              }`}>
                <button
                  onClick={() => {
                    handleSelect('ajustes');
                    if (setSettingsTab && !settingsTab) {
                      setSettingsTab('A');
                    }
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 text-xs uppercase tracking-wider flex-1 text-left ${
                    isCollapsed ? 'justify-center px-2' : ''
                  }`}
                  title="Ajustes del Sistema"
                >
                  <Settings size={16} className="shrink-0" />
                  {!isCollapsed && <span>Ajustes</span>}
                </button>
                {!isCollapsed && (
                  <button
                    onClick={() => setAjustesExpanded(prev => !prev)}
                    className="px-2 py-2.5 text-stone-300 hover:text-white transition"
                    title="Opciones de Ajustes"
                  >
                    <ChevronDown size={14} className={`transition-transform ${ajustesExpanded ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>

              {!isCollapsed && ajustesExpanded && (
                <div className="pl-6 pr-1 py-1 flex flex-col gap-0.5 mt-0.5 border-l border-stone-800 ml-4">
                  {[
                    { id: 'A' as const, label: 'Tarifario Base', hasError: hasTabAErrors },
                    { id: 'B' as const, label: 'Especiales', hasError: hasTabBErrors },
                    { id: 'C' as const, label: 'Servicios', hasError: false },
                    { id: 'D' as const, label: 'Descuentos', hasError: false },
                    { id: 'E' as const, label: 'Catálogo', hasError: false },
                    ...((canManageRoles || isSuperAdmin) ? [{ id: 'seguridad' as const, label: 'Roles & Usuarios', hasError: false }] : [])
                  ].map(subItem => {
                    const isActive = isAjustesActive && settingsTab === subItem.id;
                    return (
                      <button
                        key={subItem.id}
                        onClick={() => handleSettingsSubTab(subItem.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider text-left transition flex items-center justify-between ${
                          isActive
                            ? 'text-amber-400 bg-amber-500/10 font-black'
                            : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
                        }`}
                      >
                        <span>{subItem.label}</span>
                        {subItem.hasError && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </nav>
      </div>

      {/* Bottom Dock: User Profile & Logout */}
      <div className={`pt-3 border-t border-stone-800/80 mt-auto w-full ${isCollapsed ? 'flex flex-col items-center gap-2.5' : 'flex items-center justify-between gap-2'}`}>
        {isCollapsed ? (
          <>
            <div className="relative">
              <div
                className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xs font-black"
                title={`${userProfile?.name || 'Vendedor'} (${userProfile?.role || 'Personal'}) · En Línea`}
              >
                {(userProfile?.name || 'V')[0]?.toUpperCase()}
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-stone-900 animate-pulse" title="En Línea" />
            </div>
            <button
              onClick={() => signOut(auth)}
              className="p-2 text-stone-500 hover:text-red-400 hover:bg-red-950/30 rounded-xl transition-all"
              title="Cerrar Sesión"
            >
              <LogOut size={16} />
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xs font-black shrink-0">
                {(userProfile?.name || 'V')[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-stone-200 truncate">{userProfile?.name || 'Vendedor'}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    En Línea
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 uppercase tracking-wider truncate">{userProfile?.role || 'Personal'}</p>
              </div>
            </div>
            <button
              onClick={() => signOut(auth)}
              className="p-2 text-stone-500 hover:text-red-400 hover:bg-red-950/30 rounded-xl transition-all shrink-0"
              title="Cerrar Sesión"
            >
              <LogOut size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
