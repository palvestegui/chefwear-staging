import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import { showSuccessToast, showErrorToast } from '../../utils/toastUtils';
import { Merge } from 'lucide-react';

export const InlineMergeContactModal = ({
  contact,
  onClose,
  onSuccess
}: {
  contact: any;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [masterContacts, setMasterContacts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [isMerging, setIsMerging] = useState(false);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const q = query(collection(db, 'masterContacts'));
        const snap = await getDocs(q);
        const contacts = snap.docs
          .map(d => ({ id: d.id, ...(d.data() as any) }))
          .filter(c => c.id !== contact.id && c.id !== contact.contactId && (c.fullName || c.name || c.displayName));
        setMasterContacts(contacts);
      } catch (err) {
        console.error(err);
      }
    };
    fetchContacts();
  }, [contact]);

  const filteredContacts = masterContacts.filter(c => {
    const term = searchTerm.toLowerCase();
    const name = String(c.fullName || c.name || c.displayName || '').toLowerCase();
    const company = String(c.companyName || '').toLowerCase();
    return name.includes(term) || company.includes(term);
  });

  const handleMerge = async () => {
    if (!selectedTargetId) return;
    setIsMerging(true);
    try {
      const targetContact = masterContacts.find(c => c.id === selectedTargetId);
      if (!targetContact) throw new Error("Contacto destino no encontrado.");

      const targetContactName = targetContact.fullName || targetContact.name || targetContact.displayName || 'Desconocido';
      const sourceContactId = contact.id || contact.contactId;

      if (!sourceContactId) throw new Error("ID de contacto origen inválido.");

      const batch = writeBatch(db);

      const ordersQ = query(collection(db, 'orders'));
      const ordersSnap = await getDocs(ordersQ);
      
      let updatedCount = 0;
      ordersSnap.forEach(d => {
        const oData = d.data();
        if (oData.contactId === sourceContactId) {
          batch.update(doc(db, 'orders', d.id), {
            contactId: targetContact.id,
            clientName: targetContactName,
            customer: targetContactName
          });
          updatedCount++;
        }
      });

      batch.delete(doc(db, 'masterContacts', sourceContactId));

      await batch.commit();
      showSuccessToast('✓ ¡Contactos fusionados con éxito!');
      onSuccess();
    } catch (err: any) {
      console.error(err);
      showErrorToast('Error al fusionar: ' + err.message);
    } finally {
      setIsMerging(false);
    }
  };

  const contactName = contact.fullName || contact.name || contact.displayName || 'el contacto';

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isMerging && onClose()}></div>
      <div className="relative bg-stone-900 border border-amber-900/50 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        <h3 className="text-lg font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2 shrink-0">
          <Merge size={20} className="text-amber-500" />
          ¿Fusionar a {contactName} con otro contacto?
        </h3>
        <p className="text-sm text-stone-400 mb-6 leading-relaxed font-medium shrink-0">
          Todos los pedidos y cotizaciones asociados a este perfil se transferirán al contacto principal seleccionado, y este perfil duplicado será eliminado permanentemente.
        </p>

        <div className="flex-1 min-h-0 flex flex-col mb-8 overflow-hidden">
          <div className="shrink-0 mb-4">
            <label className="block text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">Buscar Contacto Principal</label>
            <input
              type="text"
              placeholder="Escribe para buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 text-white rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {filteredContacts.length === 0 ? (
              <div className="text-stone-500 text-xs text-center py-4">No se encontraron contactos.</div>
            ) : (
              filteredContacts.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedTargetId(c.id)}
                  className={`w-full text-left p-3 rounded-xl border text-sm transition flex flex-col gap-1 ${
                    selectedTargetId === c.id
                      ? 'bg-amber-950/40 border-amber-500/50 text-amber-100'
                      : 'bg-stone-950 border-stone-800 text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  <span className="font-bold">{c.fullName || c.name || c.displayName}</span>
                  {c.companyName && <span className="text-xs text-stone-500">{c.companyName}</span>}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isMerging}
            className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-300 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isMerging || !selectedTargetId}
            onClick={handleMerge}
            className="flex-1 bg-amber-600 hover:bg-amber-500 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isMerging ? 'Fusionando...' : 'Confirmar Fusión'}
          </button>
        </div>
      </div>
    </div>
  );
};
