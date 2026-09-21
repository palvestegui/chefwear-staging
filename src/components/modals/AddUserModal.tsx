import React, { useState } from 'react';
import { X, UserPlus, Mail, User, Shield, AlertCircle, Check } from 'lucide-react';
import { doc, getDoc, setDoc, getDocs, collection, query, where, serverTimestamp, Firestore } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../firebase';
import { AssignedUserRole } from '../../types';
import { ASSIGNED_ROLE_CONFIG, validateRFC5322Email } from '../../utils/userRoleUtils';

export interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  db: Firestore;
  onSuccess?: (email: string) => void;
}

const AVAILABLE_ROLES: AssignedUserRole[] = ['ventas', 'operaciones', 'produccion', 'logistica', 'admin'];

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  db,
  onSuccess
}) => {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<AssignedUserRole>('ventas');
  const [emailTouched, setEmailTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isEmailValid = validateRFC5322Email(email);
  const selectedRoleConfig = ASSIGNED_ROLE_CONFIG[role];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    const cleanName = displayName.trim();

    if (!cleanEmail || !validateRFC5322Email(cleanEmail)) {
      setError('Ingrese un correo electrónico válido bajo formato estándar (RFC 5322).');
      return;
    }

    if (cleanName.length < 2) {
      setError('El nombre completo debe tener al menos 2 caracteres.');
      return;
    }

    setIsSubmitting(true);
    const emailLower = cleanEmail.toLowerCase();

    try {
      // Verificar si ya existe un perfil pre-provisionado o registrado
      const userDocRef = doc(db, 'users', emailLower);
      const existingSnap = await getDoc(userDocRef);

      if (existingSnap.exists()) {
        setError(`Ya existe un usuario o pre-registro para ${cleanEmail}.`);
        setIsSubmitting(false);
        return;
      }

      // Consulta secundaria por campo email
      const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        setError(`El correo ${cleanEmail} ya se encuentra asignado a una cuenta existente.`);
        setIsSubmitting(false);
        return;
      }

      // Escritura atómica a Firestore 'users'
      await setDoc(userDocRef, {
        email: cleanEmail,
        emailLower: emailLower,
        displayName: cleanName,
        name: cleanName,
        role: selectedRoleConfig.dbRole,
        status: 'APPROVED',
        canExport: selectedRoleConfig.permissions.canExport,
        canEditPrices: selectedRoleConfig.permissions.canEditPrices,
        canManageRoles: selectedRoleConfig.permissions.canManageRoles,
        canAccessDangerZone: selectedRoleConfig.permissions.canAccessDangerZone,
        preProvisioned: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      if (onSuccess) {
        onSuccess(cleanEmail);
      }
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${emailLower}`);
      setError(err instanceof Error ? err.message : 'Error al pre-provisionar el usuario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-stone-950/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2.5 text-amber-500">
            <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-stone-100 uppercase tracking-tight">Agregar Usuario</h3>
              <p className="text-[10px] font-bold text-amber-500/80 uppercase tracking-wider">Pre-provisionar Cuenta</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-500 hover:text-white p-1.5 rounded-xl hover:bg-stone-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email input */}
          <div className="space-y-1">
            <label className="text-[11px] font-black text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <Mail size={12} className="text-stone-400" /> Correo Electrónico (Google Auth)
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (!emailTouched) setEmailTouched(true);
              }}
              onBlur={() => setEmailTouched(true)}
              placeholder="ejemplo@azafran.com"
              className={`w-full bg-stone-950 border px-3 py-2.5 rounded-xl text-xs text-stone-100 font-mono outline-none transition ${
                emailTouched && !isEmailValid && email.length > 0
                  ? 'border-red-500/80 focus:border-red-500'
                  : 'border-stone-800 focus:border-amber-500'
              }`}
            />
            {emailTouched && !isEmailValid && email.length > 0 && (
              <p className="text-[10px] text-red-400 font-medium">Formato de correo no válido según RFC 5322.</p>
            )}
          </div>

          {/* Full Name input */}
          <div className="space-y-1">
            <label className="text-[11px] font-black text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <User size={12} className="text-stone-400" /> Nombre Completo / Display Name
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="ej: Rodrigo Torrico"
              className="w-full bg-stone-950 border border-stone-800 px-3 py-2.5 rounded-xl text-xs text-stone-100 outline-none focus:border-amber-500 transition font-medium"
            />
          </div>

          {/* Role selection */}
          <div className="space-y-1">
            <label className="text-[11px] font-black text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <Shield size={12} className="text-stone-400" /> Rol Asignado
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AssignedUserRole)}
              className="w-full bg-stone-950 border border-stone-800 px-3 py-2.5 rounded-xl text-xs text-amber-500 font-black uppercase tracking-wide outline-none focus:border-amber-500 cursor-pointer transition"
            >
              {AVAILABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ASSIGNED_ROLE_CONFIG[r].label} ({r})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-stone-400 leading-tight pt-1">
              {selectedRoleConfig.description}
            </p>
          </div>

          {/* Role permissions summary preview */}
          <div className="bg-stone-950/70 border border-stone-800 rounded-2xl p-3 space-y-2 text-[10px]">
            <span className="font-black text-stone-400 uppercase tracking-wider block">Permisos por Defecto:</span>
            <div className="grid grid-cols-2 gap-1.5">
              <span className={`px-2 py-1 rounded-lg flex items-center justify-between font-mono font-bold ${
                selectedRoleConfig.permissions.canExport ? 'bg-amber-500/10 text-amber-400' : 'bg-stone-900 text-stone-500'
              }`}>
                <span>Exportar CSV</span>
                <span>{selectedRoleConfig.permissions.canExport ? 'SÍ' : 'NO'}</span>
              </span>
              <span className={`px-2 py-1 rounded-lg flex items-center justify-between font-mono font-bold ${
                selectedRoleConfig.permissions.canEditPrices ? 'bg-amber-500/10 text-amber-400' : 'bg-stone-900 text-stone-500'
              }`}>
                <span>Editar Precios</span>
                <span>{selectedRoleConfig.permissions.canEditPrices ? 'SÍ' : 'NO'}</span>
              </span>
              <span className={`px-2 py-1 rounded-lg flex items-center justify-between font-mono font-bold ${
                selectedRoleConfig.permissions.canManageRoles ? 'bg-amber-500/10 text-amber-400' : 'bg-stone-900 text-stone-500'
              }`}>
                <span>Gestionar Roles</span>
                <span>{selectedRoleConfig.permissions.canManageRoles ? 'SÍ' : 'NO'}</span>
              </span>
              <span className={`px-2 py-1 rounded-lg flex items-center justify-between font-mono font-bold ${
                selectedRoleConfig.permissions.canAccessDangerZone ? 'bg-rose-500/10 text-rose-400' : 'bg-stone-900 text-stone-500'
              }`}>
                <span>Zona Peligro</span>
                <span>{selectedRoleConfig.permissions.canAccessDangerZone ? 'SÍ' : 'NO'}</span>
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-stone-400 hover:text-white hover:bg-stone-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isEmailValid}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                'Guardando...'
              ) : (
                <>
                  <Check size={14} /> Provisionar Usuario
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
