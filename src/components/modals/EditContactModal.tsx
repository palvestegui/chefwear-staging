import React from 'react';
import { X, Save } from 'lucide-react';
import { doc, updateDoc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { TAILORING_12_POINTS, normalizeName } from '../../utils/contactUtils';
import { isUpperTailored, isLowerTailored, isBundleGarment } from '../../utils/garmentMeasurementUtils';

export const EditContactModal = ({
  onClose,
  editingMasterContact,
  setEditingMasterContact,
  clientAccounts,
  requiredFields,
  fieldLabels,
  db,
  setContactSuccessMsg,
  CONTACT_ROLES,
  getRolesForAccountType,
  normalizeAccountType,
  normalizeRole,
  accountContacts
}: any) => {
  const setShowEditContactModal = (val: boolean) => { if(!val) onClose(); };

  const [isPantalonWaistOverridden, setIsPantalonWaistOverridden] = React.useState<boolean>(() => {
    const matrix = editingMasterContact?.sizingMatrix || editingMasterContact?.sizingMatrix12PtCM || editingMasterContact?.measurements || {};
    const fVal = matrix.F_Cintura ?? matrix.cintura ?? '';
    const pVal = matrix.P_Cintura ?? '';
    return Boolean(pVal && fVal && pVal !== fVal);
  });

  return (
    
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-3 sm:p-4 md:p-6">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 w-[95vw] max-w-[1700px] mx-auto max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-stone-200 uppercase tracking-tighter">Editar Contacto</h3>
              <button onClick={() => setShowEditContactModal(false)} className="text-stone-500 hover:text-white transition"><X size={24} /></button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                // Ensure Contact_ID is used.
                let targetId = editingMasterContact.originalDocId || editingMasterContact.contactId;
                if (!targetId) {
                  alert('ID de contacto no encontrado.');
                  return;
                }
                
                const splitName = (editingMasterContact.fullName || '').trim().split(' ');
                const nombre = editingMasterContact.contactNombre || splitName[0] || '';
                const apellido = editingMasterContact.contactApellido || splitName.slice(1).join(' ') || '';

                // Calculate the true displayed role to ensure we save exactly what the UI shows
                const selectedAcc = clientAccounts.find((a) => a.accountId === editingMasterContact.accountId);
                const roles = getRolesForAccountType(selectedAcc?.accountType);
                let finalRole = editingMasterContact.role || 'OTRO';
                if (!roles.includes(finalRole)) {
                  finalRole = normalizeRole(finalRole, selectedAcc?.accountType);
                }
                const actualRoleToSave = roles.includes(finalRole) ? finalRole : (roles[0] || 'OTRO');

                const sizing = editingMasterContact.sizingMatrix || editingMasterContact.sizingMatrix12PtCM || editingMasterContact.measurements || {};
                const contactData = {
                  contactId: editingMasterContact.contactId,
                  accountId: editingMasterContact.accountId || '',
                  contactNombre: nombre,
                  contactApellido: apellido,
                  fullName: editingMasterContact.fullName,
                  role: actualRoleToSave,
                  phone: editingMasterContact.phone || '',
                  email: editingMasterContact.email || '',
                  socials: editingMasterContact.socials || {},
                  sizingMatrix: sizing,
                  sizingMatrix12PtCM: sizing,
                  updatedAt: Date.now()
                };

                await setDoc(doc(db, 'masterContacts', targetId), contactData, { merge: true });

                // Update the primary link in account_contacts so it reflects in the Directory
                const existingLinks = accountContacts.filter(ac => ac.contactId === editingMasterContact.contactId);
                const activeLink = existingLinks.find(ac => ac.isPrimary) || existingLinks[0];
                if (activeLink) {
                    await setDoc(doc(db, 'account_contacts', activeLink.linkId || activeLink.id), {
                        accountId: contactData.accountId,
                        role: contactData.role
                    }, { merge: true });
                } else {
                    // Create one if missing
                    const counterRef = doc(db, 'metadata', 'linkCounter');
                    const counterDoc = await getDoc(counterRef);
                    let currentSeq = 1;
                    if (counterDoc.exists() && typeof counterDoc.data()?.currentSequence === 'number') {
                        currentSeq = counterDoc.data().currentSequence + 1;
                    }
                    const newLinkId = `LNK-${String(currentSeq).padStart(5, '0')}`;
                    await setDoc(doc(db, 'account_contacts', newLinkId), {
                        linkId: newLinkId,
                        contactId: editingMasterContact.contactId,
                        accountId: contactData.accountId,
                        role: contactData.role,
                        isPrimary: true,
                        createdAt: Date.now()
                    });
                    await setDoc(counterRef, { currentSequence: currentSeq }, { merge: true });
                }

                // Cascade updated measurements to all active production orders for this customer
                const activeStatuses = ['Inventario Pendiente', 'Material Listo', 'En Confección', 'En Producción', 'Medidas Pendientes', 'Orden Activa'];
                const ordersRef = collection(db, 'orders');
                const activeOrdersQuery = query(ordersRef, where('status', 'in', activeStatuses));
                const activeOrdersSnap = await getDocs(activeOrdersQuery);

                const orderBatchUpdates: Promise<void>[] = [];
                activeOrdersSnap.forEach((orderDoc) => {
                  const orderData = orderDoc.data();
                  const isMatch = (orderData.contactId && orderData.contactId === editingMasterContact.contactId) ||
                                  (normalizeName(orderData.customer || orderData.client || '') === normalizeName(editingMasterContact.fullName || ''));

                  if (isMatch) {
                    const existingSizing = orderData.sizingMatrix || orderData.sizingMatrix12PtCM || orderData.measurements || {};
                    const updatedOrderSizing = { ...existingSizing, ...contactData.sizingMatrix };

                    const updatedItems = ((orderData.items as Array<Record<string, unknown>>) || []).map((item: Record<string, unknown>) => {
                      const itemName = String(item.name || '');

                      if (isUpperTailored(itemName) || isBundleGarment(itemName)) {
                        return {
                          ...item,
                          customMeasurements: { ...((item.customMeasurements as Record<string, unknown>) || {}), ...contactData.sizingMatrix },
                          measurements: { ...((item.measurements as Record<string, unknown>) || {}), ...contactData.sizingMatrix }
                        };
                      }

                      if (isLowerTailored(itemName)) {
                        return {
                          ...item,
                          customMeasurements: { ...((item.customMeasurements as Record<string, unknown>) || {}), ...contactData.sizingMatrix },
                          measurements: { ...((item.measurements as Record<string, unknown>) || {}), ...contactData.sizingMatrix }
                        };
                      }

                      // Unitalla garments (Mandil, Gorro, Delantal, Guardapolvo, Accesorios):
                      // Explicitly remove accidental measurements
                      const cleanItem = { ...item };
                      delete cleanItem.customMeasurements;
                      delete cleanItem.measurements;
                      return cleanItem;
                    });

                    orderBatchUpdates.push(
                      updateDoc(doc(db, 'orders', orderDoc.id), {
                        sizingMatrix: updatedOrderSizing,
                        sizingMatrix12PtCM: updatedOrderSizing,
                        items: updatedItems,
                        updatedAt: Date.now()
                      })
                    );
                  }
                });

                if (orderBatchUpdates.length > 0) {
                  await Promise.all(orderBatchUpdates);
                }

                setContactSuccessMsg('Contacto actualizado exitosamente.');
                setTimeout(() => setContactSuccessMsg(''), 3000);
                
                setShowEditContactModal(false);
              } catch(err: unknown) {
                const errMsg = err instanceof Error ? err.message : String(err);
                alert('Error al guardar: ' + errMsg);
              }
            }}>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Left Column: Account Details & Socials */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Contact ID (Bloqueado)</label>
                      <input type="text" value={editingMasterContact.contactId} disabled className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl text-xs font-black text-stone-500 opacity-70 cursor-not-allowed" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Cuenta Vinculada</label>
                      <select 
                        value={editingMasterContact.accountId || ''}
                        onChange={(e) => setEditingMasterContact({...editingMasterContact, accountId: e.target.value})}
                        className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-emerald-500 outline-none text-xs font-bold text-stone-300"
                      >
                        <option value="">NINGUNA (Null)</option>
                        {clientAccounts.map(a => (
                          <option key={a.accountId} value={a.accountId}>{a.accountName} ({a.accountId})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Nombre Completo</label>
                      <input 
                        type="text" 
                        required
                        value={editingMasterContact.fullName || ''}
                        onChange={(e) => setEditingMasterContact({...editingMasterContact, fullName: e.target.value})}
                        className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-emerald-500 outline-none text-xs font-bold text-stone-300"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                        Rol / Cargo ({normalizeAccountType(clientAccounts.find(a => a.accountId === editingMasterContact.accountId)?.accountType)})
                      </label>
                      {(() => {
                        const selectedAcc = clientAccounts.find(a => a.accountId === editingMasterContact.accountId);
                        const roles = getRolesForAccountType(selectedAcc?.accountType);
                        let currentRole = editingMasterContact.role || 'OTRO';
                        if (!roles.includes(currentRole)) {
                          currentRole = normalizeRole(currentRole, selectedAcc?.accountType);
                        }

                        return (
                          <select 
                            value={roles.includes(currentRole) ? currentRole : (roles[0] || 'OTRO')}
                            onChange={(e) => setEditingMasterContact({...editingMasterContact, role: e.target.value})}
                            className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-emerald-500 outline-none text-xs font-bold text-stone-300"
                          >
                            {roles.map(r => <option key={r} value={r}>{r}</option>)}
                            {!roles.includes(currentRole) && <option value={currentRole}>{currentRole}</option>}
                          </select>
                        );
                      })()}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Teléfono</label>
                        <input 
                          type="text" 
                          value={editingMasterContact.phone || ''}
                          onChange={(e) => setEditingMasterContact({...editingMasterContact, phone: e.target.value})}
                          className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-emerald-500 outline-none text-xs font-bold text-stone-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Email</label>
                        <input 
                          type="email" 
                          value={editingMasterContact.email || ''}
                          onChange={(e) => setEditingMasterContact({...editingMasterContact, email: e.target.value})}
                          className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl focus:border-emerald-500 outline-none text-xs font-bold text-stone-300"
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
                            value={editingMasterContact.socials?.instagram || ''} 
                            onChange={e => setEditingMasterContact({
                              ...editingMasterContact, 
                              socials: { ...(editingMasterContact.socials || {}), instagram: e.target.value }
                            })} 
                            className="w-full bg-stone-900 border border-stone-800 p-2 rounded-xl text-xs text-stone-300 focus:border-amber-500 outline-none" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-stone-400">Facebook</label>
                          <input 
                            type="text" 
                            placeholder="usuario o URL"
                            value={editingMasterContact.socials?.facebook || ''} 
                            onChange={e => setEditingMasterContact({
                              ...editingMasterContact, 
                              socials: { ...(editingMasterContact.socials || {}), facebook: e.target.value }
                            })} 
                            className="w-full bg-stone-900 border border-stone-800 p-2 rounded-xl text-xs text-stone-300 focus:border-amber-500 outline-none" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-stone-400">TikTok</label>
                          <input 
                            type="text" 
                            placeholder="@usuario o URL"
                            value={editingMasterContact.socials?.tiktok || ''} 
                            onChange={e => setEditingMasterContact({
                              ...editingMasterContact, 
                              socials: { ...(editingMasterContact.socials || {}), tiktok: e.target.value }
                            })} 
                            className="w-full bg-stone-900 border border-stone-800 p-2 rounded-xl text-xs text-stone-300 focus:border-amber-500 outline-none" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-stone-400">Sitio Web</label>
                          <input 
                            type="text" 
                            placeholder="https://ejemplo.com"
                            value={editingMasterContact.socials?.website || ''} 
                            onChange={e => setEditingMasterContact({
                              ...editingMasterContact, 
                              socials: { ...(editingMasterContact.socials || {}), website: e.target.value }
                            })} 
                            className="w-full bg-stone-900 border border-stone-800 p-2 rounded-xl text-xs text-stone-300 focus:border-amber-500 outline-none" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Sizing Matrix */}
                  <div className="space-y-4">
                    <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 h-full flex flex-col justify-between">
                      <div>
                        <h4 className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-4">Sizing_Matrix_12Pt_CM (Medidas)</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {TAILORING_12_POINTS.map(m => {
                            const matrix = editingMasterContact.sizingMatrix || editingMasterContact.sizingMatrix12PtCM || editingMasterContact.measurements || {};
                            const stripped = m.key.replace(/^[FP]_/, '');
                            const camel = stripped.charAt(0).toLowerCase() + stripped.slice(1).replace(/_([a-z])/gi, (_, letter) => letter.toUpperCase());
                            const val = matrix[m.key] ?? (m.alt ? matrix[m.alt] : undefined) ?? matrix[camel] ?? matrix[stripped] ?? matrix[stripped.toLowerCase()] ?? '';
                            return (
                            <div key={m.key} className="flex flex-col">
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[9px] font-bold text-stone-400">{m.label}</label>
                                {m.key === 'P_Cintura' && isPantalonWaistOverridden && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setIsPantalonWaistOverridden(false);
                                      setEditingMasterContact((prev: any) => {
                                        const curMatrix = prev.sizingMatrix || prev.sizingMatrix12PtCM || prev.measurements || {};
                                        const fWaist = curMatrix.F_Cintura ?? curMatrix.cintura ?? '';
                                        const updated = {
                                          ...curMatrix,
                                          P_Cintura: fWaist,
                                          ...(m.alt ? { [m.alt]: fWaist } : {})
                                        };
                                        return {
                                          ...prev,
                                          sizingMatrix: updated,
                                          sizingMatrix12PtCM: updated
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
                              <div className="relative">
                                <input 
                                  type="number" 
                                  step="0.1"
                                  value={val}
                                  onChange={e => {
                                    const v = e.target.value;
                                    if (m.key === 'P_Cintura') {
                                      setIsPantalonWaistOverridden(true);
                                    }
                                    setEditingMasterContact((prev: any) => {
                                      const curMatrix = prev.sizingMatrix || prev.sizingMatrix12PtCM || prev.measurements || {};
                                      const updated = {
                                        ...curMatrix,
                                        [m.key]: v,
                                        ...(m.alt ? { [m.alt]: v } : {})
                                      };
                                      // Anatomical Waist Pairing: auto-populate P_Cintura when F_Cintura is changed if not overridden
                                      if (m.key === 'F_Cintura' && !isPantalonWaistOverridden) {
                                        updated.P_Cintura = v;
                                      }
                                      return {
                                        ...prev,
                                        sizingMatrix: updated,
                                        sizingMatrix12PtCM: updated
                                      };
                                    });
                                  }}
                                  className="w-full bg-stone-900 border border-stone-800 px-2 py-1.5 rounded-lg text-xs font-mono text-stone-300 focus:border-emerald-500 outline-none"
                                  placeholder="--"
                                />
                                <span className="absolute right-2 top-1.5 text-[9px] font-bold text-stone-500">cm</span>
                              </div>
                            </div>
                          );})}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-stone-800">
                  <button type="button" onClick={() => setShowEditContactModal(false)} className="flex-1 border border-stone-700 text-stone-300 hover:bg-stone-800 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition shadow-lg flex items-center justify-center gap-2">
                    <Save size={14}/> Guardar Cambios
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      
  );
};
