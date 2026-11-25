import React, { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';

export interface ClientGarmentLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  modelName: string;
  category?: string;
  fabricName?: string;
  priceLabel?: string;
  priceRaleo?: number;
  priceB2B?: number;
  frontImageUrl?: string;
  backImageUrl?: string;
  initialSide?: 'front' | 'back';
}

export const ClientGarmentLightbox: React.FC<ClientGarmentLightboxProps> = ({
  isOpen,
  onClose,
  modelName,
  category,
  fabricName,
  priceLabel,
  priceRaleo,
  priceB2B,
  frontImageUrl,
  backImageUrl,
  initialSide = 'front',
}) => {
  const headingId = useId();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [activeSide, setActiveSide] = useState<'front' | 'back'>(initialSide);

  useEffect(() => {
    if (initialSide === 'back' && backImageUrl) {
      setActiveSide('back');
    } else if (frontImageUrl) {
      setActiveSide('front');
    } else if (backImageUrl) {
      setActiveSide('back');
    }
  }, [initialSide, frontImageUrl, backImageUrl, isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleNativeClose = () => {
      dialog.returnValue = '';
      onClose();
    };
    dialog.addEventListener('close', handleNativeClose);

    if ('closedBy' in HTMLDialogElement.prototype) {
      return () => dialog.removeEventListener('close', handleNativeClose);
    }

    const isOutside = (event: PointerEvent) => {
      const rect = dialog.getBoundingClientRect();
      return (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      );
    };
    let pressedOutside = false;
    const onPointerDown = (e: PointerEvent) => {
      pressedOutside = isOutside(e);
    };
    const onPointerUp = (e: PointerEvent) => {
      if (pressedOutside && isOutside(e)) dialog.close();
    };
    dialog.addEventListener('pointerdown', onPointerDown);
    dialog.addEventListener('pointerup', onPointerUp);

    return () => {
      dialog.removeEventListener('close', handleNativeClose);
      dialog.removeEventListener('pointerdown', onPointerDown);
      dialog.removeEventListener('pointerup', onPointerUp);
    };
  }, [onClose]);

  const currentSrc =
    activeSide === 'back' && backImageUrl
      ? backImageUrl
      : frontImageUrl || backImageUrl || '';
  const hasBothSides = Boolean(frontImageUrl && backImageUrl);

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as Record<string, string>)}
      aria-labelledby={headingId}
      className="m-auto w-[min(94vw,760px)] max-h-[92vh] rounded-3xl bg-stone-950 border border-stone-800 text-stone-100 p-0 shadow-2xl open:flex open:flex-col overflow-hidden"
    >
      {/* Clean Client-Facing Header */}
      <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-stone-800/90 bg-stone-950">
        <div className="min-w-0 space-y-1">
          {category && (
            <span className="inline-block text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded">
              {category}
            </span>
          )}
          <h1 id={headingId} className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">
            {modelName}
          </h1>
          {fabricName && (
            <p className="text-xs font-bold text-stone-400">
              Tela: <span className="text-stone-200">{fabricName}</span>
            </p>
          )}
        </div>

        <button
          type="button"
          autoFocus
          onClick={() => dialogRef.current?.close()}
          aria-label="Cerrar vista cliente"
          className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:border-stone-700 cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-500 focus-visible:outline-offset-2 shrink-0"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      {/* Main Garment Photo */}
      <div className="flex-1 min-h-0 bg-stone-900/60 flex items-center justify-center p-4 sm:p-6 overflow-auto">
        {currentSrc ? (
          <img
            src={currentSrc}
            alt={`${modelName} — vista ${activeSide === 'back' ? 'espalda' : 'frente'}`}
            className="max-h-[60vh] w-auto max-w-full object-contain rounded-2xl border border-stone-800 shadow-xl bg-stone-950"
          />
        ) : null}
      </div>

      {/* Footer: Front/Back Toggle + Clean Client Pricing Only */}
      <div className="px-5 py-4 border-t border-stone-800/90 bg-stone-950 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2" role="group" aria-label="Vista de prenda">
          {hasBothSides && (
            <>
              <button
                type="button"
                aria-pressed={activeSide === 'front'}
                onClick={() => setActiveSide('front')}
                className={`min-h-[32px] px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-500 focus-visible:outline-offset-2 ${
                  activeSide === 'front'
                    ? 'bg-amber-500 text-stone-950 border-amber-400'
                    : 'bg-stone-900 text-stone-300 border-stone-800 hover:border-stone-700'
                }`}
              >
                Frente
              </button>
              <button
                type="button"
                aria-pressed={activeSide === 'back'}
                onClick={() => setActiveSide('back')}
                className={`min-h-[32px] px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border transition cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-500 focus-visible:outline-offset-2 ${
                  activeSide === 'back'
                    ? 'bg-amber-500 text-stone-950 border-amber-400'
                    : 'bg-stone-900 text-stone-300 border-stone-800 hover:border-stone-700'
                }`}
              >
                Espalda
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {priceLabel ? (
            <div className="bg-amber-500/15 border border-amber-500/30 px-4 py-1.5 rounded-xl font-mono text-base font-black text-amber-400">
              {priceLabel}
            </div>
          ) : (
            <>
              {priceRaleo !== undefined && (
                <div className="bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 rounded-xl text-right">
                  <span className="block text-[9px] font-black uppercase tracking-wider text-amber-500/80">
                    Minorista
                  </span>
                  <span className="font-mono text-sm font-black text-amber-400">Bs {priceRaleo}</span>
                </div>
              )}
              {priceB2B !== undefined && (
                <div className="bg-stone-900 border border-stone-800 px-3 py-1.5 rounded-xl text-right">
                  <span className="block text-[9px] font-black uppercase tracking-wider text-stone-400">
                    Mayorista B2B
                  </span>
                  <span className="font-mono text-sm font-bold text-stone-200">Bs {priceB2B}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </dialog>
  );
};
