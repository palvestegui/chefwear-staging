import React, { useState } from 'react';
import { X, Plus, Trash2, Save, AlertCircle, RefreshCw, Lock } from 'lucide-react';
import { doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { normalizePricingTier, isSystemAccount } from '../../utils/constants';

export const EditAccountModal = ({
  onClose,
  editingAccount,
  setEditingAccount,
  clientAccounts = [],
  normalizeAccountType,
  ACCOUNT_TYPES = [],
  pricing,
  db,
  setContactSuccessMsg
}: any) => {
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClose = () => {
    if (onClose) onClose();
  };

  if (!editingAccount) return null;

  const isProtected = isSystemAccount(editingAccount.accountId);
  const targetDocId = editingAccount.id || editingAccount.accountId;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProtected) {
      alert('La cuenta de sistema ACC-000 está protegida y no puede ser modificada.');
      return;
    }
    if (!targetDocId) {
      alert('Error: ID de cuenta no encontrado.');
      return;
    }
    if (!editingAccount.accountName || !editingAccount.accountName.trim()) {
      alert('Por favor ingrese un nombre de cuenta válido.');
      return;
    }

    try {
      setIsSaving(true);
      const accRef = doc(db, 'clientAccounts', targetDocId);
      const payload: any = {
        accountId: editingAccount.accountId || targetDocId,
        accountType: editingAccount.accountType || 'Particular / Individuo',
        accountName: editingAccount.accountName.trim(),
        parentAccountId: editingAccount.parentAccountId || null,
        contactNombre: editingAccount.contactNombre || '',
        contactApellido: editingAccount.contactApellido || '',
        phone: editingAccount.phone || '',
        email: editingAccount.email || '',
        socials: editingAccount.socials || {},
        deliveryCity: editingAccount.deliveryCity || '',
        deliveryAddress: editingAccount.deliveryAddress || '',
        deliveryNotes: editingAccount.deliveryNotes || '',
        logoEmbroidery: Boolean(editingAccount.logoEmbroidery),
        logoPlacements: (editingAccount.logoPlacements || []).filter((p: string) => typeof p === 'string' && p.trim() !== ''),
        logoFileLocation: editingAccount.logoFileLocation || '',
        pricingTier: normalizePricingTier(editingAccount.pricingTier),
        updatedAt: Date.now()
      };

      await setDoc(accRef, payload, { merge: true });

      if (setContactSuccessMsg) {
        setContactSuccessMsg('Cuenta actualizada exitosamente.');
        setTimeout(() => setContactSuccessMsg(''), 3000);
      }
      handleClose();
    } catch (err: any) {
      console.error('Error saving account:', err);
      alert('Error al guardar la cuenta: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (isProtected) {
      alert('La cuenta de sistema ACC-000 está protegida y no puede ser eliminada.');
      return;
    }
    if (!targetDocId) return;
    try {
      setIsDeleting(true);
      // 1. Delete account document
      await deleteDoc(doc(db, 'clientAccounts', targetDocId));

      // 2. Unlink any child accounts
      const childAccounts = clientAccounts.filter((a: any) => a.parentAccountId === editingAccount.accountId);
      for (const child of childAccounts) {
        const childDocId = child.id || child.accountId;
        if (childDocId) {
          await updateDoc(doc(db, 'clientAccounts', childDocId), { parentAccountId: null });
        }
      }

      if (setContactSuccessMsg) {
        setContactSuccessMsg('Cuenta eliminada exitosamente.');
        setTimeout(() => setContactSuccessMsg(''), 3000);
      }
      handleClose();
    } catch (err: any) {
      console.error('Error deleting account:', err);
      alert('Error al eliminar la cuenta: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 md:p-6">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 w-[95vw] max-w-[1700px] mx-auto max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-stone-200 uppercase tracking-tighter">
              {isProtected ? 'Cuenta de Sistema (Solo Lectura)' : 'Editar Cuenta Cliente'}
            </h3>
            {isProtected && (
              <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                <Lock size={12} /> Protegida
              </span>
            )}
          </div>
          <button type="button" onClick={handleClose} className="text-stone-500 hover:text-white transition p-1"><X size={24} /></button>
        </div>

        {isProtected && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-950/20 border border-amber-600/30 flex items-start gap-3">
            <Lock className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <div className="text-xs text-amber-200/90 leading-relaxed">
              <strong>{editingAccount.accountId} ({editingAccount.accountName || 'Particular'})</strong> es la cuenta global del sistema para todos los pedidos y compras de personas independientes / particulares. No puede ser editada ni eliminada.
            </div>
          </div>
        )}

        {showDeleteConfirm ? (
          <div className="bg-red-950/30 border border-red-900/50 p-6 rounded-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-500 shrink-0" size={28} />
              <div>
                <h4 className="text-sm font-black text-red-200 uppercase">¿Confirmar Eliminación de Cuenta?</h4>
                <p className="text-xs text-red-400 mt-1">
                  Estás a punto de eliminar permanentemente la cuenta <strong className="text-white">{editingAccount.accountName} ({editingAccount.accountId})</strong>. Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 border border-stone-700 text-stone-300 hover:bg-stone-800 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-stone-700 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition shadow-lg flex items-center justify-center gap-2"
              >
                {isDeleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Confirmar y Eliminar
              </button>
            </div>
          </div>
        ) : (
          <form noValidate onSubmit={handleSave}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Left Column: Identifiers, Hierarchy, Contacts & Tier */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Account ID (Bloqueado)</label>
                    <input 
                      type="text" 
                      value={editingAccount.accountId || targetDocId} 
                      disabled 
                      className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl text-xs font-black text-stone-500 opacity-70 cursor-not-allowed" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Nombre de Cuenta</label>
                    <input 
                      type="text" 
                      required 
                      value={editingAccount.accountName || ''} 
                      onChange={e => setEditingAccount({...editingAccount, accountName: e.target.value})} 
                      className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Tipo de Cuenta</label>
                    <select 
                      value={normalizeAccountType ? normalizeAccountType(editingAccount.accountType) : (editingAccount.accountType || '')} 
                      onChange={e => setEditingAccount({...editingAccount, accountType: e.target.value})} 
                      className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300" 
                    >
                      {ACCOUNT_TYPES.map((type: string) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Cuenta Padre</label>
                    <select 
                      value={editingAccount.parentAccountId || ''} 
                      onChange={e => setEditingAccount({...editingAccount, parentAccountId: e.target.value})} 
                      className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300" 
                    >
                      <option value="">NINGUNA (Null)</option>
                      {clientAccounts.filter((a: any) => a.accountId !== editingAccount.accountId).map((a: any) => (
                        <option key={a.accountId} value={a.accountId}>{a.accountName} ({a.accountId})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Nombre Contacto</label>
                      <input 
                        type="text" 
                        value={editingAccount.contactNombre || ''} 
                        onChange={e => setEditingAccount({...editingAccount, contactNombre: e.target.value})} 
                        className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Apellido Contacto</label>
                      <input 
                        type="text" 
                        value={editingAccount.contactApellido || ''} 
                        onChange={e => setEditingAccount({...editingAccount, contactApellido: e.target.value})} 
                        className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Teléfono</label>
                      <input 
                        type="text" 
                        value={editingAccount.phone || ''} 
                        onChange={e => setEditingAccount({...editingAccount, phone: e.target.value})} 
                        className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Email</label>
                      <input 
                        type="text" 
                        value={editingAccount.email || ''} 
                        onChange={e => setEditingAccount({...editingAccount, email: e.target.value})} 
                        className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Nivel de Precios (Pricing Tier)</label>
                    <select 
                      value={normalizePricingTier(editingAccount.pricingTier)} 
                      onChange={e => setEditingAccount({...editingAccount, pricingTier: e.target.value})} 
                      className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300" 
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
                </div>

                {/* Right Column: Delivery, Socials & Embroidery */}
                <div className="space-y-4">
                  <div className="space-y-3 border border-stone-800 p-4 rounded-xl">
                    <h4 className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Dirección de Entrega</h4>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-stone-400">Ciudad</label>
                      <input 
                        type="text" 
                        value={editingAccount.deliveryCity || ''} 
                        onChange={e => setEditingAccount({...editingAccount, deliveryCity: e.target.value})} 
                        className="w-full bg-stone-950 border border-stone-800 p-2.5 rounded-xl text-xs font-bold text-stone-300" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-stone-400">Dirección</label>
                      <input 
                        type="text" 
                        value={editingAccount.deliveryAddress || ''} 
                        onChange={e => setEditingAccount({...editingAccount, deliveryAddress: e.target.value})} 
                        className="w-full bg-stone-950 border border-stone-800 p-2.5 rounded-xl text-xs font-bold text-stone-300" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-stone-400">Notas Adicionales</label>
                      <input 
                        type="text" 
                        value={editingAccount.deliveryNotes || ''} 
                        onChange={e => setEditingAccount({...editingAccount, deliveryNotes: e.target.value})} 
                        className="w-full bg-stone-950 border border-stone-800 p-2.5 rounded-xl text-xs font-bold text-stone-300" 
                      />
                    </div>
                  </div>

                  <div className="space-y-3 border border-stone-800 p-4 rounded-xl bg-stone-950/40">
                    <h4 className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Redes Sociales (Opcional)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400">Instagram</label>
                        <input 
                          type="text" 
                          placeholder="@usuario o URL"
                          value={editingAccount.socials?.instagram || ''} 
                          onChange={e => setEditingAccount({
                            ...editingAccount, 
                            socials: { ...(editingAccount.socials || {}), instagram: e.target.value }
                          })} 
                          className="w-full bg-stone-900 border border-stone-800 p-2 rounded-xl text-xs text-stone-300 focus:border-amber-500 outline-none" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400">Facebook</label>
                        <input 
                          type="text" 
                          placeholder="usuario o URL"
                          value={editingAccount.socials?.facebook || ''} 
                          onChange={e => setEditingAccount({
                            ...editingAccount, 
                            socials: { ...(editingAccount.socials || {}), facebook: e.target.value }
                          })} 
                          className="w-full bg-stone-900 border border-stone-800 p-2 rounded-xl text-xs text-stone-300 focus:border-amber-500 outline-none" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400">TikTok</label>
                        <input 
                          type="text" 
                          placeholder="@usuario o URL"
                          value={editingAccount.socials?.tiktok || ''} 
                          onChange={e => setEditingAccount({
                            ...editingAccount, 
                            socials: { ...(editingAccount.socials || {}), tiktok: e.target.value }
                          })} 
                          className="w-full bg-stone-900 border border-stone-800 p-2 rounded-xl text-xs text-stone-300 focus:border-amber-500 outline-none" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400">Sitio Web</label>
                        <input 
                          type="text" 
                          placeholder="https://ejemplo.com"
                          value={editingAccount.socials?.website || ''} 
                          onChange={e => setEditingAccount({
                            ...editingAccount, 
                            socials: { ...(editingAccount.socials || {}), website: e.target.value }
                          })} 
                          className="w-full bg-stone-900 border border-stone-800 p-2 rounded-xl text-xs text-stone-300 focus:border-amber-500 outline-none" 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 border border-stone-800 p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id="editLogoEmbroidery" 
                        checked={editingAccount.logoEmbroidery || false} 
                        onChange={e => setEditingAccount({...editingAccount, logoEmbroidery: e.target.checked})} 
                        className="w-4 h-4 accent-amber-500" 
                      />
                      <label htmlFor="editLogoEmbroidery" className="text-xs font-bold text-stone-300 uppercase tracking-wider">Logo / Bordado Requerido</label>
                    </div>
                    
                    {editingAccount.logoEmbroidery && (
                      <div className="space-y-3 pt-3 border-t border-stone-800">
                        <div className="space-y-2 p-3 bg-stone-950 rounded-xl border border-stone-800">
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Ubicaciones del Logo</label>
                            <button 
                              type="button" 
                              onClick={() => setEditingAccount({...editingAccount, logoPlacements: [...(editingAccount.logoPlacements || []), '']})} 
                              className="text-amber-500 hover:text-amber-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
                            >
                              <Plus size={12} /> Agregar
                            </button>
                          </div>
                          {(editingAccount.logoPlacements || []).map((p: string, i: number) => (
                            <div key={i} className="flex items-center gap-2 mb-2">
                              <input 
                                type="text" 
                                value={p}
                                onChange={(e) => {
                                  const newP = [...editingAccount.logoPlacements];
                                  newP[i] = e.target.value;
                                  setEditingAccount({...editingAccount, logoPlacements: newP});
                                }}
                                placeholder="Ej. Gorro: centro de la frente"
                                className="flex-1 bg-stone-900 border border-stone-800 p-2.5 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300"
                              />
                              <button 
                                type="button" 
                                onClick={() => {
                                  const newP = editingAccount.logoPlacements.filter((_: any, idx: number) => idx !== i);
                                  setEditingAccount({...editingAccount, logoPlacements: newP});
                                }} 
                                className="p-2.5 text-stone-500 hover:text-red-400 transition"
                              >
                                <Trash2 size={16}/>
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Ubicación del Archivo de Logo</label>
                          <input 
                            type="text" 
                            value={editingAccount.logoFileLocation || ''} 
                            onChange={e => setEditingAccount({...editingAccount, logoFileLocation: e.target.value})} 
                            className="w-full bg-stone-950 border border-stone-800 p-2.5 rounded-xl text-xs font-mono text-stone-400" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-4 border-t border-stone-800">
                {!isProtected && (
                  <button 
                    type="button" 
                    onClick={() => setShowDeleteConfirm(true)} 
                    className="border border-red-900/50 hover:bg-red-950/30 text-red-400 py-3 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition flex items-center gap-2"
                  >
                    <Trash2 size={14} /> Eliminar Cuenta
                  </button>
                )}

                <div className={`flex gap-3 ${isProtected ? 'w-full justify-end' : 'flex-1 justify-end'}`}>
                  <button 
                    type="button" 
                    onClick={handleClose} 
                    className="border border-stone-700 text-stone-300 hover:bg-stone-800 py-3 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest transition"
                  >
                    {isProtected ? 'Cerrar' : 'Cancelar'}
                  </button>
                  {!isProtected && (
                    <button 
                      type="submit" 
                      disabled={isSaving}
                      className="bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 text-white py-3 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition shadow-lg flex items-center justify-center gap-2"
                    >
                      {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14}/>} 
                      Guardar Cambios
                    </button>
                  )}
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
