import React, { useMemo, useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { doc, setDoc, Firestore } from 'firebase/firestore';
import { normalizePricingTier } from '../../utils/constants';
import { ClientAccount } from '../../types/crm';
import { AccountBrandingSection } from '../crm/AccountBrandingSection';

export interface NewAccountFormData {
  accountType: string;
  accountName: string;
  parentAccountId?: string | null;
  contactNombre?: string;
  contactApellido?: string;
  phone?: string;
  email?: string;
  deliveryCity?: string;
  deliveryAddress?: string;
  deliveryNotes?: string;
  logoEmbroidery?: boolean;
  logoPlacements?: string[];
  logoFileLocation?: string;
  logoUrl?: string;
  logoUrls?: string[];
  pricingTier?: string;
}

export interface NewAccountModalProps {
  onClose: () => void;
  newAccount: NewAccountFormData;
  setNewAccount: React.Dispatch<React.SetStateAction<NewAccountFormData>>;
  clientAccounts: ClientAccount[];
  normalizeAccountType: (val?: string) => string;
  ACCOUNT_TYPES: string[];
  pricing?: {
    specialPresets?: Record<string, unknown>;
  };
  db?: Firestore;
  user?: { uid?: string } | null;
}

export const NewAccountModal: React.FC<NewAccountModalProps> = ({
  onClose,
  newAccount,
  setNewAccount,
  clientAccounts,
  normalizeAccountType,
  ACCOUNT_TYPES,
  pricing,
  db,
  user
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compute next Account ID (ACC-XXX)
  const generatedAccountId = useMemo(() => {
    const maxNum = clientAccounts.reduce((max, a) => {
      const num = parseInt((a.accountId || '').replace('ACC-', ''), 10);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    return `ACC-${String(maxNum + 1).padStart(3, '0')}`;
  }, [clientAccounts]);

  const isIndividual = normalizeAccountType(newAccount.accountType) === 'Particular / Individuo';
  const logoUrls: string[] = newAccount.logoUrls || [];
  const logoPlacements: string[] = newAccount.logoPlacements || [];

  const handleSave = async () => {
    if (!db) {
      setErrorMessage('Base de datos no inicializada.');
      return;
    }

    const finalAccountName = isIndividual
      ? `${newAccount.contactNombre || ''} ${newAccount.contactApellido || ''}`.trim()
      : (newAccount.accountName || '').trim();

    if (!finalAccountName) {
      setErrorMessage(
        isIndividual
          ? 'Por favor ingrese el nombre del cliente particular.'
          : 'Por favor ingrese el nombre o razón social de la cuenta.'
      );
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const accData: ClientAccount = {
        accountId: generatedAccountId,
        accountType: newAccount.accountType || 'Universidad/Instituto',
        accountName: finalAccountName,
        parentAccountId: newAccount.parentAccountId || null,
        contactNombre: (newAccount.contactNombre || '').trim(),
        contactApellido: (newAccount.contactApellido || '').trim(),
        phone: (newAccount.phone || '').trim(),
        email: (newAccount.email || '').trim(),
        deliveryCity: (newAccount.deliveryCity || 'Santa Cruz').trim(),
        deliveryAddress: (newAccount.deliveryAddress || '').trim(),
        deliveryNotes: (newAccount.deliveryNotes || '').trim(),
        logoEmbroidery: Boolean(newAccount.logoEmbroidery),
        logoPlacements: logoPlacements.filter((p): p is string => Boolean(p && p.trim())),
        logoFileLocation: logoUrls[0] || newAccount.logoFileLocation || '',
        logoUrl: logoUrls[0] || '',
        logoUrls: logoUrls,
        pricingTier: normalizePricingTier(newAccount.pricingTier),
        createdAt: Date.now(),
        createdBy: user?.uid || ''
      };

      await setDoc(doc(db, 'clientAccounts', generatedAccountId), accData);
      onClose();
    } catch (error) {
      console.error('[NewAccountModal] Error al crear cuenta:', error);
      setErrorMessage('Hubo un error al guardar la cuenta en la base de datos.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-950/90 backdrop-blur-md z-[60] p-3 sm:p-4 md:p-6 flex justify-center items-center overflow-hidden animate-in fade-in">
      <div className="bg-stone-900 w-[94vw] max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 border border-stone-800 shadow-2xl relative">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-stone-800">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-stone-200 uppercase tracking-tighter">
              Nueva Cuenta de Cliente
            </h3>
            <p className="text-[11px] font-mono text-stone-500">
              Identidad, contactos, logística y especificaciones de bordado del cliente.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-500 hover:text-white transition p-1.5 rounded-lg hover:bg-stone-800 cursor-pointer"
          >
            <X size={22} />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/60 border border-red-800/60 flex items-center gap-2 text-xs text-red-300 font-bold">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 2-Column Balanced Desktop Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
          {/* ========================================================================= */}
          {/* COLUMNA IZQUIERDA: Identidad de Cuenta & Contacto                         */}
          {/* ========================================================================= */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-stone-800">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                1. Identidad de Cuenta & Tarifa
              </span>
            </div>

            {/* Row 1: Auto Account ID + Tipo de Cuenta */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                  ID (Auto)
                </label>
                <div className="w-full bg-stone-950 border border-stone-800/80 px-3 py-2 rounded-xl text-xs font-mono font-black text-amber-400">
                  {generatedAccountId}
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                  Tipo de Cuenta
                </label>
                <select
                  value={normalizeAccountType(newAccount.accountType)}
                  onChange={(e) => {
                    const val = e.target.value;
                    const update: NewAccountFormData = { ...newAccount, accountType: val };
                    if (normalizeAccountType(val) === 'Particular / Individuo') {
                      const parts = (update.accountName || '').split(' ');
                      update.contactNombre = parts[0] || update.contactNombre || '';
                      update.contactApellido = parts.slice(1).join(' ') || update.contactApellido || '';
                      update.accountName = `${update.contactNombre} ${update.contactApellido}`.trim();
                    }
                    setNewAccount(update);
                  }}
                  className="w-full bg-stone-950 border border-stone-800 p-2 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300 cursor-pointer"
                >
                  {ACCOUNT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Nivel de Precios & Cuenta Padre */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                  Nivel de Precios
                </label>
                <select
                  value={normalizePricingTier(newAccount.pricingTier)}
                  onChange={(e) => setNewAccount({ ...newAccount, pricingTier: e.target.value })}
                  disabled={Boolean(newAccount.parentAccountId)}
                  className="w-full bg-stone-950 border border-stone-800 p-2 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300 disabled:opacity-50 cursor-pointer"
                >
                  <option value="Estándar Raleo">Estándar Raleo (Minorista)</option>
                  <option value="Estándar B2B">Estándar B2B (Empresas)</option>
                  <option value="Contrato Institucional">Contrato Institucional</option>
                  {(() => {
                    const presets = pricing?.specialPresets || {};
                    return Object.keys(presets).map((k) => (
                      <option key={k} value={k}>
                        Tarifario: {k}
                      </option>
                    ));
                  })()}
                  <option value="Heredado">Heredado (De Cuenta Padre)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                  Cuenta Padre (Opcional)
                </label>
                <select
                  value={newAccount.parentAccountId || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const update: NewAccountFormData = { ...newAccount, parentAccountId: val || null };
                    if (val) update.pricingTier = 'Heredado';
                    setNewAccount(update);
                  }}
                  className="w-full bg-stone-950 border border-stone-800 p-2 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300 cursor-pointer"
                >
                  <option value="">-- Ninguna --</option>
                  {clientAccounts
                    .filter((a) => !a.parentAccountId)
                    .map((a) => (
                      <option key={a.accountId} value={a.accountId}>
                        {a.accountName} ({a.accountId})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Row 3: Nombre de Cuenta o Particular */}
            {isIndividual ? (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                  Nombre Completo del Cliente Particular
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newAccount.contactNombre || ''}
                    onChange={(e) => {
                      const nombre = e.target.value;
                      setNewAccount({
                        ...newAccount,
                        contactNombre: nombre,
                        accountName: `${nombre} ${newAccount.contactApellido || ''}`.trim()
                      });
                    }}
                    placeholder="Nombre(s)"
                    className="w-full bg-stone-950 border border-stone-800 p-2 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300"
                  />
                  <input
                    type="text"
                    value={newAccount.contactApellido || ''}
                    onChange={(e) => {
                      const apellido = e.target.value;
                      setNewAccount({
                        ...newAccount,
                        contactApellido: apellido,
                        accountName: `${newAccount.contactNombre || ''} ${apellido}`.trim()
                      });
                    }}
                    placeholder="Apellido(s)"
                    className="w-full bg-stone-950 border border-stone-800 p-2 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                  Nombre de la Cuenta / Razón Social
                </label>
                <input
                  type="text"
                  value={newAccount.accountName || ''}
                  onChange={(e) => setNewAccount({ ...newAccount, accountName: e.target.value })}
                  placeholder="Ej. Restaurante Azafrán, Hotel Cortez..."
                  className="w-full bg-stone-950 border border-stone-800 p-2 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300"
                />
              </div>
            )}

            {/* Row 4: Persona de Contacto */}
            {!isIndividual && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                  Persona de Contacto (Opcional)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newAccount.contactNombre || ''}
                    onChange={(e) => setNewAccount({ ...newAccount, contactNombre: e.target.value })}
                    placeholder="Nombre"
                    className="w-full bg-stone-950 border border-stone-800 p-2 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300"
                  />
                  <input
                    type="text"
                    value={newAccount.contactApellido || ''}
                    onChange={(e) => setNewAccount({ ...newAccount, contactApellido: e.target.value })}
                    placeholder="Apellido"
                    className="w-full bg-stone-950 border border-stone-800 p-2 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300"
                  />
                </div>
              </div>
            )}

            {/* Row 5: Teléfono & Correo Electrónico */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  value={newAccount.phone || ''}
                  onChange={(e) => setNewAccount({ ...newAccount, phone: e.target.value })}
                  placeholder="Ej. 70012345"
                  className="w-full bg-stone-950 border border-stone-800 p-2 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={newAccount.email || ''}
                  onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
                  placeholder="cliente@ejemplo.com"
                  className="w-full bg-stone-950 border border-stone-800 p-2 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300"
                />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* COLUMNA DERECHA: Logística de Despacho & Branding / Bordados               */}
          {/* ========================================================================= */}
          <div className="space-y-4">
            {/* Logística / Entrega Group */}
            <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                2. Logística & Despacho
              </span>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={newAccount.deliveryCity || 'Santa Cruz'}
                  onChange={(e) => setNewAccount({ ...newAccount, deliveryCity: e.target.value })}
                  placeholder="Santa Cruz, La Paz, Cochabamba..."
                  className="w-full bg-stone-900 border border-stone-800 p-2 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                  Dirección de Entrega
                </label>
                <input
                  type="text"
                  value={newAccount.deliveryAddress || ''}
                  onChange={(e) => setNewAccount({ ...newAccount, deliveryAddress: e.target.value })}
                  placeholder="Av. Principal #123, Zona Equipetrol..."
                  className="w-full bg-stone-900 border border-stone-800 p-2 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">
                  Notas de Despacho / Horarios
                </label>
                <textarea
                  value={newAccount.deliveryNotes || ''}
                  onChange={(e) => setNewAccount({ ...newAccount, deliveryNotes: e.target.value })}
                  placeholder="Entregar en recepción de 09:00 a 18:00..."
                  rows={2}
                  className="w-full bg-stone-900 border border-stone-800 p-2 rounded-xl focus:border-amber-500 outline-none text-xs font-bold text-stone-300 resize-none"
                />
              </div>
            </div>

            {/* Branding / Bordados Component */}
            <AccountBrandingSection
              logoEmbroidery={Boolean(newAccount.logoEmbroidery)}
              onToggleEmbroidery={(active) => setNewAccount({ ...newAccount, logoEmbroidery: active })}
              logoUrls={logoUrls}
              onChangeLogoUrls={(urls) => {
                setNewAccount({
                  ...newAccount,
                  logoUrls: urls,
                  logoUrl: urls[0] || '',
                  logoFileLocation: urls[0] || newAccount.logoFileLocation || ''
                });
              }}
              logoPlacements={logoPlacements}
              onChangeLogoPlacements={(placements) => {
                setNewAccount({ ...newAccount, logoPlacements: placements });
              }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 mt-6 border-t border-stone-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-stone-400 hover:text-white transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition shadow-lg flex items-center gap-2 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Guardando...
              </>
            ) : (
              'Guardar Cuenta'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
