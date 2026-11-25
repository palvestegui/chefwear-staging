import React from 'react';
import { ImageIcon, Trash2 } from 'lucide-react';
import { compressImage } from '../../../utils/imageUtils';
import { OrderItem } from '../../../types';

export interface GarmentReferenceImagesProps {
  currentItem: OrderItem;
  setCurrentItem: React.Dispatch<React.SetStateAction<OrderItem>>;
}

export const GarmentReferenceImages: React.FC<GarmentReferenceImagesProps> = ({
  currentItem,
  setCurrentItem,
}) => {
  return (
    <div className="pt-4 border-t border-stone-800 text-left">
      <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-2">
        Imágenes de Referencia (Opcional)
      </label>

      {currentItem.referenceImages && currentItem.referenceImages.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {currentItem.referenceImages.map((img, idx) => (
            <div
              key={idx}
              className="relative group bg-stone-900 border border-stone-800 p-2 rounded-xl flex gap-2 items-center"
            >
              <img
                src={img.url}
                alt="Ref"
                className="w-10 h-10 object-cover rounded-lg border border-stone-800"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-stone-300 truncate">{img.note || 'Sin nota'}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = (currentItem.referenceImages || []).filter((_, i) => i !== idx);
                  setCurrentItem((prev) => ({ ...prev, referenceImages: updated }));
                }}
                className="text-stone-500 hover:text-red-400 p-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ej: Tono de color, tipo de cuello..."
            id="ref-img-note"
            className="flex-1 bg-stone-900 border border-stone-800 px-3 py-2 rounded-xl font-bold text-xs text-stone-200 outline-none focus:border-amber-500"
          />
          <label className="bg-stone-800 hover:bg-stone-700 text-stone-200 p-2.5 rounded-xl cursor-pointer flex items-center justify-center transition border border-stone-700">
            <ImageIcon size={16} />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const noteEl = document.getElementById('ref-img-note') as HTMLInputElement | null;
                const note = noteEl ? noteEl.value.trim() : '';
                const reader = new FileReader();
                reader.onloadend = async () => {
                  const base64 = reader.result as string;
                  const compressed = await compressImage(base64);
                  setCurrentItem((prev) => ({
                    ...prev,
                    referenceImages: [...(prev.referenceImages || []), { url: compressed, note }],
                  }));
                  if (noteEl) noteEl.value = '';
                };
                reader.readAsDataURL(file);
              }}
            />
          </label>
        </div>
        <span className="text-[9px] text-stone-600 font-bold">
          Agrega imágenes del cliente para referenciar color o diseño específico.
        </span>
      </div>
    </div>
  );
};
