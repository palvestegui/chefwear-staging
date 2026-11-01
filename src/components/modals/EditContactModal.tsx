import React, { useState } from 'react';
import { X, Save, HelpCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { doc, updateDoc, setDoc, getDoc, collection, query, where, getDocs, Firestore } from 'firebase/firestore';
import { normalizeName } from '../../utils/contactUtils';
import { isUpperTailored, isLowerTailored, isBundleGarment } from '../../utils/garmentMeasurementUtils';
import { ClientAccount, MasterContact } from '../../types/crm';
import { Tailoring12PointsGrid } from '../crm/Tailoring12PointsGrid';
import {
  getRolesForAccountType as defaultGetRoles,
  normalizeAccountType as defaultNormalizeAccountType,
  normalizeRole as defaultNormalizeRole
} from '../../utils/constants';

export interface EditContactModalProps {
  onClose: () => void;
  editingMasterContact: MasterContact | null;
  setEditingMasterContact: React.Dispatch<React.SetStateAction<MasterContact | null>>;
  clientAccounts?: ClientAccount[];
  requiredFields?: Record<string, string[]>;
  fieldLabels?: Record<string, string>;
  db?: Firestore;
  setContactSuccessMsg?: (msg: string) => void;
  CONTACT_ROLES?: string[];
  getRolesForAccountType?: (type?: string) => string[];
  normalizeAccountType?: (type?: string) => string;
  normalizeRole?: (role?: string, type?: string) => string;
  accountContacts?: Array<{ contactId: string; isPrimary?: boolean; linkId?: string; id?: string }>;
}

export const EditContactModal: React.FC<EditContactModalProps> = ({
  onClose,
  editingMasterContact,
  setEditingMasterContact,
  clientAccounts = [],
  db,
  setContactSuccessMsg,
  getRolesForAccountType = defaultGetRoles,
  normalizeAccountType = defaultNormalizeAccountType,
  normalizeRole = defaultNormalizeRole,
  accountContacts = []
}) => {
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isPantalonWaistOverridden, setIsPantalonWaistOverridden] = useState<boolean>(() => {
    const matrix = (editingMasterContact?.sizingMatrix ||
      editingMasterContact?.sizingMatrix12PtCM ||
      editingMasterContact?.measurements ||
      {}) as Record<string, string | number>;
    const fVal = matrix.F_Cintura ?? matrix.cintura ?? '';
    const pVal = matrix.P_Cintura ?? '';
    return Boolean(pVal && fVal && String(pVal) !== String(fVal));
  });

  if (!editingMasterContact) return null;

  const targetId = editingMasterContact.originalDocId || editingMasterContact.contactId;

  const splitName = (editingMasterContact.fullName || '').trim().split(' ');
  const contactNombre = editingMasterContact.contactNombre || splitName[0] || '';
  const contactApellido = editingMasterContact.contactApellido || splitName.slice(1).join(' ') || '';

  const selectedAcc = clientAccounts.find((a) => a.accountId === editingMasterContact.accountId);
  const currentRoles = getRolesForAccountType(selectedAcc?.accountType);
  const currentRole = normalizeRole(editingMasterContact.role, selectedAcc?.accountType);

  const currentSizing = (editingMasterContact.sizingMatrix ||
    editingMasterContact.sizingMatrix12PtCM ||
    editingMasterContact.measurements ||
    {}) as Record<string, string | number>;

  const handlePromptSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!targetId) {
      setErrorMessage('ID de contacto no encontrado.');
      return;
    }
    if (!contactNombre.trim() || !contactApellido.trim()) {
      setErrorMessage('Por favor ingrese el Nombre y Apellido del contacto.');
      return;
    }

    setShowConfirmSave(true);
  };

  const confirmAndSaveContact = async () => {
    if (!db || !targetId) return;

    try {
      setIsSaving(true);
      setErrorMessage(null);

      let finalRole = editingMasterContact.role || 'OTRO';
      if (!currentRoles.includes(finalRole)) {
        finalRole = normalizeRole(finalRole, selectedAcc?.accountType);
      }
      const actualRoleToSave = currentRoles.includes(finalRole) ? finalRole : (currentRoles[0] || 'OTRO');

      const sizing = (editingMasterContact.sizingMatrix ||
        editingMasterContact.sizingMatrix12PtCM ||
        editingMasterContact.measurements ||
        {}) as Record<string, string | number>;

      const fullName = `${contactNombre.trim()} ${contactApellido.trim()}`;

      const contactData: Record<string, unknown> = {
        contactId: editingMasterContact.contactId,
        accountId: editingMasterContact.accountId || '',
        contactNombre: contactNombre.trim(),
        contactApellido: contactApellido.trim(),
        fullName,
        role: actualRoleToSave,
        phone: editingMasterContact.phone || '',
        email: editingMasterContact.email || '',
        socials: editingMasterContact.socials || {},
        sizingMatrix: sizing,
        sizingMatrix12PtCM: sizing,
        updatedAt: Date.now()
      };

      await setDoc(doc(db, 'masterContacts', targetId), contactData, { merge: true });

      // Update primary link in account_contacts
      const existingLinks = accountContacts.filter((ac) => ac.contactId === editingMasterContact.contactId);
      const activeLink = existingLinks.find((ac) => ac.isPrimary) || existingLinks[0];
      if (activeLink) {
        await setDoc(doc(db, 'account_contacts', activeLink.linkId || activeLink.id || ''), { accountId: contactData.accountId, role: contactData.role }, { merge: true });
      } else {
        const counterRef = doc(db, 'metadata', 'linkCounter');
        const counterDoc = await getDoc(counterRef);
        const currentSeq = (counterDoc.exists() && typeof counterDoc.data()?.currentSequence === 'number') ? counterDoc.data()?.currentSequence + 1 : 1;
        const newLinkId = `LNK-${String(currentSeq).padStart(5, '0')}`;
        await setDoc(doc(db, 'account_contacts', newLinkId), { linkId: newLinkId, contactId: editingMasterContact.contactId, accountId: contactData.accountId, role: contactData.role, isPrimary: true, createdAt: Date.now() });
        await setDoc(counterRef, { currentSequence: currentSeq }, { merge: true });
      }

      // Cascade updated measurements to all active production orders for this customer
      const activeStatuses = ['Inventario Pendiente', 'Material Listo', 'En Confección', 'En Producción', 'Medidas Pendientes', 'Orden Activa'];
      const activeOrdersSnap = await getDocs(query(collection(db, 'orders'), where('status', 'in', activeStatuses)));
      const orderBatchUpdates: Promise<void>[] = [];
      activeOrdersSnap.forEach((orderDoc) => {
        const orderData = orderDoc.data();
        const isMatch = (orderData.contactId && orderData.contactId === editingMasterContact.contactId) || normalizeName(String(orderData.customer || orderData.client || '')) === normalizeName(fullName);
        if (isMatch) {
          const existingSizing = orderData.sizingMatrix || orderData.sizingMatrix12PtCM || orderData.measurements || {};
          const updatedOrderSizing = { ...existingSizing, ...sizing };
          const updatedItems = ((orderData.items as Array<Record<string, unknown>>) || []).map((item) => {
            const itemName = String(item.name || '');
            if (isUpperTailored(itemName) || isBundleGarment(itemName) || isLowerTailored(itemName)) {
              return { ...item, customMeasurements: { ...((item.customMeasurements as Record<string, unknown>) || {}), ...sizing }, measurements: { ...((item.measurements as Record<string, unknown>) || {}), ...sizing } };
            }
            const cleanItem = { ...item };
            delete cleanItem.customMeasurements;
            delete cleanItem.measurements;
            return cleanItem;
          });
          orderBatchUpdates.push(updateDoc(doc(db, 'orders', orderDoc.id), { sizingMatrix: updatedOrderSizing, sizingMatrix12PtCM: updatedOrderSizing, items: updatedItems, updatedAt: Date.now() }));
        }
      });
      if (orderBatchUpdates.length > 0) await Promise.all(orderBatchUpdates);

      if (setContactSuccessMsg) {
        setContactSuccessMsg(`Contacto ${fullName} actualizado exitosamente.`);
        setTimeout(() => setContactSuccessMsg(''), 3500);
      }

      setShowConfirmSave(false);
      onClose();
    } catch (err) {
      console.error('[EditContactModal] Error al guardar contacto:', err);
      setErrorMessage('Error al guardar el contacto y sincronizar sus pedidos activos.');
    } finally {
      setIsSaving(false);
    }
  };

  const displayedFullName = editingMasterContact.fullName || `${contactNombre} ${contactApellido}`.trim();

  return (
    <div className="fixed inset-0 bg-stone-950/90 backdrop-blur-md z-[100] p-3 sm:p-4 md:p-6 flex justify-center items-center overflow-hidden animate-in fade-in duration-200">
      <div className="bg-stone-900 w-[94vw] max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 border border-stone-800 shadow-2xl relative animate-in slide-in-from-bottom">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <h3 className="text-xl sm:text-2xl font-black text-stone-200 uppercase tracking-tighter">
              Editar Contacto
            </h3>
            <span className="text-xs font-mono font-black text-emerald-400 uppercase bg-stone-950 px-2 py-0.5 rounded-md border border-stone-800">
              {editingMasterContact.contactId}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-500 hover:text-white transition p-1.5 rounded-lg hover:bg-stone-800 cursor-pointer"
          >
            <X size={22} />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/60 border border-red-800/60 flex items-center gap-2 text-xs text-red-300 font-bold">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 2-Column Desktop Grid */}
        <form noValidate onSubmit={handlePromptSave} className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ========================================================================= */}
            {/* COLUMNA IZQUIERDA: Identidad de Contacto & Vinculación                   */}
            {/* ========================================================================= */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-stone-800">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                  1. Identidad de Contacto & Cuenta
                </span>
              </div>

              {/* Row 1: Contact ID auto-badge + Linked Account selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                    ID (Bloqueado)
                  </label>
                  <div className="w-full bg-stone-950 border border-stone-800/80 px-3 py-2 rounded-xl text-xs font-mono font-black text-emerald-400">
                    {editingMasterContact.contactId}
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                    Cuenta Cliente Vinculada
                  </label>
                  <select
                    value={editingMasterContact.accountId || ''}
                    onChange={(e) => {
                      const accId = e.target.value;
                      const acc = clientAccounts.find((a) => a.accountId === accId);
                      const roles = getRolesForAccountType(acc?.accountType);
                      setEditingMasterContact({
                        ...editingMasterContact,
                        accountId: accId,
                        role: roles[0] || 'OTRO'
                      });
                    }}
                    className="w-full bg-stone-950 border border-stone-800 p-2 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300 cursor-pointer"
                  >
                    <option value="">NINGUNA (Null)</option>
                    {clientAccounts.map((a) => (
                      <option key={a.accountId} value={a.accountId}>
                        {a.accountName} ({a.accountId}) — [{normalizeAccountType(a.accountType)}]
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Nombre * & Apellido * */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={contactNombre}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingMasterContact({
                        ...editingMasterContact,
                        contactNombre: val,
                        fullName: `${val} ${contactApellido}`.trim()
                      });
                    }}
                    placeholder="Ej. Juan"
                    className="w-full bg-stone-950 border border-stone-800 p-2 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    value={contactApellido}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingMasterContact({
                        ...editingMasterContact,
                        contactApellido: val,
                        fullName: `${contactNombre} ${val}`.trim()
                      });
                    }}
                    placeholder="Ej. Pérez"
                    className="w-full bg-stone-950 border border-stone-800 p-2 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300"
                  />
                </div>
              </div>

              {/* Row 3: Rol / Cargo dropdown */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                  Rol / Cargo ({normalizeAccountType(selectedAcc?.accountType)})
                </label>
                <select
                  value={currentRole}
                  onChange={(e) => setEditingMasterContact({ ...editingMasterContact, role: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-800 p-2 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300 cursor-pointer"
                >
                  {currentRoles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Row 4: Teléfono / WhatsApp & Correo Electrónico */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={editingMasterContact.phone || ''}
                    onChange={(e) => setEditingMasterContact({ ...editingMasterContact, phone: e.target.value })}
                    placeholder="Ej. 70012345"
                    className="w-full bg-stone-950 border border-stone-800 p-2 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={editingMasterContact.email || ''}
                    onChange={(e) => setEditingMasterContact({ ...editingMasterContact, email: e.target.value })}
                    placeholder="cliente@ejemplo.com"
                    className="w-full bg-stone-950 border border-stone-800 p-2 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300"
                  />
                </div>
              </div>

              {/* Row 5: Notes / Observaciones */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                  Notas / Observaciones
                </label>
                <textarea
                  rows={2}
                  value={editingMasterContact.sizingMatrix?.notes || ''}
                  onChange={(e) => {
                    const nextSizing = { ...currentSizing, notes: e.target.value };
                    setEditingMasterContact({
                      ...editingMasterContact,
                      sizingMatrix: nextSizing,
                      sizingMatrix12PtCM: nextSizing
                    });
                  }}
                  placeholder="Observaciones de talla, ajustes de manga, preferencias..."
                  className="w-full bg-stone-950 border border-stone-800 p-2 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300 resize-none"
                />
              </div>
            </div>

            {/* ========================================================================= */}
            {/* COLUMNA DERECHA: Matriz de Sastrería (12 Puntos Anatómicos)               */}
            {/* ========================================================================= */}
            <div>
              <Tailoring12PointsGrid
                measurements={currentSizing}
                onChangeMeasurements={(updated) => {
                  setEditingMasterContact({
                    ...editingMasterContact,
                    sizingMatrix: updated,
                    sizingMatrix12PtCM: updated
                  });
                }}
                isPantalonWaistOverridden={isPantalonWaistOverridden}
                setIsPantalonWaistOverridden={setIsPantalonWaistOverridden}
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-6 mt-6 border-t border-stone-800 flex justify-between items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-stone-400 hover:text-white transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Save size={14} /> Guardar Cambios
            </button>
          </div>
        </form>

        {/* 2-Step In-App Confirmation Modal */}
        {showConfirmSave && (
          <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in">
              <div className="flex items-center gap-3 text-amber-400">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <HelpCircle size={20} />
                </div>
                <h3 className="text-lg font-black text-stone-100 uppercase tracking-tight">
                  ¿Confirmar cambios en el contacto?
                </h3>
              </div>
              <p className="text-stone-300 text-xs leading-relaxed">
                Se actualizarán las medidas anatómicas y datos de{' '}
                <strong className="text-white">{displayedFullName}</strong> (ID: {editingMasterContact.contactId}).
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
                  onClick={confirmAndSaveContact}
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
