import React, { useMemo, useState } from 'react';
import { UserPlus, X, CheckCircle2, AlertCircle, Save, Plus } from 'lucide-react';
import { doc, setDoc, Firestore } from 'firebase/firestore';
import { db as defaultDb } from '../../firebase';
import {
  getRolesForAccountType as defaultGetRoles,
  normalizeAccountType as defaultNormalizeAccountType,
  normalizeRole as defaultNormalizeRole
} from '../../utils/constants';
import { ClientAccount, MasterContact } from '../../types/crm';
import { Tailoring12PointsGrid } from '../crm/Tailoring12PointsGrid';

export interface NewContactFormData {
  accountId: string;
  contactNombre: string;
  contactApellido: string;
  role: string;
  phone?: string;
  email?: string;
  notes?: string;
  measurements?: Record<string, string | number>;
}

export interface NewContactModalProps {
  onClose: () => void;
  newContact: NewContactFormData;
  setNewContact: React.Dispatch<React.SetStateAction<NewContactFormData>>;
  clientAccounts: ClientAccount[];
  requiredFields?: Record<string, string[]>;
  fieldLabels?: Record<string, string>;
  masterContacts?: MasterContact[];
  setContactSuccessMsg?: (msg: string) => void;
  db?: Firestore;
  user?: { uid?: string } | null;
  contactSuccessMsg?: string;
  getRolesForAccountType?: (type?: string) => string[];
  normalizeAccountType?: (type?: string) => string;
  normalizeRole?: (role?: string, type?: string) => string;
  accountContacts?: unknown[];
}

export const NewContactModal: React.FC<NewContactModalProps> = ({
  onClose,
  newContact,
  setNewContact,
  clientAccounts = [],
  masterContacts = [],
  setContactSuccessMsg,
  db,
  user,
  contactSuccessMsg,
  getRolesForAccountType = defaultGetRoles,
  normalizeAccountType = defaultNormalizeAccountType,
  normalizeRole = defaultNormalizeRole
}) => {
  const [localSuccessMsg, setLocalSuccessMsg] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPantalonWaistOverridden, setIsPantalonWaistOverridden] = useState<boolean>(false);

  const activeDb = db || defaultDb;

  // Compute next available Contact ID
  const currentContactId = useMemo(() => {
    const prefix = 'CON-';
    let maxNum = 0;
    (masterContacts || []).forEach((c) => {
      const id = c.contactId || c.id || '';
      if (typeof id === 'string' && id.startsWith(prefix)) {
        const numStr = id.replace(prefix, '');
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    return `${prefix}${(maxNum + 1).toString().padStart(3, '0')}`;
  }, [masterContacts]);

  // Ensure ACC-000 is always present in account options
  const accountsOptions = useMemo(() => {
    const hasAcc0 = clientAccounts.some((a) => a.accountId === 'ACC-000');
    if (hasAcc0) return clientAccounts;
    const canonicalAcc0: ClientAccount = {
      id: 'ACC-000',
      accountId: 'ACC-000',
      accountName: 'Cliente Particular',
      accountType: 'Particular / Individuo',
      pricingTier: 'Estándar Raleo',
      isProtected: true
    };
    return [canonicalAcc0, ...clientAccounts];
  }, [clientAccounts]);

  const targetAccountId = newContact.accountId || 'ACC-000';
  const selectedAcc = accountsOptions.find((a) => a.accountId === targetAccountId);
  const currentRoles = getRolesForAccountType(selectedAcc?.accountType || 'Particular / Individuo');
  const currentRole = normalizeRole(newContact.role || 'PARTICULAR', selectedAcc?.accountType || 'Particular / Individuo');

  const handleAccountChange = (accId: string) => {
    const targetId = accId || 'ACC-000';
    const acc = accountsOptions.find((a) => a.accountId === targetId);
    const roles = getRolesForAccountType(acc?.accountType);
    let nextRole = roles[0] || 'OTRO';
    if (targetId === 'ACC-000') {
      nextRole = 'PARTICULAR';
    } else if (targetId === 'ACC-001' || (acc?.accountName && acc.accountName.toUpperCase().includes('UDI'))) {
      nextRole = 'ESTUDIANTE';
    }
    setNewContact({
      ...newContact,
      accountId: targetId,
      role: nextRole
    });
  };

  const handleCancel = () => {
    setErrorMessage('');
    setLocalSuccessMsg('');
    setIsPantalonWaistOverridden(false);
    setNewContact({
      accountId: 'ACC-000',
      contactNombre: '',
      contactApellido: '',
      role: 'PARTICULAR',
      phone: '',
      email: '',
      notes: '',
      measurements: {}
    });
    onClose();
  };

  const handleSave = async (addAnother: boolean) => {
    setErrorMessage('');
    setLocalSuccessMsg('');

    if (!newContact.contactNombre?.trim() || !newContact.contactApellido?.trim()) {
      setErrorMessage('Por favor ingrese el Nombre y Apellido del contacto.');
      return;
    }

    const finalAccountId = newContact.accountId?.trim() || 'ACC-000';
    let role = newContact.role?.trim();
    if (!role) {
      role = finalAccountId === 'ACC-000' ? 'PARTICULAR' : finalAccountId === 'ACC-001' ? 'ESTUDIANTE' : currentRoles[0] || 'Particular';
    }

    try {
      setIsSaving(true);

      const rawMeas = newContact.measurements || {};
      const fWaist = rawMeas.F_Cintura ?? rawMeas.cintura ?? '';
      const pWaist = rawMeas.P_Cintura ?? (fWaist || '');
      const finalMeasurements = {
        ...rawMeas,
        F_Cintura: fWaist,
        P_Cintura: pWaist,
        cintura: fWaist
      };

      const hasMeasurements = Object.values(finalMeasurements).some(
        (val) => val !== undefined && val !== null && val !== ''
      );

      const contactData: Record<string, unknown> = {
        contactId: currentContactId,
        accountId: finalAccountId,
        contactNombre: newContact.contactNombre.trim(),
        contactApellido: newContact.contactApellido.trim(),
        fullName: `${newContact.contactNombre.trim()} ${newContact.contactApellido.trim()}`,
        role,
        phone: newContact.phone?.trim() || '',
        email: newContact.email?.trim() || '',
        notes: newContact.notes?.trim() || '',
        status: 'ACTIVE',
        sizingMatrix12PtCM: hasMeasurements ? finalMeasurements : {},
        sizingMatrix: hasMeasurements ? finalMeasurements : {},
        measurements: hasMeasurements ? finalMeasurements : {},
        createdAt: Date.now(),
        createdBy: user?.uid || ''
      };

      await setDoc(doc(activeDb, 'masterContacts', currentContactId), contactData);

      const successText = `Contacto ${currentContactId} (${contactData.fullName}) guardado exitosamente.`;
      if (setContactSuccessMsg) {
        setContactSuccessMsg(successText);
      }
      setLocalSuccessMsg(successText);

      if (addAnother) {
        setIsPantalonWaistOverridden(false);
        setNewContact({
          accountId: newContact.accountId,
          contactNombre: '',
          contactApellido: '',
          role: newContact.role,
          phone: '',
          email: '',
          notes: '',
          measurements: {}
        });

        setTimeout(() => {
          setLocalSuccessMsg('');
        }, 3500);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('[NewContactModal] Error guardando contacto:', error);
      setErrorMessage('Error al guardar el contacto. Intente nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-950/90 backdrop-blur-md z-[60] p-3 sm:p-4 md:p-6 flex justify-center items-center overflow-hidden animate-in fade-in duration-200">
      <div className="bg-stone-900 w-[94vw] max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 border border-stone-800 shadow-2xl relative animate-in slide-in-from-bottom">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-stone-200 uppercase tracking-tighter">
                Nuevo Contacto
              </h3>
              <p className="text-[11px] font-mono text-stone-500">
                Crear y vincular un contacto con medidas de taller al directorio.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="text-stone-500 hover:text-white transition p-1.5 rounded-lg hover:bg-stone-800 cursor-pointer"
          >
            <X size={22} />
          </button>
        </div>

        {/* Notifications */}
        {(localSuccessMsg || contactSuccessMsg) && (
          <div className="mt-4 p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2.5">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            <span>{localSuccessMsg || contactSuccessMsg}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3 bg-red-950/60 border border-red-800 text-red-400 rounded-xl text-xs font-bold flex items-center gap-2.5">
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 2-Column Desktop Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
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
                  ID (Auto)
                </label>
                <div className="w-full bg-stone-950 border border-stone-800/80 px-3 py-2 rounded-xl text-xs font-mono font-black text-emerald-400">
                  {currentContactId}
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                  Cuenta Cliente Vinculada *
                </label>
                <select
                  value={newContact.accountId || 'ACC-000'}
                  onChange={(e) => handleAccountChange(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 p-2 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300 cursor-pointer"
                >
                  {accountsOptions.map((a) => (
                    <option key={a.accountId} value={a.accountId}>
                      {a.accountId} — {a.accountName} [{normalizeAccountType(a.accountType)}]
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
                  value={newContact.contactNombre || ''}
                  onChange={(e) => setNewContact({ ...newContact, contactNombre: e.target.value })}
                  placeholder="Ej. Juan"
                  className="w-full bg-stone-950 border border-stone-800 p-2 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300 placeholder:text-stone-700"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                  Apellido *
                </label>
                <input
                  type="text"
                  value={newContact.contactApellido || ''}
                  onChange={(e) => setNewContact({ ...newContact, contactApellido: e.target.value })}
                  placeholder="Ej. Pérez"
                  className="w-full bg-stone-950 border border-stone-800 p-2 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300 placeholder:text-stone-700"
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
                onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
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
                  value={newContact.phone || ''}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="Ej. 70012345"
                  className="w-full bg-stone-950 border border-stone-800 p-2 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300 placeholder:text-stone-700"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={newContact.email || ''}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="ejemplo@correo.com"
                  className="w-full bg-stone-950 border border-stone-800 p-2 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300 placeholder:text-stone-700"
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
                value={newContact.notes || ''}
                onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                placeholder="Observaciones de talla, ajustes de manga, preferencias..."
                className="w-full bg-stone-950 border border-stone-800 p-2 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300 placeholder:text-stone-700 resize-none"
              />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* COLUMNA DERECHA: Matriz de Sastrería (12 Puntos Anatómicos)               */}
          {/* ========================================================================= */}
          <div>
            <Tailoring12PointsGrid
              measurements={newContact.measurements || {}}
              onChangeMeasurements={(updated) => setNewContact({ ...newContact, measurements: updated })}
              isPantalonWaistOverridden={isPantalonWaistOverridden}
              setIsPantalonWaistOverridden={setIsPantalonWaistOverridden}
            />
          </div>
        </div>

        {/* Action Footer */}
        <div className="pt-6 mt-6 border-t border-stone-800 flex justify-between items-center gap-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-stone-400 hover:text-white transition cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(true)}
              className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} /> Guardar y Añadir Otro
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(false)}
              className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Save size={14} /> Guardar Contacto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
