import React, { useState } from 'react';
import { X, Trash2, Save, AlertCircle, RefreshCw, Lock, HelpCircle } from 'lucide-react';
import { doc, setDoc, deleteDoc, updateDoc, Firestore } from 'firebase/firestore';
import { normalizePricingTier, isSystemAccount } from '../../utils/constants';
import { ClientAccount } from '../../types/crm';
import { AccountBrandingSection } from '../crm/AccountBrandingSection';

export interface EditAccountModalProps {
  onClose: () => void;
  editingAccount: ClientAccount | null;
  setEditingAccount: React.Dispatch<React.SetStateAction<ClientAccount | null>>;
  clientAccounts?: ClientAccount[];
  normalizeAccountType?: (val?: string) => string;
  ACCOUNT_TYPES?: string[];
  pricing?: {
    specialPresets?: Record<string, unknown>;
  };
  db?: Firestore;
  setContactSuccessMsg?: (msg: string) => void;
}

export const EditAccountModal: React.FC<EditAccountModalProps> = ({
  onClose,
  editingAccount,
  setEditingAccount,
  clientAccounts = [],
  normalizeAccountType,
  ACCOUNT_TYPES = [],
  pricing,
  db,
  setContactSuccessMsg
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = () => {
    if (onClose) onClose();
  };

  if (!editingAccount) return null;

  const isProtected = isSystemAccount(editingAccount.accountId);
  const targetDocId = editingAccount.id || editingAccount.accountId;

  const handlePromptSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!targetDocId) {
      setErrorMessage('Error: ID de cuenta no encontrado.');
      return;
    }
    if (!editingAccount.accountName || !editingAccount.accountName.trim()) {
      setErrorMessage('Por favor ingrese un nombre de cuenta válido.');
      return;
    }

    setShowConfirmSave(true);
  };

  const confirmAndSaveAccount = async () => {
    if (!db || !targetDocId) return;

    try {
      setIsSaving(true);
      setErrorMessage(null);
      const accRef = doc(db, 'clientAccounts', targetDocId);

      const logoUrls = editingAccount.logoUrls || (editingAccount.logoUrl ? [editingAccount.logoUrl] : []);
      const primaryLogo = logoUrls[0] || editingAccount.logoFileLocation || '';

      const payload: Partial<ClientAccount> = {
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
        logoPlacements: (editingAccount.logoPlacements || []).filter((p): p is string => Boolean(p && p.trim())),
        logoUrls: logoUrls,
        logoUrl: primaryLogo,
        logoFileLocation: primaryLogo,
        pricingTier: normalizePricingTier(editingAccount.pricingTier)
      };

      await setDoc(accRef, payload, { merge: true });

      if (setContactSuccessMsg) {
        setContactSuccessMsg(`Cuenta ${editingAccount.accountName} actualizada exitosamente.`);
        setTimeout(() => setContactSuccessMsg(''), 3500);
      }
      setShowConfirmSave(false);
      handleClose();
    } catch (err) {
      console.error('[EditAccountModal] Error al guardar cuenta:', err);
      setErrorMessage('Error al guardar la cuenta en la base de datos.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (isProtected) {
      setErrorMessage('La cuenta de sistema está protegida y no puede ser eliminada.');
      return;
    }
    if (!db || !targetDocId) return;

    try {
      setIsDeleting(true);
      await deleteDoc(doc(db, 'clientAccounts', targetDocId));

      const childAccounts = clientAccounts.filter((a) => a.parentAccountId === editingAccount.accountId);
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
      setShowDeleteConfirm(false);
      handleClose();
    } catch (err) {
      console.error('[EditAccountModal] Error al eliminar cuenta:', err);
      setErrorMessage('Error al eliminar la cuenta de la base de datos.');
    } finally {
      setIsDeleting(false);
    }
  };

  const logoUrls = editingAccount.logoUrls || (editingAccount.logoUrl ? [editingAccount.logoUrl] : []);

  return (
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 md:p-6 animate-in fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 w-[95vw] max-w-5xl mx-auto max-h-[90vh] overflow-y-auto shadow-2xl relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-black text-stone-200 uppercase tracking-tighter">
              Editar Cuenta Cliente
            </h3>
            <span className="text-xs font-mono font-black text-amber-400 uppercase bg-stone-950 px-2 py-0.5 rounded-md border border-stone-800">
              {editingAccount.accountId || targetDocId}
            </span>
            {isProtected && (
              <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                <Lock size={11} /> Sistema Protegido (Sin Eliminación)
              </span>
            )}
          </div>
          <button type="button" onClick={handleClose} className="text-stone-500 hover:text-white transition p-1 cursor-pointer">
            <X size={22} />
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/60 flex items-center gap-2 text-xs text-red-300 font-bold">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Delete Confirmation Alert */}
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
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 border border-stone-700 text-stone-300 hover:bg-stone-800 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-md flex items-center gap-2"
              >
                {isDeleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Confirmar Eliminación
              </button>
            </div>
          </div>
        ) : (
          <form noValidate onSubmit={handlePromptSave}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Identifiers, Hierarchy, Contacts & Tier */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Nombre de Cuenta</label>
                    <input 
                      type="text" 
                      required 
                      value={editingAccount.accountName || ''} 
                      onChange={e => setEditingAccount({...editingAccount, accountName: e.target.value})} 
                      className="w-full bg-stone-950 border border-stone-800 p-2.5 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300" 
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Tipo de Cuenta</label>
                    <select 
                      value={normalizeAccountType ? normalizeAccountType(editingAccount.accountType) : (editingAccount.accountType || '')} 
                      onChange={e => setEditingAccount({...editingAccount, accountType: e.target.value})} 
                      className="w-full bg-stone-950 border border-stone-800 p-2.5 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300 cursor-pointer" 
                    >
                      {ACCOUNT_TYPES.map((type: string) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Cuenta Padre</label>
                    <select 
                      value={editingAccount.parentAccountId || ''} 
                      onChange={e => setEditingAccount({...editingAccount, parentAccountId: e.target.value || null})} 
                      className="w-full bg-stone-950 border border-stone-800 p-2.5 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300 cursor-pointer" 
                    >
                      <option value="">NINGUNA (Null)</option>
                      {clientAccounts.filter((a) => a.accountId !== editingAccount.accountId).map((a) => (
                        <option key={a.accountId} value={a.accountId}>{a.accountName} ({a.accountId})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Nivel de Precios</label>
                    <select 
                      value={normalizePricingTier(editingAccount.pricingTier)} 
                      onChange={e => setEditingAccount({...editingAccount, pricingTier: e.target.value})} 
                      className="w-full bg-stone-950 border border-stone-800 p-2.5 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300 cursor-pointer" 
                    >
                      <option value="Estándar Raleo">Estándar Raleo (Minorista)</option>
                      <option value="Estándar B2B">Estándar B2B (Empresas)</option>
                      <option value="Contrato Institucional">Contrato Institucional</option>
                      {(() => {
                        const presets = pricing?.specialPresets || {};
                        return Object.keys(presets).map((k) => (
                          <option key={k} value={k}>Tarifario: {k}</option>
                        ));
                      })()}
                      <option value="Heredado">Heredado</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Nombre Contacto</label>
                    <input 
                      type="text" 
                      value={editingAccount.contactNombre || ''} 
                      onChange={e => setEditingAccount({...editingAccount, contactNombre: e.target.value})} 
                      className="w-full bg-stone-950 border border-stone-800 p-2.5 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Apellido Contacto</label>
                    <input 
                      type="text" 
                      value={editingAccount.contactApellido || ''} 
                      onChange={e => setEditingAccount({...editingAccount, contactApellido: e.target.value})} 
                      className="w-full bg-stone-950 border border-stone-800 p-2.5 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Teléfono / WhatsApp</label>
                    <input 
                      type="text" 
                      value={editingAccount.phone || ''} 
                      onChange={e => setEditingAccount({...editingAccount, phone: e.target.value})} 
                      className="w-full bg-stone-950 border border-stone-800 p-2.5 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Email</label>
                    <input 
                      type="text" 
                      value={editingAccount.email || ''} 
                      onChange={e => setEditingAccount({...editingAccount, email: e.target.value})} 
                      className="w-full bg-stone-950 border border-stone-800 p-2.5 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300" 
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Logistics & Branding */}
              <div className="space-y-4">
                <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Logística de Despacho</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Ciudad</label>
                      <input 
                        type="text" 
                        value={editingAccount.deliveryCity || ''} 
                        onChange={e => setEditingAccount({...editingAccount, deliveryCity: e.target.value})} 
                        className="w-full bg-stone-900 border border-stone-800 p-2 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Dirección de Entrega</label>
                      <input 
                        type="text" 
                        value={editingAccount.deliveryAddress || ''} 
                        onChange={e => setEditingAccount({...editingAccount, deliveryAddress: e.target.value})} 
                        className="w-full bg-stone-900 border border-stone-800 p-2 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Notas de Despacho</label>
                    <textarea 
                      rows={2}
                      value={editingAccount.deliveryNotes || ''} 
                      onChange={e => setEditingAccount({...editingAccount, deliveryNotes: e.target.value})} 
                      className="w-full bg-stone-900 border border-stone-800 p-2 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300 resize-none" 
                    />
                  </div>
                </div>

                {/* Branding Component */}
                <AccountBrandingSection
                  logoEmbroidery={Boolean(editingAccount.logoEmbroidery)}
                  onToggleEmbroidery={(active) => setEditingAccount({...editingAccount, logoEmbroidery: active})}
                  logoUrls={logoUrls}
                  onChangeLogoUrls={(urls) => setEditingAccount({...editingAccount, logoUrls: urls, logoUrl: urls[0] || ''})}
                  logoPlacements={editingAccount.logoPlacements || []}
                  onChangeLogoPlacements={(placements) => setEditingAccount({...editingAccount, logoPlacements: placements})}
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between gap-4 pt-6 mt-6 border-t border-stone-800">
              {!isProtected ? (
                <button 
                  type="button" 
                  onClick={() => setShowDeleteConfirm(true)} 
                  className="border border-red-900/50 hover:bg-red-950/30 text-red-400 py-2.5 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={13} /> Eliminar Cuenta
                </button>
              ) : (
                <div />
              )}

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={handleClose} 
                  className="border border-stone-700 text-stone-300 hover:bg-stone-800 py-2.5 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 text-white py-2.5 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save size={14}/> Guardar Cambios
                </button>
              </div>
            </div>
          </form>
        )}

        {/* 2-Step In-App Confirmation Barrier Modal */}
        {showConfirmSave && (
          <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in">
              <div className="flex items-center gap-3 text-amber-400">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <HelpCircle size={20} />
                </div>
                <h3 className="text-lg font-black text-stone-100 uppercase tracking-tight">
                  ¿Confirmar cambios en la cuenta?
                </h3>
              </div>
              <p className="text-stone-300 text-xs leading-relaxed">
                Se actualizarán los datos, logística y logos de{' '}
                <strong className="text-white">{editingAccount.accountName}</strong> (ID: {editingAccount.accountId || targetDocId}). ¿Desea continuar?
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmSave(false)}
                  disabled={isSaving}
                  className="px-4 py-2 border border-stone-700 text-stone-300 hover:bg-stone-800 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmAndSaveAccount}
                  disabled={isSaving}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  {isSaving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                  Sí, Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
