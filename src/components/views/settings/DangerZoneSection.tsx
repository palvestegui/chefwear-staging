import React, { useState } from 'react';
import { Trash2, Flame, History, Database, CheckCircle2 } from 'lucide-react';
import { MigrationModal } from '../../modals/MigrationModal';
import { db } from '../../../firebase';
import { runUdiFabricMigration } from '../../../utils/udiFabricMigration';
import { runUdiReconciliationPatch } from '../../../utils/udiReconciliationPatch';

export interface DangerZoneSectionProps {
  isResetConfirmOpen: boolean;
  setIsResetConfirmOpen: (val: boolean) => void;
  enteredPin: string;
  setEnteredPin: (val: string) => void;
  isResetting: boolean;
  handleResetDatabase: () => Promise<void>;
  isMigrationMode?: boolean;
  setIsMigrationMode?: (val: boolean) => void;
}

export const DangerZoneSection: React.FC<DangerZoneSectionProps> = ({
  isResetConfirmOpen,
  setIsResetConfirmOpen,
  enteredPin,
  setEnteredPin,
  isResetting,
  handleResetDatabase,
  isMigrationMode,
  setIsMigrationMode
}) => {
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [isFixingUdi, setIsFixingUdi] = useState(false);
  const [isReconcilingUdi, setIsReconcilingUdi] = useState(false);

  const handleFixUdiFabrics = async () => {
    setIsFixingUdi(true);
    try {
      const res = await runUdiFabricMigration(db);
      if (res.updatedCount > 0) {
        alert(`Corrección UDI aplicada con éxito (${res.updatedCount} órdenes actualizadas):\n\n${res.messages.join('\n')}`);
      } else if (res.alreadyCorrectCount > 0) {
        alert(`Las órdenes UDI ya se encuentran corregidas:\n\n${res.messages.join('\n')}`);
      } else {
        alert(`Resultado de la verificación:\n\n${res.messages.join('\n')}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert(`Error al ejecutar la corrección: ${message}`);
    } finally {
      setIsFixingUdi(false);
    }
  };

  const handleReconcileUdiOrders = async () => {
    setIsReconcilingUdi(true);
    try {
      const res = await runUdiReconciliationPatch(db);
      if (res.updatedCount > 0) {
        alert(`Reconciliación UDI aplicada con éxito (${res.updatedCount} órdenes actualizadas):\n\n${res.messages.join('\n')}`);
      } else if (res.alreadyReconciledCount > 0) {
        alert(`Las órdenes UDI ya se encuentran reconciliadas (Saldo Bs 0.00):\n\n${res.messages.join('\n')}`);
      } else {
        alert(`Resultado de la verificación:\n\n${res.messages.join('\n')}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert(`Error al ejecutar la reconciliación: ${message}`);
    } finally {
      setIsReconcilingUdi(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-stone-900 p-8 rounded-[2.5rem] border border-stone-800 shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-stone-800 pb-4 mb-2 text-amber-500">
          <History size={28}/> <h2 className="text-2xl font-black uppercase tracking-tighter">Modo Migración Histórica</h2>
        </div>
        <div className="space-y-4">
          <p className="text-xs text-stone-400 font-bold leading-relaxed font-sans">
            Al activar el Modo Migración, podrás registrar órdenes con fechas retroactivas personalizadas (fecha de cotización, confirmación y pagos) y aplicar descuentos monetarios directos para emparejar saldos anteriores. Úsalo exclusivamente para cargar órdenes de tu sistema anterior.
          </p>
          {setIsMigrationMode && (
            <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setIsMigrationMode(!isMigrationMode)}
              className={`px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2 w-full sm:w-auto ${
                isMigrationMode 
                  ? 'bg-amber-500 text-stone-900 shadow-[0_0_20px_rgba(245,158,11,0.4)]' 
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <History size={16}/> {isMigrationMode ? 'Desactivar Modo Migración' : 'Activar Modo Migración'}
            </button>
            <button
              onClick={() => setShowMigrationModal(true)}
              className="px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2 w-full sm:w-auto bg-stone-800 text-stone-300 hover:bg-stone-700 border border-stone-700"
            >
              <Database size={16}/> Importar JSON de Órdenes Históricas
            </button>
            <button
              type="button"
              onClick={handleFixUdiFabrics}
              disabled={isFixingUdi}
              className="px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2 w-full sm:w-auto bg-stone-800 text-amber-400 hover:bg-stone-750 border border-amber-500/30"
            >
              <CheckCircle2 size={16} className={isFixingUdi ? "animate-spin text-amber-400" : "text-amber-400"} />
              {isFixingUdi ? 'Corrigiendo Telas...' : 'Corregir Telas UDI (#21, #24, #25)'}
            </button>
            <button
              type="button"
              onClick={handleReconcileUdiOrders}
              disabled={isReconcilingUdi}
              className="px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2 w-full sm:w-auto bg-stone-800 text-emerald-400 hover:bg-stone-750 border border-emerald-500/30"
            >
              <CheckCircle2 size={16} className={isReconcilingUdi ? "animate-spin text-emerald-400" : "text-emerald-400"} />
              {isReconcilingUdi ? 'Reconciliando...' : 'Reconciliar Sobrecobros UDI (#21, #22, #23)'}
            </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-stone-900 p-8 rounded-[2.5rem] border border-red-900/40 shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-red-900/40 pb-4 mb-2 text-rose-500">
          <Trash2 size={28}/> <h2 className="text-2xl font-black uppercase tracking-tighter">Zona de Peligro</h2>
        </div>
      
      {!isResetConfirmOpen ? (
        <div className="space-y-4">
          <p className="text-xs text-stone-400 font-bold leading-relaxed font-sans">
            ¿Desea restablecer los pedidos para iniciar la fase de pruebas o producción en limpio? Todos sus pedidos, recibos de caja e historiales de confección se borrarán de forma irrevocable.
          </p>
          <button
            type="button"
            onClick={() => {
              setIsResetConfirmOpen(true);
              setEnteredPin('');
            }}
            className="bg-rose-950/40 text-rose-400 hover:bg-rose-900/30 border border-rose-900 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition flex items-center justify-center gap-2"
          >
            <Trash2 size={16}/> Comenzar Restablecimiento de Pedidos
          </button>
        </div>
      ) : (
        <div className="bg-stone-950/80 p-6 rounded-2xl border border-red-950/60 space-y-4 animate-in slide-in-from-top-4 duration-200 text-left">
          <h4 className="text-rose-400 font-extrabold text-xs uppercase tracking-wider flex items-center gap-2">
            <Flame className="animate-pulse" size={18}/> ¿CONFIRMA EL RESTABLECIMIENTO TOTAL?
          </h4>
          <p className="text-[10px] text-stone-400 font-bold leading-relaxed font-sans">
            Esta acción es destructiva e irreversible. Borrará permanentemente todos los pedidos actuales. Ingrese el número secreto de 4 dígitos para proceder:
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <input
                type="password"
                maxLength={4}
                placeholder="◦ ◦ ◦ ◦"
                value={enteredPin}
                onChange={e => setEnteredPin(e.target.value.replace(/[^0-9]/g, ''))}
                className="bg-stone-900 border border-stone-800 px-4 py-3 rounded-xl font-mono text-center text-lg tracking-widest text-white outline-none focus:border-rose-500 w-32"
              />
              <span className="text-[9px] uppercase font-black text-stone-500 tracking-wider">PIN Requerido</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                disabled={enteredPin !== '3606' || isResetting}
                onClick={handleResetDatabase}
                className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition flex items-center gap-2 ${
                  enteredPin === '3606' && !isResetting
                    ? 'bg-rose-600 text-white hover:bg-rose-500 cursor-pointer shadow-lg shadow-rose-900/10'
                    : 'bg-stone-800 text-stone-600 cursor-not-allowed border border-stone-850'
                }`}
              >
                {isResetting ? 'Restableciendo...' : 'Confirmar Reseteo Permanente'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsResetConfirmOpen(false);
                  setEnteredPin('');
                }}
                className="bg-stone-800 hover:bg-stone-750 text-stone-300 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

      {showMigrationModal && (
        <MigrationModal onClose={() => setShowMigrationModal(false)} />
      )}
    </div>
  );
};
