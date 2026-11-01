import React, { useState } from 'react';
import {
  X,
  Building2,
  Phone,
  Mail,
  MessageSquare,
  Pencil,
  ChevronDown,
  MapPin,
  Truck,
  Palette,
  Sparkles,
  Lock,
  History,
  FileText,
  DollarSign,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { doc, deleteDoc, updateDoc, Firestore } from 'firebase/firestore';
import { normalizePricingTier, isSystemAccount } from '../../utils/constants';
import { SocialBadges } from '../crm/SocialBadges';
import { ClientAccount } from '../../types/crm';

export interface AccountProfileModalProps {
  account: ClientAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenEdit?: (account: ClientAccount) => void;
  onViewHistory?: (accountId: string) => void;
  onRequestDelete?: (account: ClientAccount) => void;
  onDeleteAccount?: (account: ClientAccount) => Promise<void> | void;
  clientAccounts?: ClientAccount[];
  db?: Firestore;
}

export const AccountProfileModal: React.FC<AccountProfileModalProps> = ({
  account,
  isOpen,
  onClose,
  onOpenEdit,
  onViewHistory,
  onRequestDelete,
  onDeleteAccount,
  clientAccounts = [],
  db
}) => {
  const [isLogisticsOpen, setIsLogisticsOpen] = useState(false);
  const [isBrandingOpen, setIsBrandingOpen] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  if (!isOpen || !account) return null;

  const isProtected = isSystemAccount(account.accountId);

  // Parent Account Resolution
  const parentAccount = account.parentAccountId
    ? clientAccounts.find(a => a.accountId === account.parentAccountId)
    : null;

  // WhatsApp Link formatting
  const rawPhone = String(account.phone || '').trim();
  const cleanPhoneDigits = rawPhone.replace(/[^0-9]/g, '');
  const waUrl = cleanPhoneDigits
    ? `https://wa.me/${cleanPhoneDigits.length <= 8 ? '591' + cleanPhoneDigits : cleanPhoneDigits}`
    : null;

  // Contact Person formatting
  const contactPersonName = `${account.contactNombre || ''} ${account.contactApellido || ''}`.trim();

  // Logo placements & URLs
  const placements: string[] = Array.isArray(account.logoPlacements)
    ? account.logoPlacements.filter((p: string) => p && p.trim() !== '')
    : [];

  const logoList: string[] = (
    account.logoUrls && account.logoUrls.length > 0
      ? account.logoUrls
      : account.logoUrl
        ? [account.logoUrl]
        : []
  ).filter((url): url is string => Boolean(url && url.trim()));

  return (
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-3 sm:p-4 md:p-6 animate-in fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 w-[95vw] max-w-[1700px] mx-auto max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Building2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black text-amber-400 uppercase tracking-wider bg-stone-950 px-2 py-0.5 rounded-md border border-stone-800">
                  {account.accountId || 'ACC-XXX'}
                </span>
                {isProtected && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500/90 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded">
                    <Lock size={10} /> Sistema Protegido
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-stone-100 uppercase tracking-tight mt-0.5">
                Perfil de Cuenta Cliente
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isProtected && onOpenEdit && (
              <button
                type="button"
                onClick={() => onOpenEdit(account)}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Pencil size={12} className="text-amber-400" />
                <span>Editar</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition flex items-center justify-center cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Section 1 (Always Visible): Account Core Identity */}
        <div className="space-y-4 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-950 p-4 rounded-2xl border border-stone-800">
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Razón Social / Nombre de Cuenta</p>
              <h2 className="text-xl font-black text-stone-100 uppercase tracking-tight">{account.accountName || 'Sin Nombre'}</h2>
              {parentAccount && (
                <p className="text-xs text-stone-400 mt-0.5">
                  Sucursal de: <strong className="text-stone-300 font-bold">{parentAccount.accountName} ({parentAccount.accountId})</strong>
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-stone-800 text-stone-200 border border-stone-700">
                {account.accountType || 'Empresa / Corporate'}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-amber-950/60 text-amber-400 border border-amber-800/60 flex items-center gap-1">
                <DollarSign size={10} />
                {normalizePricingTier(account.pricingTier)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Contact Person */}
            <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 flex flex-col justify-between">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Persona de Contacto</span>
              <p className="text-xs font-bold text-stone-200 mt-1">{contactPersonName || 'No especificada'}</p>
            </div>

            {/* Phone & WhatsApp */}
            <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 flex flex-col justify-between">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
                <Phone size={13} className="text-amber-400" /> Teléfono / WhatsApp
              </span>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold text-stone-200">{rawPhone || 'No registrado'}</span>
                {waUrl && (
                  <a href={waUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-400 bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-800/60 px-2.5 py-1 rounded-lg transition tracking-wide">
                    <MessageSquare size={12} /> WhatsApp
                  </a>
                )}
              </div>
            </div>

            {/* Email Address */}
            <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 sm:col-span-2 flex flex-col justify-between">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
                <Mail size={13} className="text-blue-400" /> Correo Electrónico
              </span>
              <div className="mt-1">
                {account.email ? (
                  <a href={`mailto:${account.email}`} className="text-xs font-mono text-stone-300 hover:text-amber-400 transition">
                    {account.email}
                  </a>
                ) : (
                  <span className="text-xs text-stone-400 italic">No registrado</span>
                )}
              </div>
            </div>
          </div>

          {/* Social Media Strip */}
          <SocialBadges socials={account.socials} className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800" />
        </div>

        {/* Section 2 (Collapsible Accordion): Logística & Entrega */}
        <div className="w-full shrink-0">
          <button
            type="button"
            onClick={() => setIsLogisticsOpen(!isLogisticsOpen)}
            className={`w-full p-4 flex items-center justify-between bg-stone-950 border border-stone-800 hover:bg-stone-850/60 transition cursor-pointer text-left ${
              isLogisticsOpen ? 'rounded-t-xl border-b-0' : 'rounded-xl'
            }`}
          >
            <div className="flex items-center gap-2">
              <Truck size={16} className="text-amber-400" />
              <span className="text-xs font-black text-stone-200 uppercase tracking-wider">📍 Logística & Entrega</span>
            </div>
            <ChevronDown size={16} className={`text-stone-400 transition-transform duration-200 ${isLogisticsOpen ? 'rotate-180 text-amber-400' : ''}`} />
          </button>

          {isLogisticsOpen && (
            <div className="p-4 bg-stone-950/80 border border-t-0 border-stone-800 rounded-b-xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-stone-900/90 border border-stone-800/80 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={12} className="text-amber-400" /> Ciudad de Entrega
                  </span>
                  <p className="text-xs font-bold text-stone-200 mt-1">{account.deliveryCity || 'Santa Cruz'}</p>
                </div>

                <div className="bg-stone-900/90 border border-stone-800/80 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck size={12} className="text-emerald-400" /> Dirección de Entrega
                  </span>
                  <p className="text-xs text-stone-300 mt-1">{account.deliveryAddress || 'No especificada'}</p>
                </div>
              </div>

              {account.deliveryNotes && (
                <div className="bg-stone-900/90 border border-stone-800/80 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={12} className="text-blue-400" /> Notas de Despacho
                  </span>
                  <p className="text-xs text-stone-300 mt-1 whitespace-pre-wrap">{account.deliveryNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 3 (Collapsible Accordion): Branding & Bordados */}
        <div className="w-full shrink-0">
          <button
            type="button"
            onClick={() => setIsBrandingOpen(!isBrandingOpen)}
            className={`w-full p-4 flex items-center justify-between bg-stone-950 border border-stone-800 hover:bg-stone-850/60 transition cursor-pointer text-left ${
              isBrandingOpen ? 'rounded-t-xl border-b-0' : 'rounded-xl'
            }`}
          >
            <div className="flex items-center gap-2">
              <Palette size={16} className="text-amber-400" />
              <span className="text-xs font-black text-stone-200 uppercase tracking-wider">
                🎨 Branding & Bordados
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                  account.logoEmbroidery
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                    : 'bg-stone-900 text-stone-500 border-stone-800'
                }`}
              >
                {account.logoEmbroidery ? 'Bordado Activo' : 'Sin Bordado'}
              </span>
            </div>
            <ChevronDown
              size={16}
              className={`text-stone-400 transition-transform duration-200 ${
                isBrandingOpen ? 'rotate-180 text-amber-400' : ''
              }`}
            />
          </button>

          {isBrandingOpen && (
            <div className="p-4 bg-stone-950/80 border border-t-0 border-stone-800 rounded-b-xl space-y-3">
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Sparkles size={12} className="text-amber-400" /> Ubicaciones de Bordado
                </span>
                {placements.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {placements.map((plc, idx) => (
                      <span key={idx} className="bg-stone-900 border border-stone-800 px-2.5 py-1 rounded-lg text-xs font-bold text-stone-300">
                        {plc}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-400 italic">No hay ubicaciones registradas.</p>
                )}
              </div>

              {/* Logos Gallery */}
              {logoList.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={12} className="text-amber-400" /> Logos Digitalizados ({logoList.length})
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {logoList.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveLightboxImage(url)}
                        title="Click para ampliar"
                        className="group relative w-16 h-16 rounded-xl border border-stone-800 bg-stone-900/90 overflow-hidden hover:border-amber-500/80 transition p-1.5 cursor-pointer shadow-sm hover:scale-105"
                      >
                        <img src={url} alt={`Logo ${idx + 1}`} className="w-full h-full object-contain pointer-events-none" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="bg-stone-900/90 border border-stone-800/80 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Colores de Hilo</span>
                  <p className="text-xs text-stone-300 font-mono mt-1">{account.threadColors || 'No especificados'}</p>
                </div>

                <div className="bg-stone-900/90 border border-stone-800/80 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Ruta / Archivo de Logo</span>
                  <p className="text-xs font-mono text-stone-400 mt-1 truncate" title={account.logoFileLocation}>
                    {account.logoFileLocation || (logoList.length > 0 ? 'Digitalizado en sistema' : 'No registrada')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-800 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isProtected || isDeleting}
              onClick={() => {
                if (onRequestDelete) onRequestDelete(account);
                else setShowConfirmDelete(true);
              }}
              title={isProtected ? 'Cuenta de sistema protegida contra eliminación' : 'Eliminar cuenta'}
              className="px-3.5 py-2 text-red-400 hover:bg-red-950/40 border border-red-900/40 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <Trash2 size={13} />
              <span>Eliminar Cuenta</span>
            </button>
            {onViewHistory && (
              <button
                type="button"
                onClick={() => onViewHistory(account.accountId)}
                className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-amber-400 border border-stone-700 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <History size={14} />
                <span>Historial de Pedidos</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isProtected && onOpenEdit && (
              <button
                type="button"
                onClick={() => onOpenEdit(account)}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Pencil size={13} className="text-stone-950" />
                <span>Editar Cuenta</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Zoom Modal */}
      {activeLightboxImage && (
        <div
          className="fixed inset-0 bg-stone-950/90 backdrop-blur-md flex items-center justify-center z-[120] p-4 cursor-zoom-out animate-in fade-in"
          onClick={() => setActiveLightboxImage(null)}
        >
          <div
            className="relative max-w-xl max-h-[80vh] p-4 bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveLightboxImage(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center border border-stone-700 shadow-md cursor-pointer"
            >
              <X size={16} />
            </button>
            <img
              src={activeLightboxImage}
              alt="Logo ampliado"
              className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl mt-4"
            />
          </div>
        </div>
      )}

      {/* Inline Confirmation Modal for Account Deletion */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <AlertCircle size={20} />
              </div>
              <h3 className="text-lg font-black text-stone-100 uppercase tracking-tight">Eliminar Cuenta Cliente</h3>
            </div>
            <p className="text-stone-300 text-xs leading-relaxed">
              ¿Estás seguro que deseas eliminar la cuenta <strong className="text-white">{account.accountName} ({account.accountId})</strong>?
              Esta acción eliminará el registro de la base de datos y desvinculará sus sucursales asociadas.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 border border-stone-700 text-stone-300 hover:bg-stone-800 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  try {
                    setIsDeleting(true);
                    if (onDeleteAccount) {
                      await onDeleteAccount(account);
                    } else if (db) {
                      const targetDocId = account.id || account.accountId;
                      if (targetDocId) {
                        await deleteDoc(doc(db, 'clientAccounts', targetDocId));
                        const childAccounts = clientAccounts.filter((a: ClientAccount) => a.parentAccountId === account.accountId);
                        for (const child of childAccounts) {
                          const childDocId = child.id || child.accountId;
                          if (childDocId) {
                            await updateDoc(doc(db, 'clientAccounts', childDocId), { parentAccountId: null });
                          }
                        }
                      }
                    }
                    setShowConfirmDelete(false);
                    onClose();
                  } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : 'Error desconocido';
                    console.error('Error al eliminar cuenta:', message);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-md"
              >
                {isDeleting ? 'Eliminando...' : 'Confirmar Eliminación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
