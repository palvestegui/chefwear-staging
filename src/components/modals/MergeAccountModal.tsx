import React from 'react';
import { X, GitMerge, AlertCircle, ArrowRight, ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react';
import { doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { isSystemAccount } from '../../utils/constants';

interface MergeAccountModalProps {
  showMergeAccountModal: boolean;
  setShowMergeAccountModal: (val: boolean) => void;
  mergeSourceAccount: any;
  setMergeSourceAccount: (val: any) => void;
  mergeTargetAccountId: string;
  setMergeTargetAccountId: (val: string) => void;
  mergeAccountStep: number;
  setMergeAccountStep: (val: number) => void;
  isMergingInProgress: boolean;
  setIsMergingInProgress: (val: boolean) => void;
  clientAccounts: any[];
  directoryContacts: any[];
  orders: any[];
  db: any;
}

export const MergeAccountModal: React.FC<MergeAccountModalProps> = ({
  showMergeAccountModal,
  setShowMergeAccountModal,
  mergeSourceAccount,
  setMergeSourceAccount,
  mergeTargetAccountId,
  setMergeTargetAccountId,
  mergeAccountStep,
  setMergeAccountStep,
  isMergingInProgress,
  setIsMergingInProgress,
  clientAccounts = [],
  directoryContacts = [],
  orders = [],
  db
}) => {
  if (!showMergeAccountModal || !mergeSourceAccount) return null;

  const targetAccount = clientAccounts.find(a => a.accountId === mergeTargetAccountId);

  const handleMergeAction = async () => {
    try {
      setIsMergingInProgress(true);
      if (isSystemAccount(mergeSourceAccount.accountId)) {
        throw new Error('La cuenta de sistema ACC-000 está protegida y no puede ser eliminada o fusionada.');
      }
      if (!targetAccount) {
        throw new Error('No se ha seleccionado una cuenta de destino válida.');
      }

      const sourceAccountId = mergeSourceAccount.accountId;
      const sourceDocId = mergeSourceAccount.id || mergeSourceAccount.accountId;

      // 1. Move/reassign contacts associated with the source account
      const contactsToMove = directoryContacts.filter(
        (c: any) => c.accountId === sourceAccountId || (c.companyName && c.companyName.toLowerCase().trim() === (mergeSourceAccount.accountName || '').toLowerCase().trim())
      );

      for (const contact of contactsToMove) {
        const contactDocId = contact.id || contact.contactId;
        if (contactDocId) {
          const contactRef = doc(db, 'masterContacts', contactDocId);
          await setDoc(contactRef, {
            accountId: targetAccount.accountId,
            accountName: targetAccount.accountName,
            companyName: targetAccount.accountName
          }, { merge: true });
        }
      }

      // 2. Reassign orders associated with the source account
      const ordersToMove = orders.filter(
        (o: any) => o.accountId === sourceAccountId || 
                    (o.companyName && o.companyName.toLowerCase().trim() === (mergeSourceAccount.accountName || '').toLowerCase().trim())
      );

      for (const order of ordersToMove) {
        if (order.id) {
          const orderRef = doc(db, 'orders', order.id);
          await setDoc(orderRef, {
            accountId: targetAccount.accountId,
            companyName: targetAccount.accountName
          }, { merge: true });
        }
      }

      // 3. Reassign any child accounts pointing to the source account
      const childAccountsToMove = clientAccounts.filter(
        (a: any) => a.parentAccountId === sourceAccountId
      );
      for (const child of childAccountsToMove) {
        const childDocId = child.id || child.accountId;
        if (childDocId) {
          await updateDoc(doc(db, 'clientAccounts', childDocId), {
            parentAccountId: targetAccount.accountId
          });
        }
      }

      // 4. Delete the source account document(s)
      if (sourceDocId) {
        await deleteDoc(doc(db, 'clientAccounts', sourceDocId));
      }
      if (mergeSourceAccount.accountId && mergeSourceAccount.accountId !== sourceDocId) {
        try {
          await deleteDoc(doc(db, 'clientAccounts', mergeSourceAccount.accountId));
        } catch {
          // ignore if already deleted
        }
      }

      setMergeAccountStep(2);
    } catch (err: any) {
      console.error('Error during account merge:', err);
      alert('Error durante la fusión de cuentas: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsMergingInProgress(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6 border-b border-stone-800 pb-4">
          <div>
            <h3 className="text-xl font-black text-stone-200 uppercase tracking-tighter flex items-center gap-2">
              <GitMerge className="text-purple-500" />
              Fusionar Cuentas Cliente
            </h3>
            <p className="text-xs text-stone-500 font-bold mt-1">
              {mergeAccountStep === 0 && 'Selecciona la cuenta de destino para mover el historial.'}
              {mergeAccountStep === 1 && 'Confirmación requerida.'}
              {mergeAccountStep === 2 && 'Fusión completada con éxito.'}
            </p>
          </div>
          {mergeAccountStep !== 1 && mergeAccountStep !== 2 && (
            <button 
              type="button"
              onClick={() => setShowMergeAccountModal(false)} 
              className="text-stone-500 hover:text-white transition bg-stone-800 hover:bg-stone-700 p-2 rounded-xl"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {mergeAccountStep === 0 && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="bg-red-950/20 border border-red-900/30 p-4 rounded-2xl flex gap-4">
              <AlertCircle className="text-red-500 shrink-0 mt-1" size={24} />
              <div className="text-sm text-red-200">
                <p className="font-bold mb-1">¡Advertencia de Acción Destructiva!</p>
                <p className="text-red-400 text-xs">
                  Esta acción moverá todos los contactos, órdenes e historial de la cuenta de origen a la cuenta de destino. La cuenta de origen será <strong>eliminada permanentemente</strong>. Esto no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-stone-950 border border-stone-800 p-4 rounded-2xl opacity-70">
                <div className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <ArrowRight size={12} className="text-red-500"/> Origen (Se eliminará)
                </div>
                <div className="font-black text-stone-300 truncate">{mergeSourceAccount.accountName}</div>
                <div className="text-xs font-mono text-stone-500">{mergeSourceAccount.accountId}</div>
              </div>

              <div className="bg-stone-950 border border-purple-900/50 p-4 rounded-2xl shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <ArrowRight size={12} className="text-green-500"/> Destino (Se conservará)
                </div>
                <select 
                  value={mergeTargetAccountId}
                  onChange={e => setMergeTargetAccountId(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 p-2 rounded-xl focus:border-purple-500 outline-none text-xs font-bold text-stone-200"
                >
                  <option value="">-- SELECCIONAR DESTINO --</option>
                  {clientAccounts.filter(a => a.accountId !== mergeSourceAccount.accountId).map(a => (
                    <option key={a.accountId} value={a.accountId}>
                      {a.accountName} ({a.accountId})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              type="button"
              onClick={() => setMergeAccountStep(1)}
              disabled={!mergeTargetAccountId}
              className="w-full bg-purple-600 disabled:bg-stone-800 disabled:text-stone-500 hover:bg-purple-500 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-2xl transition disabled:cursor-not-allowed shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:shadow-none"
            >
              Continuar
            </button>
          </div>
        )}

        {mergeAccountStep === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="bg-stone-950 p-6 rounded-2xl border border-purple-500/30 text-center">
              <ShieldCheck size={48} className="text-purple-500 mx-auto mb-4" />
              <h4 className="text-white font-bold mb-2">Confirmar Fusión de Cuentas</h4>
              <p className="text-sm text-stone-400 mb-6">
                Estás a punto de fusionar <strong>{mergeSourceAccount.accountName}</strong> dentro de <strong>{targetAccount?.accountName}</strong>.
              </p>
              
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setMergeAccountStep(0)}
                  disabled={isMergingInProgress}
                  className="flex-1 border border-stone-700 text-stone-300 hover:bg-stone-800 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition"
                >
                  Volver
                </button>
                <button 
                  type="button"
                  onClick={handleMergeAction}
                  disabled={isMergingInProgress}
                  className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-stone-700 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition shadow-lg flex justify-center items-center gap-2"
                >
                  {isMergingInProgress ? <RefreshCw className="animate-spin" size={16} /> : 'Confirmar y Fusionar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {mergeAccountStep === 2 && (
          <div className="text-center py-8 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} className="text-green-500" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">Fusión Exitosa</h3>
            <p className="text-stone-400 text-sm mb-8">Las cuentas han sido unificadas y el historial reasignado correctamente.</p>
            <button 
              type="button"
              onClick={() => {
                setShowMergeAccountModal(false);
                setMergeAccountStep(0);
                setMergeTargetAccountId('');
                setMergeSourceAccount(null);
              }}
              className="bg-stone-800 hover:bg-stone-700 text-white py-3 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest transition"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
