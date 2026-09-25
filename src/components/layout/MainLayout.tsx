import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { Menu, Eye, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ViewRoleOption } from '../../types';
import { SidebarNav } from './SidebarNav';

interface MainLayoutProps {
  children: ReactNode;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  openNavDropdown?: string | null;
  setOpenNavDropdown?: (dropdown: any) => void;
  navRef?: React.RefObject<HTMLElement>;
  isApproved: boolean;
  ventasTab?: string;
  setVentasTab?: (tab: any) => void;
  settingsTab?: 'A' | 'B' | 'C' | 'D' | 'E' | 'seguridad' | 'mantenimiento';
  setSettingsTab?: (tab: any) => void;
  invalidPriceFields?: Set<string>;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  isApproved,
  ventasTab,
  setVentasTab,
  settingsTab = 'A',
  setSettingsTab,
  invalidPriceFields
}) => {
  const { userProfile, isSuperAdmin, isActualSuperAdmin, activeViewRole, setActiveViewRole } = useAuth();
  const canShowImpersonation = Boolean(isActualSuperAdmin || isSuperAdmin);

  const [isViewRoleMenuOpen, setIsViewRoleMenuOpen] = useState(false);
  const viewRoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (viewRoleRef.current && !viewRoleRef.current.contains(event.target as Node)) {
        setIsViewRoleMenuOpen(false);
      }
    };
    if (isViewRoleMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isViewRoleMenuOpen]);

  // If switched to 'ventas', redirect away from restricted views immediately
  useEffect(() => {
    if (activeViewRole === 'ventas' || userProfile?.role === 'VENTAS') {
      if (['ajustes', 'reportes', 'clientes', 'crm'].includes(activeTab)) {
        setActiveTab('ventas');
      }
    }
  }, [activeViewRole, userProfile?.role, activeTab, setActiveTab]);

  const VIEW_ROLE_OPTIONS: { id: ViewRoleOption; label: string; shortLabel: string; badge: string; description: string }[] = [
    { id: 'admin', label: 'Administrador (Full access)', shortLabel: 'Admin', badge: 'Full access', description: 'Acceso total y SuperAdmin' },
    { id: 'ventas', label: 'Ventas (Matías)', shortLabel: 'Ventas', badge: 'Ventas', description: 'Flujo comercial y clientes' },
    { id: 'operaciones', label: 'Operaciones (León)', shortLabel: 'Operaciones', badge: 'Taller', description: 'Compras, insumos y corte' },
    { id: 'produccion', label: 'Producción (Doris)', shortLabel: 'Producción', badge: 'Taller', description: 'Confección y bordados' }
  ];
  
  // Persistent desktop sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('azafran_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Mobile drawer slide-over state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('azafran_sidebar_collapsed', String(isSidebarCollapsed));
    } catch {
      // Ignore storage errors
    }
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      setIsSidebarCollapsed(prev => !prev);
    } else {
      setIsMobileMenuOpen(prev => !prev);
    }
  };

  const getBreadcrumb = (tab: string) => {
    switch (tab) {
      case 'ventas': return 'Ventas';
      case 'tallas': return 'Ventas · Guía de Tallas';
      case 'precios': return 'Ventas · Tarifario';
      case 'operaciones': return 'Taller · Operaciones';
      case 'produccion': return 'Taller · Producción';
      case 'logistica': return 'Taller · Logística';
      case 'clientes':
      case 'crm': return 'Directorio de Clientes';
      case 'reportes': return 'Reportes y Métricas';
      case 'historial': return 'Historial de Órdenes';
      case 'tarifario': return 'Ajustes · Tarifario Base';
      case 'catalogo': return 'Ajustes · Catálogo';
      case 'mantenimiento': return 'Ajustes · Mantenimiento';
      case 'ajustes':
        if (settingsTab === 'A') return 'Ajustes · Tarifario Base';
        if (settingsTab === 'B') return 'Ajustes · Especiales';
        if (settingsTab === 'C') return 'Ajustes · Servicios';
        if (settingsTab === 'D') return 'Ajustes · Descuentos';
        if (settingsTab === 'E') return 'Ajustes · Catálogo';
        if (settingsTab === 'seguridad') return 'Ajustes · Roles & Usuarios';
        if (settingsTab === 'mantenimiento') return 'Ajustes · Mantenimiento';
        return 'Ajustes del Sistema';
      default: return 'Workspace';
    }
  };

  return (
    <div className="min-h-screen w-full bg-stone-950 text-stone-100 flex overflow-x-hidden border-t-4 border-amber-500">
      {/* 1. Desktop Persistent Left Sidebar */}
      <aside
        className={`hidden lg:flex transition-all duration-300 border-r border-stone-800 bg-stone-900/40 shrink-0 select-none ${
          isSidebarCollapsed
            ? 'w-16 p-2 items-center flex-col justify-between'
            : 'w-60 p-3 flex-col justify-between'
        }`}
      >
        <SidebarNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          isApproved={isApproved}
          onToggleCollapse={toggleSidebar}
          ventasTab={ventasTab}
          setVentasTab={setVentasTab}
          settingsTab={settingsTab}
          setSettingsTab={setSettingsTab}
          invalidPriceFields={invalidPriceFields}
        />
      </aside>

      {/* 2. Mobile Off-Canvas Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm animate-in fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Slide-Over Drawer */}
          <aside className="relative w-72 max-w-[80vw] bg-stone-900 border-r border-stone-800 p-3 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <SidebarNav
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isCollapsed={false}
              onCloseMobile={() => setIsMobileMenuOpen(false)}
              isApproved={isApproved}
              ventasTab={ventasTab}
              setVentasTab={setVentasTab}
              settingsTab={settingsTab}
              setSettingsTab={setSettingsTab}
              invalidPriceFields={invalidPriceFields}
            />
          </aside>
        </div>
      )}

      {/* 3. Main Column: Compact Top Bar + Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header Bar: Visible on Mobile & Desktop (h-10 / 40px) */}
        <header className="h-10 border-b border-stone-800 px-3 flex items-center justify-between shrink-0 bg-stone-950/90 backdrop-blur-md z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition focus:outline-none lg:hidden"
              title="Alternar Menú Lateral"
              aria-label="Alternar Menú Lateral"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2 text-xs truncate">
              <span className="text-stone-500 font-semibold hidden sm:inline">Azafrán</span>
              <span className="text-stone-700 hidden sm:inline">/</span>
              <span className="text-stone-200 font-bold uppercase tracking-wider truncate">
                {getBreadcrumb(activeTab)}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" title="En Línea" />
            </div>
          </div>

          {/* Staging Sandbox Indicator Badge */}
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/60 text-amber-300 text-xs font-bold font-mono tracking-wider uppercase shadow-sm select-none shrink-0 mx-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="hidden sm:inline">🧪 STAGING / PRUEBAS</span>
            <span className="sm:hidden">🧪 STAGING</span>
          </div>

          {/* Discreet Modo Vista (Impersonation Selector) */}
          {canShowImpersonation && (
            <div className="relative shrink-0" ref={viewRoleRef}>
              <button
                type="button"
                onClick={() => setIsViewRoleMenuOpen(prev => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wider transition border cursor-pointer ${
                  activeViewRole !== 'admin'
                    ? 'bg-amber-950/50 border-amber-500/70 text-amber-300 hover:bg-amber-900/50 shadow-sm shadow-amber-950/50'
                    : 'bg-stone-900/90 border-stone-700/60 text-stone-300 hover:text-stone-100 hover:bg-stone-800/90'
                }`}
                title="Modo Vista: Alternar perfil para grabación o pruebas"
                aria-label="Modo Vista"
              >
                <Eye size={13} className={activeViewRole !== 'admin' ? 'text-amber-400 animate-pulse' : 'text-stone-400'} />
                <span>Vista: {VIEW_ROLE_OPTIONS.find(o => o.id === activeViewRole)?.shortLabel || 'Admin'}</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${isViewRoleMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isViewRoleMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-64 rounded-xl bg-stone-900 border border-stone-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1.5 border-b border-stone-800/80 mb-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
                      <Eye size={12} />
                      Modo Vista (Simulación)
                    </p>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      Cambia la vista temporalmente sin alterar Firestore.
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    {VIEW_ROLE_OPTIONS.map((opt) => {
                      const isSelected = activeViewRole === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setActiveViewRole(opt.id);
                            setIsViewRoleMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition cursor-pointer ${
                            isSelected
                              ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40'
                              : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/70 border border-transparent'
                          }`}
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold truncate">{opt.label}</span>
                              {opt.id === 'admin' && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 font-mono">
                                  Full
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-stone-500 truncate">{opt.description}</p>
                          </div>
                          {isSelected && <Check size={14} className="text-amber-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </header>

        {/* 4. Main Content Canvas */}
        <main className="flex-1 w-full h-full lg:h-[calc(100vh-2.5rem)] overflow-y-auto p-2 sm:p-4">
          {children}
        </main>
      </div>
    </div>
  );
};
