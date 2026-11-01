import React, { useRef, useState } from 'react';
import { X, Plus, Trash2, UploadCloud, Image as ImageIcon, Loader2 } from 'lucide-react';
import { compressImage } from '../../utils/imageCompression';

const QUICK_PLACEMENTS = ['Gorro', 'Mandil', 'Pecho', 'Pierna', 'Espalda', 'Manga'];

export interface AccountBrandingSectionProps {
  logoEmbroidery: boolean;
  onToggleEmbroidery: (active: boolean) => void;
  logoUrls: string[];
  onChangeLogoUrls: (urls: string[]) => void;
  logoPlacements: string[];
  onChangeLogoPlacements: (placements: string[]) => void;
}

export const AccountBrandingSection: React.FC<AccountBrandingSectionProps> = ({
  logoEmbroidery,
  onToggleEmbroidery,
  logoUrls,
  onChangeLogoUrls,
  logoPlacements,
  onChangeLogoPlacements
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    setUploadError(null);
    try {
      const compressedList: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressed = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.82 });
        compressedList.push(compressed);
      }
      onChangeLogoUrls([...logoUrls, ...compressedList]);
    } catch (err) {
      console.error('[AccountBrandingSection] Error al procesar imágenes:', err);
      setUploadError('Error al comprimir una o más imágenes.');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = (indexToRemove: number) => {
    onChangeLogoUrls(logoUrls.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddPlacement = (placement: string) => {
    if (placement.trim() && logoPlacements.includes(placement.trim())) return;
    onChangeLogoPlacements([...logoPlacements, placement]);
  };

  const handleRemovePlacement = (indexToRemove: number) => {
    onChangeLogoPlacements(logoPlacements.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUpdatePlacement = (index: number, val: string) => {
    const next = [...logoPlacements];
    next[index] = val;
    onChangeLogoPlacements(next);
  };

  return (
    <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
          3. Branding & Bordados
        </span>
        <label className="flex items-center gap-2 cursor-pointer">
          <span
            className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase transition ${
              logoEmbroidery
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-stone-900 text-stone-500'
            }`}
          >
            {logoEmbroidery ? 'Bordado Activo' : 'Sin Bordado'}
          </span>
          <div
            className={`w-9 h-5 rounded-full transition relative ${
              logoEmbroidery ? 'bg-amber-500' : 'bg-stone-800'
            }`}
          >
            <div
              className={`absolute top-0.5 bottom-0.5 w-4 bg-white rounded-full transition-all ${
                logoEmbroidery ? 'left-4' : 'left-0.5'
              }`}
            />
          </div>
          <input
            type="checkbox"
            checked={logoEmbroidery}
            onChange={(e) => onToggleEmbroidery(e.target.checked)}
            className="hidden"
          />
        </label>
      </div>

      {logoEmbroidery && (
        <div className="space-y-3 pt-1 animate-in fade-in">
          {/* Multi-Image Dropzone & Gallery */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
                <ImageIcon size={13} className="text-amber-400" />
                Logos de Cliente ({logoUrls.length})
              </label>
              <button
                type="button"
                disabled={isCompressing}
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] font-black uppercase tracking-widest bg-stone-900 hover:bg-stone-800 text-amber-400 border border-stone-800 px-3 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isCompressing ? (
                  <>
                    <Loader2 size={12} className="animate-spin" /> Procesando...
                  </>
                ) : (
                  <>
                    <UploadCloud size={13} /> Subir Logos
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFilesSelected}
                className="hidden"
              />
            </div>

            {uploadError && (
              <p className="text-[10px] text-red-400 font-bold">{uploadError}</p>
            )}

            {/* Thumbnail Gallery Grid */}
            {logoUrls.length > 0 ? (
              <div className="flex flex-wrap gap-2.5 p-2 bg-stone-900/60 rounded-xl border border-stone-850">
                {logoUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative group w-16 h-16 rounded-xl border border-stone-700 bg-stone-950 p-1 flex items-center justify-center overflow-hidden shadow-sm"
                  >
                    <img
                      src={url}
                      alt={`Logo ${idx + 1}`}
                      className="max-w-full max-h-full object-contain pointer-events-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveLogo(idx)}
                      className="absolute top-1 right-1 bg-red-600/90 text-white rounded-md p-1 opacity-0 group-hover:opacity-100 transition shadow-md hover:bg-red-500 cursor-pointer"
                      title="Eliminar logo"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-stone-800 hover:border-amber-500/50 rounded-xl p-3 text-center cursor-pointer transition bg-stone-900/40"
              >
                <UploadCloud size={20} className="mx-auto text-stone-500 mb-1" />
                <span className="text-[10px] font-bold text-stone-400 block">
                  Haga clic para subir uno o varios logos del cliente
                </span>
                <span className="text-[9px] text-stone-600 font-mono">
                  Compresión automática a ~50KB manteniendo transparencia PNG
                </span>
              </div>
            )}
          </div>

          {/* Ubicaciones del Logo: Quick pills + tags */}
          <div className="space-y-2 pt-2 border-t border-stone-900">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                Ubicaciones del Logo
              </label>
              <button
                type="button"
                onClick={() => handleAddPlacement('')}
                className="text-amber-500 hover:text-amber-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} /> Agregar
              </button>
            </div>

            {/* Quick Add Pills */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PLACEMENTS.map((plc) => (
                <button
                  key={plc}
                  type="button"
                  onClick={() => handleAddPlacement(plc)}
                  className="text-[9px] font-bold uppercase bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800 px-2 py-0.5 rounded-md transition cursor-pointer"
                >
                  + {plc}
                </button>
              ))}
            </div>

            {/* Active placements list */}
            {logoPlacements.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={p}
                  onChange={(e) => handleUpdatePlacement(i, e.target.value)}
                  placeholder="Ej. Pecho izquierdo, Espalda superior..."
                  className="flex-1 bg-stone-900 border border-stone-800 p-2 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePlacement(i)}
                  className="p-2 text-stone-500 hover:text-red-400 transition cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
