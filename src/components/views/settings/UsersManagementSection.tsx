import React, { useState } from 'react';
import { Shield, Check, UserPlus } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../../firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { AddUserModal } from '../../modals/AddUserModal';
import { getDefaultPermissionsForRole } from '../../../utils/userRoleUtils';

export interface UsersManagementSectionProps {
  allUsers: any[];
  db: any;
}

export const UsersManagementSection: React.FC<UsersManagementSectionProps> = ({
  allUsers,
  db
}) => {
  const { isSuperAdmin } = useAuth();
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  return (
    <div className="bg-stone-900 p-8 rounded-[2.5rem] border border-stone-800 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4 mb-2">
        <div className="flex items-center gap-3 text-amber-500">
          <Shield size={28}/> <h2 className="text-2xl font-black uppercase tracking-tighter">Asignación de Roles y Permisos</h2>
        </div>
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setIsAddUserModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer shrink-0"
          >
            <UserPlus size={16} /> + Agregar Usuario
          </button>
        )}
      </div>

      {successToast && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
          <span>{successToast}</span>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-emerald-400 hover:text-emerald-200 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      <p className="text-xs text-stone-400 font-bold leading-relaxed">
        Configure los roles, apruebe nuevos usuarios y gestione los permisos granulares (exportar CSV, editar precios, gestionar roles y zona de peligro).
      </p>

      <div className="space-y-4">
        {allUsers.length === 0 ? (
          <div className="text-stone-500 text-xs italic font-bold text-center py-4 bg-stone-950 rounded-xl border border-stone-800">
            Aún no se han registrado usuarios en la base de datos. Se verán a medida que ingresen.
          </div>
        ) : (
          allUsers.map((u: any) => {
            const userDocId = u.id || u.uid;
            const userStatus = u.status || 'APPROVED';
            const isPending = userStatus === 'PENDING';
            
            return (
              <div key={userDocId || u.email} className={`p-5 rounded-2xl border transition space-y-4 ${
                isPending ? 'bg-amber-950/20 border-amber-500/50' : 'bg-stone-950 border-stone-800'
              }`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-extrabold text-stone-200 text-sm">{u.displayName || u.name || 'Miembro de Equipo'}</p>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        isPending ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}>
                        {isPending ? 'PENDIENTE DE APROBACIÓN' : 'APROBADO'}
                      </span>
                      {u.preProvisioned && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/40">
                          PRE-PROVISIONADO
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-[10px] text-stone-400 mt-0.5">{u.email}</p>
                    <p className="font-mono text-[9px] text-stone-600">ID / UID: {userDocId}</p>
                    {u.lastLoginAt && (
                      <p className="text-[10px] text-amber-400/80 font-mono font-bold mt-1">
                        Último acceso: {u.lastLoginAt?.toDate ? u.lastLoginAt.toDate().toLocaleString('es-BO') : u.lastLoginAt?.seconds ? new Date(u.lastLoginAt.seconds * 1000).toLocaleString('es-BO') : String(u.lastLoginAt)}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {isPending && (
                      <button
                        onClick={async () => {
                          try {
                            const defaultPerms = getDefaultPermissionsForRole(u.role);
                            await updateDoc(doc(db, 'users', userDocId), {
                              status: 'APPROVED',
                              ...defaultPerms
                            });
                            alert(`¡Usuario ${u.displayName || u.email} APROBADO exitosamente!`);
                          } catch (err) {
                            handleFirestoreError(err, OperationType.UPDATE, `users/${userDocId}`);
                          }
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow-md shadow-emerald-900/20 cursor-pointer"
                      >
                        <Check size={14} /> Aprobar Usuario
                      </button>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider">Rol:</span>
                      <select
                        value={(u.role || '').toUpperCase()}
                        onChange={async (e) => {
                          const newRoleVal = e.target.value;
                          try {
                            const defaultPerms = getDefaultPermissionsForRole(newRoleVal);
                            await updateDoc(doc(db, 'users', userDocId), { 
                              role: newRoleVal,
                              status: 'APPROVED',
                              ...defaultPerms
                            });
                            alert(`¡Rol y permisos de ${u.displayName || u.email} actualizados a ${newRoleVal}!`);
                          } catch (err) {
                            handleFirestoreError(err, OperationType.UPDATE, `users/${userDocId}`);
                          }
                        }}
                        className="bg-stone-900 border border-stone-800 px-3 py-2 rounded-lg font-black text-xs text-amber-500 outline-none cursor-pointer focus:border-amber-500 uppercase tracking-wide"
                      >
                        <option value="SUPER_ADMIN">Super Admin (Pablo)</option>
                        <option value="ADMIN">Administrador</option>
                        <option value="ADMIN_PROD">Admin Prod (Doris)</option>
                        <option value="OPS_LEON">Operaciones (León)</option>
                        <option value="OPERACIONES">Operaciones</option>
                        <option value="SALES">Ventas (Matias / Equipo)</option>
                        <option value="VENTAS">Ventas</option>
                        <option value="PRODUCCION">Producción (Taller)</option>
                        <option value="LOGISTICA">Logística</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Granular Permission Flags Toggle Panel */}
                <div className="pt-3 border-t border-stone-900 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await updateDoc(doc(db, 'users', userDocId), { canExport: !u.canExport });
                      } catch (e) { handleFirestoreError(e, OperationType.UPDATE, `users/${userDocId}`); }
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition flex items-center justify-between cursor-pointer ${
                      u.canExport ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'bg-stone-900 border-stone-800 text-stone-600'
                    }`}
                  >
                    <span>Exportar CSV</span>
                    <span className="font-mono">{u.canExport ? 'SI' : 'NO'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await updateDoc(doc(db, 'users', userDocId), { canEditPrices: !u.canEditPrices });
                      } catch (e) { handleFirestoreError(e, OperationType.UPDATE, `users/${userDocId}`); }
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition flex items-center justify-between cursor-pointer ${
                      u.canEditPrices ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'bg-stone-900 border-stone-800 text-stone-600'
                    }`}
                  >
                    <span>Editar Precios</span>
                    <span className="font-mono">{u.canEditPrices ? 'SI' : 'NO'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await updateDoc(doc(db, 'users', userDocId), { canManageRoles: !u.canManageRoles });
                      } catch (e) { handleFirestoreError(e, OperationType.UPDATE, `users/${userDocId}`); }
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition flex items-center justify-between cursor-pointer ${
                      u.canManageRoles ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'bg-stone-900 border-stone-800 text-stone-600'
                    }`}
                  >
                    <span>Gestionar Roles</span>
                    <span className="font-mono">{u.canManageRoles ? 'SI' : 'NO'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await updateDoc(doc(db, 'users', userDocId), { canAccessDangerZone: !u.canAccessDangerZone });
                      } catch (e) { handleFirestoreError(e, OperationType.UPDATE, `users/${userDocId}`); }
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition flex items-center justify-between cursor-pointer ${
                      u.canAccessDangerZone ? 'bg-rose-500/10 border-rose-500/40 text-rose-400' : 'bg-stone-900 border-stone-800 text-stone-600'
                    }`}
                  >
                    <span>Zona Peligro</span>
                    <span className="font-mono">{u.canAccessDangerZone ? 'SI' : 'NO'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        db={db}
        onSuccess={(provisionedEmail) => {
          setSuccessToast(`Usuario ${provisionedEmail} pre-provisionado con éxito. Su perfil se vinculará automáticamente al autenticarse.`);
        }}
      />
    </div>
  );
};
