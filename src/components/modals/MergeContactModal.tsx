import React from 'react';
import { GitMerge, X, AlertTriangle, Merge } from 'lucide-react';
import { doc, getDoc, setDoc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';

export const MergeContactModal = ({
  showMergeContactModal,
  setShowMergeContactModal,
  onClose,
  mergeSourceContact,
  setMergeSourceContact,
  mergeTargetContactId: passedTargetId,
  setMergeTargetContactId: setPassedTargetId,
  masterContacts,
  handleMergeContacts,
  directoryContacts = [],
  db,
  user,
  orders = [],
  setContactSuccessMsg
}: any) => {
  const [localMergeTargetContactId, setLocalMergeTargetContactId] = React.useState('');
  const [isMergingInProgress, setIsMergingInProgress] = React.useState(false);

  const mergeTargetContactId = passedTargetId !== undefined ? passedTargetId : localMergeTargetContactId;
  const setMergeTargetContactId = setPassedTargetId || setLocalMergeTargetContactId;

  const handleClose = () => {
    if (setShowMergeContactModal) setShowMergeContactModal(false);
    if (onClose) onClose();
  };

  if (!mergeSourceContact) return null;
  if (showMergeContactModal !== undefined && !showMergeContactModal) return null;
  return (
    
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-stone-800 pb-4">
              <div>
                <h3 className="text-xl font-black text-stone-200 uppercase tracking-tighter flex items-center gap-2">
                  <Merge size={20} className="text-emerald-400" /> Fusionar Contactos
                </h3>
                <p className="text-xs text-stone-400 mt-1">Combina contactos duplicados y transfiere su historial de pedidos de forma segura.</p>
              </div>
              <button onClick={() => setShowMergeContactModal(false)} className="text-stone-500 hover:text-white transition"><X size={24} /></button>
            </div>

            <div className="space-y-6">
              {/* Pasos */}
              <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-3">
                <p className="text-[10px] font-black uppercase text-stone-500 tracking-widest">Contacto de Origen (Será Eliminado)</p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-stone-200 uppercase">{mergeSourceContact.fullName || mergeSourceContact.contactId}</p>
                    <p className="text-xs text-stone-400 font-mono mt-0.5">{mergeSourceContact.contactId} • {mergeSourceContact.email || 'Sin email'} • {mergeSourceContact.phone || 'Sin teléfono'}</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-amber-950 text-amber-400 border border-amber-900/30 text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider">Origen</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Seleccionar Contacto de Destino (Se Conservará)</label>
                <select
                  value={mergeTargetContactId}
                  onChange={(e) => setMergeTargetContactId(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-emerald-500 outline-none text-xs font-bold text-stone-300"
                >
                  <option value="">-- SELECCIONAR CONTACTO DE DESTINO --</option>
                  {directoryContacts
                    .filter(c => c.contactId !== mergeSourceContact.contactId && (c.fullName || '').toLowerCase().trim() !== (mergeSourceContact.fullName || '').toLowerCase().trim())
                    .map(c => (
                      <option key={c.contactId} value={c.contactId}>
                        {c.fullName || c.contactId} ({c.contactId})
                      </option>
                    ))
                  }
                </select>
              </div>

              {/* Vista previa de fusión side-by-side si se selecciona un destino */}
              {(() => {
                const target = directoryContacts.find(c => c.contactId === mergeTargetContactId);
                if (!target) return null;

                const combinedSizing = {
                  ...(mergeSourceContact.sizingMatrix || {}),
                  ...(target.sizingMatrix || {})
                };

                return (
                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase text-stone-500 tracking-widest">Vista Previa de Fusión</p>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Izquierda: Detalles del Destino */}
                      <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-2">
                        <p className="text-[10px] font-black uppercase text-stone-500 tracking-widest border-b border-stone-800/50 pb-1">Destino Actual</p>
                        <p className="text-xs font-bold text-stone-300 uppercase">{target.fullName}</p>
                        <p className="text-[11px] text-stone-400">Tel: {target.phone || <span className="text-stone-600 italic">No registrado</span>}</p>
                        <p className="text-[11px] text-stone-400">Email: {target.email || <span className="text-stone-600 italic">No registrado</span>}</p>
                        <p className="text-[11px] text-stone-400">Rol: {target.role || <span className="text-stone-600 italic">No registrado</span>}</p>
                        <p className="text-[11px] text-stone-400">Medidas: {target.sizingMatrix && Object.keys(target.sizingMatrix).length > 0 ? `${Object.keys(target.sizingMatrix).length} registradas` : <span className="text-stone-600 italic">Sin medidas</span>}</p>
                      </div>

                      {/* Derecha: Resultado Final Fusionado */}
                      <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-900/30 space-y-2">
                        <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest border-b border-emerald-900/20 pb-1">Resultado Final Conservado</p>
                        <p className="text-xs font-bold text-stone-200 uppercase">{target.fullName}</p>
                        <p className="text-[11px] text-stone-300">
                          Tel: {target.phone || mergeSourceContact.phone || <span className="text-stone-500 italic">No registrado</span>}
                          {(!target.phone && mergeSourceContact.phone) && <span className="text-emerald-400 text-[9px] font-bold ml-1.5 uppercase tracking-wider">(Importado)</span>}
                        </p>
                        <p className="text-[11px] text-stone-300">
                          Email: {target.email || mergeSourceContact.email || <span className="text-stone-500 italic">No registrado</span>}
                          {(!target.email && mergeSourceContact.email) && <span className="text-emerald-400 text-[9px] font-bold ml-1.5 uppercase tracking-wider">(Importado)</span>}
                        </p>
                        <p className="text-[11px] text-stone-300">
                          Rol: {target.role || mergeSourceContact.role || <span className="text-stone-500 italic">No registrado</span>}
                          {(!target.role && mergeSourceContact.role) && <span className="text-emerald-400 text-[9px] font-bold ml-1.5 uppercase tracking-wider">(Importado)</span>}
                        </p>
                        <p className="text-[11px] text-stone-300">
                          Medidas: {Object.keys(combinedSizing).length > 0 ? `${Object.keys(combinedSizing).length} medidas combinadas` : <span className="text-stone-500 italic">Sin medidas</span>}
                          {(Object.keys(combinedSizing).length > (target.sizingMatrix ? Object.keys(target.sizingMatrix).length : 0)) && <span className="text-emerald-400 text-[9px] font-bold ml-1.5 uppercase tracking-wider">(Actualizado)</span>}
                        </p>
                      </div>
                    </div>

                    <div className="bg-stone-950/40 p-4 rounded-xl border border-stone-800 text-[11px] text-stone-400 space-y-1.5">
                      <p className="font-bold text-stone-300">Consecuencias de la Fusión:</p>
                      <p>1. Se conservará el contacto <strong className="text-stone-200">{target.fullName} ({target.contactId})</strong> con la información combinada.</p>
                      <p>2. El contacto <strong className="text-stone-200">{mergeSourceContact.fullName} ({mergeSourceContact.contactId})</strong> se eliminará de la base de datos.</p>
                      <p>3. Todas las órdenes asociadas a {mergeSourceContact.fullName} se reasignarán automáticamente a {target.fullName} en Firestore.</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex gap-4 mt-8 border-t border-stone-800 pt-6">
              <button
                type="button"
                disabled={isMergingInProgress}
                onClick={() => setShowMergeContactModal(false)}
                className="flex-1 border border-stone-700 text-stone-300 hover:bg-stone-800 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!mergeTargetContactId || isMergingInProgress}
                onClick={async () => {
                  try {
                    setIsMergingInProgress(true);
                    const target = directoryContacts.find(c => c.contactId === mergeTargetContactId);
                    if (!target) {
                      alert('Contacto destino no encontrado.');
                      return;
                    }

                    let targetDocId = target.originalDocId || target.id || target.contactId;

                    // Step 1: If Target doesn't exist in masterContacts, promote/create it first.
                    if (!target.originalDocId) {
                      const targetData = {
                        contactId: target.contactId,
                        accountId: target.accountId || '',
                        contactNombre: target.firstName || target.contactNombre || target.fullName.split(' ')[0] || '',
                        contactApellido: target.lastName || target.contactApellido || target.fullName.split(' ').slice(1).join(' ') || '',
                        fullName: target.fullName,
                        role: target.role || '',
                        phone: target.phone || '',
                        email: target.email || '',
                        sizingMatrix: target.sizingMatrix || {},
                        createdAt: Date.now(),
                        createdBy: user?.uid || ''
                      };
                      await setDoc(doc(db, 'masterContacts', targetDocId), targetData);
                    }

                    // Step 2: Merge non-empty fields from Source into Target
                    const combinedSizing = {
                      ...(mergeSourceContact.sizingMatrix || {}),
                      ...(target.sizingMatrix || {})
                    };

                    const updatedTargetData = {
                      phone: target.phone || mergeSourceContact.phone || '',
                      email: target.email || mergeSourceContact.email || '',
                      role: target.role || mergeSourceContact.role || '',
                      accountId: target.accountId || mergeSourceContact.accountId || '',
                      sizingMatrix: combinedSizing,
                      updatedAt: Date.now()
                    };

                    await updateDoc(doc(db, 'masterContacts', targetDocId), updatedTargetData);

                    // Step 3: Reassign orders from Source to Target in a batch
                    const batch = writeBatch(db);
                    let opCount = 0;

                    const ordersToUpdate = orders.filter(o => 
                      (o.customer || '').toLowerCase().trim() === (mergeSourceContact.fullName || '').toLowerCase().trim() ||
                      o.contactId === mergeSourceContact.contactId ||
                      (mergeSourceContact.legacyId && (o.customer || '').toLowerCase().trim() === (mergeSourceContact.legacyId || '').toLowerCase().trim())
                    );

                    ordersToUpdate.forEach(o => {
                      const orderRef = doc(db, 'orders', o.id);
                      batch.update(orderRef, {
                        customer: target.fullName,
                        customerFirstName: target.firstName || target.contactNombre || target.fullName.split(' ')[0] || '',
                        customerLastName: target.lastName || target.contactApellido || target.fullName.split(' ').slice(1).join(' ') || '',
                        contactId: target.contactId,
                        updatedAt: Date.now()
                      });
                      opCount++;
                    });

                    // Step 4: Delete the source master contact if it exists
                    if (mergeSourceContact.originalDocId) {
                      batch.delete(doc(db, 'masterContacts', mergeSourceContact.originalDocId));
                      opCount++;
                    }

                    if (opCount > 0) {
                      await batch.commit();
                    }

                    setContactSuccessMsg('Contactos fusionados y órdenes actualizadas exitosamente.');
                    setTimeout(() => setContactSuccessMsg(''), 3000);
                    setShowMergeContactModal(false);
                  } catch (err: any) {
                    alert('Error al fusionar contactos: ' + err.message);
                  } finally {
                    setIsMergingInProgress(false);
                  }
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isMergingInProgress ? 'Fusionando...' : 'Confirmar Fusión'}
              </button>
            </div>
          </div>
        </div>
      
  );
};
