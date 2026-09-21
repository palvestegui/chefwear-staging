import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';

interface DeleteContactModalProps {
  deleteTargetContact: any;
  onClose: () => void;
  setContactSuccessMsg: (msg: string) => void;
  db: any;
}

export const DeleteContactModal: React.FC<DeleteContactModalProps> = ({ deleteTargetContact, onClose, setContactSuccessMsg, db }) => {
  return (
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-stone-200 uppercase tracking-tighter flex items-center gap-2">
            <AlertCircle className="text-red-500" />
            Eliminar Contacto
          </h3>
          <button onClick={onClose} className="text-stone-500 hover:text-white transition bg-stone-800 hover:bg-stone-700 p-2 rounded-xl"><X size={20} /></button>
        </div>
        <p className="text-stone-400 text-sm mb-6">
          ¿Estás seguro que deseas eliminar el contacto <strong className="text-white">{deleteTargetContact.name}</strong>?
          Esta acción no se puede deshacer y el contacto será removido del directorio maestro.
        </p>
        <div className="flex gap-4">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 border border-stone-700 text-stone-300 hover:bg-stone-800 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition"
          >
            Cancelar
          </button>
          <button 
            type="button" 
            onClick={async () => {
              try {
                const targetId = deleteTargetContact.originalDocId || deleteTargetContact.id || deleteTargetContact.contactId;
                if (!targetId) {
                  alert('ID de contacto no encontrado.');
                  return;
                }
                await deleteDoc(doc(db, 'masterContacts', targetId));
                setContactSuccessMsg('Contacto eliminado exitosamente.');
                setTimeout(() => setContactSuccessMsg(''), 3000);
                onClose();
              } catch (err: any) {
                alert('Error al eliminar contacto: ' + err.message);
              }
            }} 
            className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition shadow-lg"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};
