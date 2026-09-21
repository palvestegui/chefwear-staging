import React, { useState } from 'react';
import { UserPlus, X, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db as defaultDb } from '../../firebase';
import { 
  requiredFields as defaultRequiredFields, 
  fieldLabels as defaultFieldLabels, 
  getRolesForAccountType as defaultGetRoles, 
  normalizeAccountType as defaultNormalizeAccountType, 
  normalizeRole as defaultNormalizeRole 
} from '../../utils/constants';

export interface NewContactModalProps {
  onClose: () => void;
  newContact: any;
  setNewContact: React.Dispatch<React.SetStateAction<any>>;
  clientAccounts: any[];
  requiredFields?: Record<string, string[]>;
  fieldLabels?: Record<string, string>;
  masterContacts?: any[];
  setContactSuccessMsg?: (msg: string) => void;
  db?: any;
  user?: any;
  contactSuccessMsg?: string;
  getRolesForAccountType?: (type?: string) => string[];
  normalizeAccountType?: (type?: string) => string;
  normalizeRole?: (role?: string, type?: string) => string;
  accountContacts?: any[];
}

export const NewContactModal: React.FC<NewContactModalProps> = ({
  onClose,
  newContact,
  setNewContact,
  clientAccounts = [],
  requiredFields = defaultRequiredFields,
  fieldLabels = defaultFieldLabels,
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
  const computeNextContactId = () => {
    const prefix = 'CON-';
    let maxNum = 0;
    (masterContacts || []).forEach(acc => {
      const id = acc.contactId || acc.id || '';
      if (typeof id === 'string' && id.startsWith(prefix)) {
        const numStr = id.replace(prefix, '');
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    return `${prefix}${(maxNum + 1).toString().padStart(3, '0')}`;
  };

  const currentContactId = computeNextContactId();

  // Cancel action: clears any state and closes modal
  const handleCancel = () => {
    setErrorMessage('');
    setLocalSuccessMsg('');
    setIsPantalonWaistOverridden(false);
    setNewContact({
      accountId: '',
      contactNombre: '',
      contactApellido: '',
      role: 'Estudiante',
      phone: '',
      email: '',
      measurements: {}
    });
    onClose();
  };

  // Save handler supporting both "Guardar y cerrar" and "Guardar y Añadir otro"
  const handleSave = async (addAnother: boolean) => {
    setErrorMessage('');
    setLocalSuccessMsg('');

    if (!newContact.contactNombre?.trim() || !newContact.contactApellido?.trim()) {
      setErrorMessage('Por favor ingrese el Nombre y Apellido del contacto.');
      return;
    }

    if (!newContact.accountId || newContact.accountId === '') {
      setErrorMessage('Por favor seleccione una Cuenta de Cliente para vincular este contacto.');
      return;
    }

    const role = newContact.role?.trim() || 'Particular';
    const contactId = computeNextContactId();

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
        val => val !== undefined && val !== null && val !== ''
      );

      const contactData = {
        contactId,
        accountId: newContact.accountId,
        contactNombre: newContact.contactNombre.trim(),
        contactApellido: newContact.contactApellido.trim(),
        fullName: `${newContact.contactNombre.trim()} ${newContact.contactApellido.trim()}`,
        role,
        phone: newContact.phone?.trim() || '',
        email: newContact.email?.trim() || '',
        status: 'ACTIVE',
        sizingMatrix12PtCM: hasMeasurements ? finalMeasurements : {},
        sizingMatrix: hasMeasurements ? finalMeasurements : {},
        measurements: hasMeasurements ? finalMeasurements : {},
        createdAt: Date.now(),
        createdBy: user?.uid || ''
      };

      await setDoc(doc(activeDb, 'masterContacts', contactId), contactData);

      const successText = `Contacto ${contactId} (${contactData.fullName}) guardado exitosamente.`;
      if (setContactSuccessMsg) {
        setContactSuccessMsg(successText);
      }
      setLocalSuccessMsg(successText);

      if (addAnother) {
        // Reset form for next entry but keep the selected account and role
        setIsPantalonWaistOverridden(false);
        setNewContact({
          accountId: newContact.accountId,
          contactNombre: '',
          contactApellido: '',
          role: newContact.role,
          phone: '',
          email: '',
          measurements: {}
        });

        setTimeout(() => {
          setLocalSuccessMsg('');
        }, 3500);
      } else {
        // Close modal after saving
        onClose();
      }
    } catch (error: any) {
      console.error('Error guardando contacto:', error);
      setErrorMessage('Error al guardar el contacto. Intente nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedAcc = clientAccounts.find(a => a.accountId === newContact.accountId);
  const currentRoles = getRolesForAccountType(selectedAcc?.accountType);
  const currentRole = normalizeRole(newContact.role, selectedAcc?.accountType);

  return (
    <div className="fixed inset-0 bg-stone-950/90 backdrop-blur-md z-[60] p-3 sm:p-4 md:p-6 flex justify-center items-center overflow-hidden animate-in fade-in duration-200">
      <div className="bg-stone-900 w-[95vw] max-w-[1700px] mx-auto rounded-[2.5rem] shadow-2xl overflow-y-auto custom-scrollbar border border-stone-800 p-6 sm:p-8 max-h-[90vh] relative animate-in slide-in-from-bottom">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
              <UserPlus size={22} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-stone-200 uppercase tracking-tighter">Nuevo Contacto</h3>
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Crear y vincular un contacto al directorio</p>
            </div>
          </div>
          <button 
            onClick={handleCancel} 
            className="text-stone-500 hover:text-white transition p-2 rounded-xl hover:bg-stone-800"
          >
            <X size={24} />
          </button>
        </div>

        {/* Notifications */}
        {(localSuccessMsg || contactSuccessMsg) && (
          <div className="mb-6 p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2.5">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
            <span>{localSuccessMsg || contactSuccessMsg}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-950/60 border border-red-800 text-red-400 rounded-2xl text-xs font-bold flex items-center gap-2.5">
            <AlertCircle size={18} className="shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Contact ID (Auto-generado)</label>
            <input 
              type="text" 
              value={currentContactId}
              disabled
              className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl text-xs font-mono font-bold text-emerald-500/90 cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Cuenta Cliente Vinculada *</label>
            <select 
              value={newContact.accountId}
              onChange={(e) => {
                const accId = e.target.value;
                const acc = clientAccounts.find(a => a.accountId === accId);
                const roles = getRolesForAccountType(acc?.accountType);
                setNewContact({
                  ...newContact,
                  accountId: accId,
                  role: roles[0] || 'OTRO'
                });
              }}
              className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-emerald-500 outline-none text-xs font-bold text-stone-300"
            >
              <option value="">-- Seleccionar Cuenta --</option>
              {clientAccounts.map(a => (
                <option key={a.accountId} value={a.accountId}>
                  {a.accountName} ({a.accountId}) — [{normalizeAccountType(a.accountType)}]
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Nombre *</label>
              <input 
                type="text" 
                value={newContact.contactNombre || ''}
                onChange={(e) => setNewContact({...newContact, contactNombre: e.target.value})}
                className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-emerald-500 outline-none text-xs font-bold text-stone-300 placeholder:text-stone-700"
                placeholder="Ej. Juan"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Apellido *</label>
              <input 
                type="text" 
                value={newContact.contactApellido || ''}
                onChange={(e) => setNewContact({...newContact, contactApellido: e.target.value})}
                className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-emerald-500 outline-none text-xs font-bold text-stone-300 placeholder:text-stone-700"
                placeholder="Ej. Perez"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
              Rol / Cargo ({normalizeAccountType(selectedAcc?.accountType)})
            </label>
            <select 
              value={currentRole}
              onChange={(e) => setNewContact({...newContact, role: e.target.value})}
              className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-emerald-500 outline-none text-xs font-bold text-stone-300"
            >
              {currentRoles.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Teléfono</label>
              <input 
                type="text" 
                value={newContact.phone || ''}
                onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-emerald-500 outline-none text-xs font-bold text-stone-300 placeholder:text-stone-700"
                placeholder="Ej. 70012345"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Email</label>
              <input 
                type="email" 
                value={newContact.email || ''}
                onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-emerald-500 outline-none text-xs font-bold text-stone-300 placeholder:text-stone-700"
                placeholder="ejemplo@correo.com"
              />
            </div>
          </div>

          {/* Sizing Matrix */}
          <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 mt-4 space-y-4">
            <h4 className="text-xs font-black text-stone-300 uppercase tracking-widest border-b border-stone-800/80 pb-2">
              Matriz de Tallas (12 Puntos)
            </h4>
            
            <div className="space-y-4">
              <div>
                <h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3 text-left">
                  Medidas Filipina
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3">
                  {(requiredFields['Filipina'] || []).map((m: string) => {
                    const isWaist = m === 'cintura';
                    const val = isWaist 
                      ? (newContact.measurements?.F_Cintura ?? newContact.measurements?.cintura ?? '') 
                      : (newContact.measurements?.[m] || '');
                    return (
                      <div key={`filipina-${m}`} className="flex flex-col gap-1 text-left">
                        <div className="flex items-center justify-between ml-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                            {isWaist ? 'Cintura (Filipina)' : (fieldLabels[m] || m)}
                          </span>
                          {isWaist && !isPantalonWaistOverridden && (
                            <span className="text-[8px] font-bold text-emerald-500/80 uppercase tracking-wider">
                              Vinculado
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          placeholder="0.0 cm"
                          value={val}
                          onChange={e => {
                            const v = e.target.value;
                            setNewContact((p: any) => {
                              const currentMeas = p.measurements || {};
                              const updated: Record<string, any> = {
                                ...currentMeas,
                                [m]: v,
                                ...(isWaist ? { F_Cintura: v, cintura: v } : {})
                              };
                              if (isWaist && !isPantalonWaistOverridden) {
                                updated.P_Cintura = v;
                              }
                              return { ...p, measurements: updated };
                            });
                          }}
                          className="bg-stone-900 border border-stone-800 p-2 rounded-lg text-xs font-mono text-emerald-400 placeholder:text-stone-700 outline-none focus:border-emerald-500 w-full"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="pt-2 border-t border-stone-900">
                <h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3 text-left">
                  Medidas Pantalón
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3">
                  {(requiredFields['Pantalón'] || []).map((m: string) => {
                    const isWaist = m === 'cintura';
                    const val = isWaist
                      ? (newContact.measurements?.P_Cintura ?? (!isPantalonWaistOverridden ? (newContact.measurements?.F_Cintura ?? newContact.measurements?.cintura ?? '') : ''))
                      : (newContact.measurements?.[m] || '');
                    return (
                      <div key={`pantalon-${m}`} className="flex flex-col gap-1 text-left">
                        <div className="flex items-center justify-between ml-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                            {isWaist ? 'Cintura (Pantalón)' : (fieldLabels[m] || m)}
                          </span>
                          {isWaist && isPantalonWaistOverridden && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsPantalonWaistOverridden(false);
                                setNewContact((p: any) => {
                                  const fWaist = p.measurements?.F_Cintura ?? p.measurements?.cintura ?? '';
                                  return {
                                    ...p,
                                    measurements: {
                                      ...(p.measurements || {}),
                                      P_Cintura: fWaist
                                    }
                                  };
                                });
                              }}
                              className="text-[8px] font-bold text-amber-500 hover:text-amber-400 underline cursor-pointer"
                              title="Volver a sincronizar con la cintura de filipina"
                            >
                              Re-vincular
                            </button>
                          )}
                        </div>
                        <input
                          type="number"
                          placeholder="0.0 cm"
                          value={val}
                          onChange={e => {
                            const v = e.target.value;
                            if (isWaist) {
                              setIsPantalonWaistOverridden(true);
                            }
                            setNewContact((p: any) => ({
                              ...p, 
                              measurements: {
                                ...(p.measurements || {}),
                                ...(isWaist ? { P_Cintura: v } : { [m]: v })
                              }
                            }));
                          }}
                          className="bg-stone-900 border border-stone-800 p-2 rounded-lg text-xs font-mono text-emerald-400 placeholder:text-stone-700 outline-none focus:border-emerald-500 w-full"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-stone-800 flex flex-col sm:flex-row justify-between items-center gap-4">
            <button 
              type="button"
              onClick={handleCancel} 
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-stone-400 hover:text-stone-200 hover:bg-stone-800/60 transition"
            >
              Cancelar
            </button>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button 
                type="button"
                disabled={isSaving}
                onClick={() => handleSave(false)} 
                className="w-full sm:w-auto bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition shadow-md disabled:opacity-50"
              >
                Guardar y cerrar
              </button>
              <button 
                type="button"
                disabled={isSaving}
                onClick={() => handleSave(true)} 
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition shadow-lg shadow-emerald-950 disabled:opacity-50"
              >
                Guardar y Añadir otro
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
