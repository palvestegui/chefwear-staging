import React from 'react';
import { Ban, X } from 'lucide-react';

export const CancelQuoteModal = ({
  cancelQuoteModal,
  setCancelQuoteModal,
  cancelJustification,
  setCancelJustification,
  handleConfirmCancelQuote,
  cancelResolutionType,
  setCancelResolutionType,
  cancelPartialRefund,
  setCancelPartialRefund
}: any) => {
  if (!cancelQuoteModal || !cancelQuoteModal.open || !cancelQuoteModal.order) return null;
  return (
    
        <div className="fixed inset-0 bg-stone-950/90 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20">
                  <Ban size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-200 uppercase tracking-tight">Anular Cotización</h3>
                  <p className="text-[11px] text-stone-500 font-medium">Orden #{cancelQuoteModal.order.id?.slice(-6) || ''} - {cancelQuoteModal.order.companyName || cancelQuoteModal.order.customer}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCancelQuoteModal(null)}
                className="text-stone-500 hover:text-white p-2 rounded-xl transition hover:bg-stone-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-stone-950 border border-stone-800 rounded-xl p-3 flex justify-between items-center text-xs">
                <span className="text-stone-400 font-bold">Monto Recaudado:</span>
                <span className="font-mono font-black text-amber-500">Bs{Number(cancelQuoteModal.order.amountCollected || 0).toFixed(2)}</span>
              </div>

              {Number(cancelQuoteModal.order.amountCollected || 0) > 0 && (
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-stone-400 uppercase tracking-wider block">
                    Resolución Financiera
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Devolución Total', 'Retención de Adelanto', 'Devolución Parcial'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setCancelResolutionType(type)}
                        className={`p-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-center border transition ${
                          cancelResolutionType === type
                            ? 'bg-red-600 text-white border-red-500'
                            : 'bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  {cancelResolutionType === 'Devolución Parcial' && (
                    <div>
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">
                        Monto a Devolver (Bs)
                      </label>
                      <input
                        type="number"
                        placeholder="Ej: 100.00"
                        value={cancelPartialRefund}
                        onChange={(e) => setCancelPartialRefund(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl text-xs text-stone-200 font-mono font-bold outline-none focus:border-red-500"
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-[11px] font-black text-stone-400 uppercase tracking-wider block mb-2">
                  Motivo / Justificación (Obligatorio)
                </label>
                <textarea
                  rows={3}
                  value={cancelJustification}
                  onChange={(e) => setCancelJustification(e.target.value)}
                  placeholder="Detalle el motivo formal de la anulación..."
                  className="w-full bg-stone-950 border border-stone-800 p-3 rounded-xl text-xs text-stone-200 outline-none focus:border-red-500 font-medium resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelQuoteModal(null)}
                className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelQuote}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-red-950/50"
              >
                Confirmar Anulación
              </button>
            </div>
          </div>
        </div>
      
  );
};
