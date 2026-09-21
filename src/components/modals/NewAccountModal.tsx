import React from 'react';
import { UserPlus, X, UploadCloud, Plus, Trash2 } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { normalizePricingTier } from '../../utils/constants';

export const NewAccountModal = ({
  onClose,
  newAccount,
  setNewAccount,
  clientAccounts,
  normalizeAccountType,
  ACCOUNT_TYPES,
  pricing,
  db,
  user
}: any) => {
  const setShowNewAccountModal = (val: boolean) => { if(!val) onClose(); };
  return (
    
    <div className="fixed inset-0 bg-stone-950/90 backdrop-blur-md z-[60] p-3 sm:p-4 md:p-6 flex justify-center items-center overflow-hidden">
      <div className="bg-stone-900 w-[95vw] max-w-[1700px] mx-auto rounded-[2.5rem] shadow-2xl overflow-y-auto custom-scrollbar border border-stone-800 p-6 sm:p-8 max-h-[90vh] relative animate-in slide-in-from-bottom">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-stone-200 uppercase tracking-tighter">Nueva Cuenta de Cliente</h3>
                <button onClick={() => setShowNewAccountModal(false)} className="text-stone-500 hover:text-white transition"><X size={24}/></button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Account ID (Auto-generado)</label>
                  <input 
                    type="text" 
                    value={(() => {
                        const prefix = "ACC-";
                        let maxNum = 0;
                        clientAccounts.forEach(acc => {
                          if (acc.accountId && acc.accountId.startsWith(prefix)) {
                            const numStr = acc.accountId.replace(prefix, '');
                            const num = parseInt(numStr, 10);
                            if (!isNaN(num) && num > maxNum) maxNum = num;
                          }
                        });
                        return `${prefix}${(maxNum + 1).toString().padStart(3, '0')}`;
                    })()}
                    disabled
                    className="w-full bg-stone-900 border border-stone-800 p-3 rounded-xl text-xs font-black text-stone-500 opacity-70 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Tipo de Cuenta</label>
                  <select 
                    value={normalizeAccountType(newAccount.accountType)}
                    onChange={(e) => {
                       const val = e.target.value;
                       let update = { ...newAccount, accountType: val };
                       if (normalizeAccountType(val) === 'Particular / Individuo') {
                          const parts = update.accountName.split(' ');
                          update.contactNombre = parts[0] || update.contactNombre;
                          update.contactApellido = parts.slice(1).join(' ') || update.contactApellido;
                          update.accountName = `${update.contactNombre} ${update.contactApellido}`.trim();
                       }
                       setNewAccount(update);
                    }}
                    className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300"
                  >
                    {ACCOUNT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {normalizeAccountType(newAccount.accountType) === 'Particular / Individuo' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Nombre</label>
                      <input 
                        type="text" 
                        value={newAccount.contactNombre}
                        onChange={(e) => {
                           const val = e.target.value;
                           setNewAccount({...newAccount, contactNombre: val, accountName: `${val} ${newAccount.contactApellido}`.trim()});
                        }}
                        className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300"
                        placeholder="Ej. Juan"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Apellido</label>
                      <input 
                        type="text" 
                        value={newAccount.contactApellido}
                        onChange={(e) => {
                           const val = e.target.value;
                           setNewAccount({...newAccount, contactApellido: val, accountName: `${newAccount.contactNombre} ${val}`.trim()});
                        }}
                        className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300"
                        placeholder="Ej. Perez"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Nombre de la Cuenta (Entidad)</label>
                    <input 
                      type="text" 
                      value={newAccount.accountName}
                      onChange={(e) => setNewAccount({...newAccount, accountName: e.target.value})}
                      className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300"
                      placeholder="Ej. Universidad UDI"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Cuenta Padre (Opcional)</label>
                  <select 
                    value={newAccount.parentAccountId}
                    onChange={(e) => {
                       const val = e.target.value;
                       let update = { ...newAccount, parentAccountId: val };
                       if (val) update.pricingTier = 'Heredado';
                       setNewAccount(update);
                    }}
                    className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300"
                  >
                    <option value="">-- Ninguna --</option>
                    {clientAccounts.filter(a => !a.parentAccountId).map(a => (
                      <option key={a.accountId} value={a.accountId}>{a.accountName} ({a.accountId})</option>
                    ))}
                  </select>
                </div>

                {normalizeAccountType(newAccount.accountType) !== 'Particular / Individuo' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Nombre del Contacto</label>
                    <input 
                      type="text" 
                      value={newAccount.contactNombre}
                      onChange={(e) => setNewAccount({...newAccount, contactNombre: e.target.value})}
                      className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Apellido del Contacto</label>
                    <input 
                      type="text" 
                      value={newAccount.contactApellido}
                      onChange={(e) => setNewAccount({...newAccount, contactApellido: e.target.value})}
                      className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300"
                    />
                  </div>
                </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Teléfono</label>
                    <input 
                      type="text" 
                      value={newAccount.phone}
                      onChange={(e) => setNewAccount({...newAccount, phone: e.target.value})}
                      className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Email</label>
                    <input 
                      type="email" 
                      value={newAccount.email}
                      onChange={(e) => setNewAccount({...newAccount, email: e.target.value})}
                      className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300"
                    />
                  </div>
                </div>

                <div className="p-4 bg-stone-950 rounded-xl border border-stone-800 space-y-4">
                  <h4 className="text-xs font-black text-stone-300 uppercase tracking-widest">Dirección de Entrega</h4>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Ciudad</label>
                    <input 
                      type="text" 
                      value={newAccount.deliveryCity}
                      onChange={(e) => setNewAccount({...newAccount, deliveryCity: e.target.value})}
                      className="w-full bg-stone-900 border border-stone-800 p-3 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Dirección</label>
                    <input 
                      type="text" 
                      value={newAccount.deliveryAddress}
                      onChange={(e) => setNewAccount({...newAccount, deliveryAddress: e.target.value})}
                      className="w-full bg-stone-900 border border-stone-800 p-3 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Notas / Referencias</label>
                    <input 
                      type="text" 
                      value={newAccount.deliveryNotes}
                      onChange={(e) => setNewAccount({...newAccount, deliveryNotes: e.target.value})}
                      className="w-full bg-stone-900 border border-stone-800 p-3 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 flex flex-col justify-center">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className={`w-10 h-6 rounded-full transition relative ${newAccount.logoEmbroidery ? 'bg-amber-500' : 'bg-stone-800'}`}>
                        <div className={`absolute top-1 bottom-1 w-4 bg-white rounded-full transition-all ${newAccount.logoEmbroidery ? 'left-5' : 'left-1'}`}></div>
                      </div>
                      <span className="text-xs font-bold text-stone-300 uppercase tracking-widest">Lleva Bordado de Logo</span>
                      <input 
                        type="checkbox" 
                        checked={newAccount.logoEmbroidery}
                        onChange={(e) => setNewAccount({...newAccount, logoEmbroidery: e.target.checked})}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {newAccount.logoEmbroidery && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Ubicación del Archivo de Logo</label>
                      <input 
                        type="text" 
                        value={newAccount.logoFileLocation}
                        onChange={(e) => setNewAccount({...newAccount, logoFileLocation: e.target.value})}
                        placeholder="Ej. F:\Users\...\LOGOS CLIENTES"
                        className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300"
                      />
                    </div>
                  )}
                </div>

                {newAccount.logoEmbroidery && (
                  <div className="space-y-2 p-4 bg-stone-950 rounded-xl border border-stone-800">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Ubicaciones del Logo</label>
                      <button onClick={() => setNewAccount({...newAccount, logoPlacements: [...newAccount.logoPlacements, '']})} className="text-amber-500 hover:text-amber-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                        <Plus size={12} /> Agregar
                      </button>
                    </div>
                    {newAccount.logoPlacements.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 mb-2">
                        <input 
                          type="text" 
                          value={p}
                          onChange={(e) => {
                            const newP = [...newAccount.logoPlacements];
                            newP[i] = e.target.value;
                            setNewAccount({...newAccount, logoPlacements: newP});
                          }}
                          placeholder="Ej. Gorro: centro de la frente"
                          className="flex-1 bg-stone-900 border border-stone-800 p-3 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300"
                        />
                        <button onClick={() => {
                          const newP = newAccount.logoPlacements.filter((_, idx) => idx !== i);
                          setNewAccount({...newAccount, logoPlacements: newP});
                        }} className="p-3 text-stone-500 hover:text-red-400 transition"><Trash2 size={16}/></button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Nivel de Precios (Pricing Tier)</label>
                  <select 
                    value={normalizePricingTier(newAccount.pricingTier)}
                    onChange={(e) => setNewAccount({...newAccount, pricingTier: e.target.value})}
                    disabled={!!newAccount.parentAccountId}
                    className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300 disabled:opacity-50"
                  >
                    <option value="Estándar Raleo">Estándar Raleo (Tarifa Básica / Minorista)</option>
                    <option value="Estándar B2B">Estándar B2B (Tarifa Negociada Empresas)</option>
                    <option value="Contrato Institucional">Contrato Institucional (Especial UDI / Tab B)</option>
                    {(() => {
                      const presets = pricing?.specialPresets || {};
                      const customKeys = Object.keys(presets).filter(k => k !== 'UDI Especial');
                      return customKeys.map(k => (
                        <option key={k} value={k}>
                          Tarifario Especial: {k}
                        </option>
                      ));
                    })()}
                    <option value="Heredado">Heredado (De Cuenta Padre)</option>
                  </select>
                </div>

                <div className="pt-6 border-t border-stone-800 flex justify-end gap-3">
                  <button onClick={() => setShowNewAccountModal(false)} className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-white transition">Cancelar</button>
                  <button onClick={async () => {
                      try {
                        if (!newAccount.accountName.trim()) {
                          alert("Por favor ingrese el nombre de la cuenta.");
                          return;
                        }

                        const prefix = "ACC-";
                        let maxNum = 0;
                        clientAccounts.forEach(acc => {
                          if (acc.accountId && acc.accountId.startsWith(prefix)) {
                            const numStr = acc.accountId.replace(prefix, '');
                            const num = parseInt(numStr, 10);
                            if (!isNaN(num) && num > maxNum) maxNum = num;
                          }
                        });
                        const nextNum = maxNum + 1;
                        const accountId = `${prefix}${nextNum.toString().padStart(3, '0')}`;

                        const accData = {
                          accountId,
                          accountType: newAccount.accountType,
                          accountName: newAccount.accountName,
                          parentAccountId: newAccount.parentAccountId || null,
                          contactNombre: newAccount.contactNombre,
                          contactApellido: newAccount.contactApellido,
                          phone: newAccount.phone,
                          email: newAccount.email,
                          deliveryCity: newAccount.deliveryCity,
                          deliveryAddress: newAccount.deliveryAddress,
                          deliveryNotes: newAccount.deliveryNotes,
                          logoEmbroidery: newAccount.logoEmbroidery,
                          logoPlacements: newAccount.logoPlacements.filter(p => p.trim() !== ''),
                          logoFileLocation: newAccount.logoFileLocation,
                          pricingTier: normalizePricingTier(newAccount.pricingTier),
                          createdAt: Date.now(),
                          createdBy: user?.uid || ''
                        };

                        await setDoc(doc(db, 'clientAccounts', accountId), accData);
                        alert(`Cuenta ${accountId} creada exitosamente.`);
                        setShowNewAccountModal(false);
                      } catch (error) {
                        console.error("Error creating account:", error);
                        alert("Error creando la cuenta.");
                      }
                  }} className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition shadow-lg">Guardar Cuenta</button>
                </div>
              </div>
           </div>
        </div>
      
  );
};
