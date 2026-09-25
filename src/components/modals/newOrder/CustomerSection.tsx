import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  getRolesForAccountType, 
  ACCOUNT_TYPES, 
  normalizeAccountType 
} from '../../../utils/constants';
import { 
  resolveContactDetails, 
  cleanStr, 
  cleanPhone 
} from '../../../utils/contactResolution';
import { DEFAULT_FALLBACK_ACCOUNT } from '../../../utils/pricingDefaults';
import { ChevronDown, Users, Sparkles } from 'lucide-react';

export { resolveContactDetails };

export interface CustomerSectionProps {
  newOrder: any;
  setNewOrder: React.Dispatch<React.SetStateAction<any>>;
  showContactDropdown: boolean;
  setShowContactDropdown: (val: boolean) => void;
  directoryContacts: any[];
  clientAccounts: any[];
  accountContacts: any[];
  orders?: any[];
  usersList?: any[];
  onOpenRosterModal?: () => void;
  isSuperAdmin?: boolean;
}

export const CustomerSection: React.FC<CustomerSectionProps> = ({
  newOrder,
  setNewOrder,
  showContactDropdown,
  setShowContactDropdown,
  directoryContacts,
  clientAccounts,
  accountContacts,
  orders = [],
  usersList = [],
  onOpenRosterModal,
  isSuperAdmin
}) => {
  const { isSuperAdmin: authIsSuperAdmin } = useAuth();
  const isSuperAdminEffective = isSuperAdmin !== undefined ? isSuperAdmin : Boolean(authIsSuperAdmin);
  const effectiveAccounts = (clientAccounts && clientAccounts.length > 0)
    ? clientAccounts
    : [DEFAULT_FALLBACK_ACCOUNT];
  const isCorporateAccount = newOrder.clientType !== 'Particular / Individuo' || (newOrder.accountId && newOrder.accountId !== 'ACC-000');
  const rosterCount = (newOrder.institutionalRoster || []).length;
  const isInstitutional = Boolean(newOrder.isInstitutional);
  return (
    <div>
      {/* VENDEDOR ASIGNADO (SUPERADMIN ONLY) - LOW-PROFILE INLINE ROW */}
      {isSuperAdminEffective && (
        <div className="mb-2 sm:mb-2.5 flex flex-wrap items-center justify-between gap-1.5 text-xs text-stone-400 font-medium bg-stone-950/60 border border-stone-800/80 px-2.5 py-1 rounded-xl">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest">Vendedor Asignado:</span>
            <span className="font-bold text-stone-200">{newOrder.sellerName || 'Pablo Alvestegui'}</span>
          </div>

          {usersList && usersList.length > 0 && (
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">Asignar a:</span>
              <select
                value={newOrder.sellerName || ''}
                onChange={e => {
                  const selName = e.target.value;
                  const uObj = usersList.find(u => (u.name || u.displayName) === selName);
                  setNewOrder(prev => ({
                    ...prev,
                    sellerName: selName,
                    sellerEmail: uObj?.email || prev.sellerEmail || '',
                    sellerUid: uObj?.uid || uObj?.id || prev.sellerUid || ''
                  }));
                }}
                className="bg-stone-900 border border-stone-700/80 text-stone-200 text-xs font-bold rounded px-2 py-0.5 outline-none focus:border-amber-500 transition cursor-pointer"
              >
                <option value={newOrder.sellerName || 'Pablo Alvestegui'}>{newOrder.sellerName || 'Pablo Alvestegui'} (Actual)</option>
                {usersList
                  .filter(u => {
                    const uName = u.name || u.displayName;
                    return uName && uName !== (newOrder.sellerName || 'Pablo Alvestegui');
                  })
                  .map(u => {
                    const uName = u.name || u.displayName;
                    return (
                      <option key={u.uid || u.id || uName} value={uName}>
                        {uName} {u.role ? `(${u.role})` : ''}
                      </option>
                    );
                  })}
              </select>
            </div>
          )}
        </div>
      )}

      <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1.5 block">Datos del Cliente</label>
      <div className="space-y-2.5 sm:space-y-4 mb-3">
        {/* FIELD 1: NOMBRE DEL CLIENTE */}
        <div className="relative">
          <label className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1 flex justify-between items-center">
            <span>Nombre del Cliente (Persona FÍSICA) <span className="text-red-500">*</span></span>
            {newOrder.contactId && <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[8px]">✓ Vinculado a {newOrder.contactId}</span>}
          </label>
          <input 
            required
            value={newOrder.customer || ""} 
            onFocus={() => setShowContactDropdown(true)}
            onChange={e => {
              const val = e.target.value;
              setShowContactDropdown(true);
              setNewOrder(prev => ({ ...prev, customer: val, customerFirstName: val, contactId: "" }));
            }} 
            onBlur={() => {
              setTimeout(() => {
                setShowContactDropdown(false);
                // Check if user typed full name matching a known contact
                if (!newOrder.contactId && (newOrder.customer || "").trim().length > 1) {
                  const query = cleanStr(newOrder.customer || "");
                  const exactMatch = directoryContacts.find(c => cleanStr(c.fullName || `${c.contactNombre || ''} ${c.contactApellido || ''}`) === query);
                  if (exactMatch) {
                    const resolved = resolveContactDetails(exactMatch, accountContacts, effectiveAccounts, orders);
                    setNewOrder(prev => ({ ...prev, ...resolved }));
                  }
                }
              }, 250);
            }} 
            className="w-full bg-stone-950 border border-stone-800 p-3 sm:p-3.5 rounded-xl focus:border-amber-500 outline-none font-bold text-sm text-stone-200 placeholder:text-stone-600" 
            placeholder="Escriba para buscar o crear un nuevo cliente..."
          />
          {/* Dropdown de Contactos */}
          {showContactDropdown && (newOrder.customer || "").trim().length > 0 && (() => {
              const query = cleanStr(newOrder.customer || "");
              const matches = directoryContacts.filter(c => {
                const full = cleanStr(c.fullName || `${c.contactNombre || ''} ${c.contactApellido || ''}`);
                const phone = cleanPhone(c.phone || "");
                const cid = cleanStr(c.contactId || "");
                return full.includes(query) || phone.includes(query) || cid.includes(query);
              });
              if (matches.length === 0) return null;
              return (
                <div className="absolute left-0 right-0 top-full mt-1 bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto p-2">
                  <div className="text-[8px] font-black uppercase tracking-widest text-amber-500 px-2 py-1 mb-1">Contactos Encontrados ({matches.length})</div>
                  {matches.map(c => {
                    const resolved = resolveContactDetails(c, accountContacts, effectiveAccounts, orders);
                    return (
                      <div
                        key={c.contactId || c.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setNewOrder(prev => ({
                            ...prev,
                            ...resolved
                          }));
                          setShowContactDropdown(false);
                        }}
                        className="p-2.5 hover:bg-stone-800 rounded-xl cursor-pointer"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-stone-200">{c.fullName || `${c.contactNombre || ''} ${c.contactApellido || ''}`}</span>
                          <span className="text-[9px] font-mono text-amber-500">{c.contactId}</span>
                        </div>
                        {resolved.companyName && resolved.companyName !== 'Cliente Particular' && (
                          <div className="text-[10px] text-stone-400 font-medium flex items-center gap-1.5 mt-0.5">
                            <span className="text-amber-400 font-bold">{resolved.companyName}</span>
                            <span>•</span>
                            <span className="text-stone-300">{resolved.contactRole}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
          })()}
        </div>

        {/* CLASIFICACIÓN DIRECTA: TIPO DE CLIENTE / CUENTA / ROL */}
        <div className="bg-stone-900 border border-stone-800 p-3 sm:p-4 rounded-2xl space-y-2.5 sm:space-y-3 animate-in fade-in">
          {/* 2-COLUMN COMPACT GRID: TIPO DE CLIENTE + CARGO ESPECÍFICO */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[8px] font-black text-amber-500 uppercase tracking-widest block mb-1">Tipo de Cliente (Categoría)</label>
              <select 
                value={newOrder.clientType || 'Particular / Individuo'} 
                onChange={e => {
                  const ct = e.target.value;
                  const allowedRoles = getRolesForAccountType(ct);
                  const isParticular = ct === 'Particular / Individuo';
                  
                  setNewOrder((prev: any) => {
                    const nextRole = allowedRoles.includes(prev.contactRole) ? prev.contactRole : (allowedRoles[0] || 'OTRO');

                    if (isParticular) {
                      return {
                        ...prev,
                        clientType: ct,
                        contactRole: nextRole,
                        accountId: 'ACC-000',
                        companyName: 'Cliente Particular',
                        pricingTier: 'Estándar Raleo'
                      };
                    }

                    // For non-Particular:
                    // If user has explicitly chosen an account or 'create_new', preserve their explicit choice.
                    // If account was default Particular ('ACC-000') or unassigned, default to 'create_new' without picking an arbitrary account.
                    const hasExplicitAccount = prev.accountId && prev.accountId !== 'ACC-000';
                    const nextAccountId = hasExplicitAccount ? prev.accountId : 'create_new';
                    const nextCompanyName = hasExplicitAccount
                      ? (prev.companyName === 'Cliente Particular' ? '' : (prev.companyName || ''))
                      : (prev.companyName && prev.companyName !== 'Cliente Particular' ? prev.companyName : '');
                    const nextPricing = hasExplicitAccount ? (prev.pricingTier || 'Estándar Raleo') : 'Estándar Raleo';

                    return {
                      ...prev,
                      clientType: ct,
                      contactRole: nextRole,
                      accountId: nextAccountId,
                      companyName: nextCompanyName,
                      pricingTier: nextPricing
                    };
                  });
                }}
                className="w-full bg-stone-950 border border-stone-800 p-2 sm:p-2.5 rounded-lg text-xs font-bold text-stone-300 outline-none focus:border-amber-500"
              >
                {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[8px] font-black text-amber-500 uppercase tracking-widest block mb-1">Cargo Específico</label>
              <select 
                value={newOrder.contactRole || ''}
                onChange={e => setNewOrder(prev => ({ ...prev, contactRole: e.target.value }))}
                className="w-full bg-stone-950 border border-stone-800 p-2 sm:p-2.5 rounded-lg text-xs font-bold text-stone-300 outline-none focus:border-amber-500"
              >
                {getRolesForAccountType(newOrder.clientType).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          
          {newOrder.clientType !== 'Particular / Individuo' && (
            <div className="space-y-2.5">
              <div>
                <label className="text-[8px] font-black text-amber-500 uppercase tracking-widest block mb-1">Entidad / Empresa (Cuenta Padre)</label>
                {(() => {
                  const filtered = effectiveAccounts.filter(a => normalizeAccountType(a.accountType || a.category) === normalizeAccountType(newOrder.clientType));
                  // Preserve explicitly selected account if not currently in category filter
                  const currentAccount = effectiveAccounts.find(a => (a.accountId || a.id) === newOrder.accountId);
                  const options = currentAccount && !filtered.some(a => (a.accountId || a.id) === (currentAccount.accountId || currentAccount.id))
                    ? [currentAccount, ...filtered]
                    : filtered;
                  const isExistingAccount = options.some(a => (a.accountId || a.id) === newOrder.accountId);
                  const selectValue = isExistingAccount ? newOrder.accountId : 'create_new';

                  return (
                    <select 
                      value={selectValue} 
                      onChange={e => {
                        const val = e.target.value;
                        if (val === "create_new") {
                          setNewOrder(prev => ({ ...prev, accountId: 'create_new', companyName: '', pricingTier: 'Estándar Raleo' }));
                        } else {
                          const matched = effectiveAccounts.find(a => (a.accountId || a.id) === val);
                          if (matched) {
                            setNewOrder(prev => ({ 
                              ...prev, 
                              accountId: matched.accountId || matched.id, 
                              companyName: matched.accountName || matched.name, 
                              pricingTier: matched.pricingTier || 'Estándar Raleo' 
                            }));
                          }
                        }
                      }}
                      className="w-full bg-stone-950 border border-stone-800 p-2 sm:p-2.5 rounded-lg text-xs font-bold text-stone-300 outline-none focus:border-amber-500"
                    >
                      {options.length === 0 ? (
                        <option value="create_new">+ Crear nueva empresa</option>
                      ) : (
                        <>
                          <option value="create_new">+ Crear nueva empresa</option>
                          {options.map(a => {
                            const accId = a.accountId || a.id;
                            const accName = a.accountName || a.name;
                            return (
                              <option key={accId} value={accId}>
                                {accId} — {accName}
                              </option>
                            );
                          })}
                        </>
                      )}
                    </select>
                  );
                })()}
              </div>

              {(() => {
                const isCreatingNew = newOrder.accountId === 'create_new' || !newOrder.accountId || newOrder.accountId === 'ACC-000';
                if (isCreatingNew) {
                  return (
                    <div className="animate-in fade-in slide-in-from-top-1">
                      <label className="text-[8px] font-black text-stone-500 uppercase tracking-widest block mb-1">
                        Nombre de la Nueva Empresa <span className="text-red-500">*</span>
                      </label>
                      <input 
                        value={newOrder.companyName || ""} 
                        onChange={e => {
                          const val = e.target.value;
                          setNewOrder(prev => ({ ...prev, companyName: val, accountId: 'create_new' }));
                        }}
                        className="w-full bg-stone-950 border border-stone-800 p-2 sm:p-2.5 rounded-lg text-xs font-bold text-stone-300 outline-none focus:border-amber-500"
                        placeholder="Escriba el nombre de la nueva empresa..."
                        required
                      />
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {/* MODO PEDIDO INSTITUCIONAL / MULTI-EMPLEADO: STREAMLINED SINGLE-LINE ROW */}
          <div className="pt-2 border-t border-stone-800/80">
            <div className="flex items-center justify-between py-2 px-3 bg-stone-900/50 rounded-xl border border-stone-800/80">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg border ${isInstitutional ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-stone-900 text-stone-500 border-stone-800'}`}>
                  <Users size={14} />
                </div>
                <span className="text-[10px] font-black text-stone-200 uppercase tracking-wider">
                  Pedido Institucional / Múltiples Empleados
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextState = !isInstitutional;
                  setNewOrder((prev: any) => ({
                    ...prev,
                    isInstitutional: nextState,
                    institutionalRoster: prev.institutionalRoster || []
                  }));
                }}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                  isInstitutional ? 'bg-amber-600' : 'bg-stone-800'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    isInstitutional ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {isInstitutional && (
              <div className="mt-2 py-1.5 px-3 bg-stone-900/30 rounded-xl border border-stone-800/60 flex items-center justify-between gap-2 animate-in fade-in">
                <div className="text-[10px] text-amber-400 font-bold flex items-center gap-1.5">
                  <Sparkles size={12} />
                  <span>
                    {rosterCount > 0
                      ? `${rosterCount} empleados en nómina`
                      : 'Nómina vacía: Asigna empleados y tallas'}
                  </span>
                </div>
                {onOpenRosterModal && (
                  <button
                    type="button"
                    onClick={onOpenRosterModal}
                    className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1 cursor-pointer"
                  >
                    <Users size={12} />
                    {rosterCount > 0 ? `Editar (${rosterCount})` : 'Abrir Nómina'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <details className="group border border-stone-800 rounded-xl bg-stone-950 overflow-hidden mt-3">
        <summary className="cursor-pointer p-4 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-200 transition outline-none list-none flex justify-between items-center">
          Información de Contacto (Opcional)
          <span className="group-open:rotate-180 transition-transform"><ChevronDown size={14}/></span>
        </summary>
        <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-stone-800/50 mt-2 bg-stone-900/50">
          <input value={newOrder.phone || ''} onChange={e => setNewOrder({...newOrder, phone: e.target.value})} className="w-full bg-stone-900 border border-stone-800 p-3 rounded focus:border-amber-500 outline-none font-bold text-xs text-stone-300" placeholder="Teléfono" />
          <input value={newOrder.email || ''} onChange={e => setNewOrder({...newOrder, email: e.target.value})} className="w-full bg-stone-900 border border-stone-800 p-3 rounded focus:border-amber-500 outline-none font-bold text-xs text-stone-300" placeholder="Email" />
          <div className="w-full">
            <input 
              list="cities-list"
              value={newOrder.city || ''} 
              onChange={e => setNewOrder({...newOrder, city: e.target.value})} 
              className="w-full bg-stone-900 border border-stone-800 p-3 rounded focus:border-amber-500 outline-none font-bold text-xs text-stone-300" 
              placeholder="Ciudad" 
            />
            <datalist id="cities-list">
              <option value="Santa Cruz" />
              <option value="La Paz" />
              <option value="Cochabamba" />
              <option value="El Alto" />
              <option value="Tarija" />
              <option value="Sucre" />
              <option value="Oruro" />
              <option value="Potosí" />
              <option value="Trinidad" />
              <option value="Cobija" />
            </datalist>
          </div>
          <input value={newOrder.address || ''} onChange={e => setNewOrder({...newOrder, address: e.target.value})} className="w-full bg-stone-900 border border-stone-800 p-3 rounded focus:border-amber-500 outline-none font-bold text-xs text-stone-300" placeholder="Dirección de Envío" />
        </div>
      </details>
    </div>
  );
};
