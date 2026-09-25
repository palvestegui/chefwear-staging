import React from 'react';
import { Loader2 } from 'lucide-react';

export type MaintenanceActionKey = 'catalog' | 'services' | 'orders' | 'total';

export interface MaintenanceActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  actionKey: MaintenanceActionKey;
  confirmingAction: MaintenanceActionKey | null;
  onStartConfirm: (key: MaintenanceActionKey) => void;
  onCancel: () => void;
  onExecute: () => void;
  isLoading: boolean;
  isBusy: boolean;
  defaultLabel: string;
  confirmLabel: string;
  defaultIcon?: React.ReactNode;
  isRedVariant?: boolean;
  topAction?: React.ReactNode;
}

export const MaintenanceActionCard: React.FC<MaintenanceActionCardProps> = ({
  icon,
  title,
  description,
  actionKey,
  confirmingAction,
  onStartConfirm,
  onCancel,
  onExecute,
  isLoading,
  isBusy,
  defaultLabel,
  confirmLabel,
  defaultIcon,
  isRedVariant = false,
  topAction,
}) => {
  const isConfirming = confirmingAction === actionKey;

  return (
    <div className={`rounded-2xl p-5 flex flex-col justify-between gap-4 border ${
      isRedVariant 
        ? 'bg-gradient-to-b from-stone-900 via-stone-900 to-red-950/20 border-red-500/30 shadow-lg' 
        : 'bg-stone-900/60 border-stone-800'
    }`}>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-stone-200 font-bold text-sm">
          <span className={`p-2 rounded-xl ${isRedVariant ? 'bg-red-500/20 text-red-400' : 'bg-stone-800 text-amber-400'}`}>
            {icon}
          </span>
          <span>{title}</span>
        </div>
        <p className="text-xs text-stone-400 font-mono">{description}</p>
      </div>

      <div className="flex flex-col gap-2">
        {topAction}
        {!isConfirming ? (
          <button
            type="button"
            onClick={() => onStartConfirm(actionKey)}
            disabled={isBusy}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer ${
              isRedVariant
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-950'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
            }`}
          >
            {defaultIcon}
            <span>{defaultLabel}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 animate-in fade-in">
            <button
              type="button"
              disabled={isLoading}
              onClick={onExecute}
              className={`flex-1 py-2.5 px-3 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                isRedVariant
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                confirmLabel
              )}
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={onCancel}
              className="py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
