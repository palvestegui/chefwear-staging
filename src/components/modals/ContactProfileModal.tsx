import React, { useState } from 'react';
import {
  X,
  User,
  Building2,
  Phone,
  Mail,
  MessageSquare,
  Pencil,
  ChevronDown,
  Ruler,
  ShoppingBag,
  DollarSign,
  Wallet,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { InlineMergeContactModal } from './InlineMergeContactModal';
import { normalizeName, TAILORING_12_POINTS } from '../../utils/contactUtils';
import { SocialBadges } from '../crm/SocialBadges';

export interface ContactProfileModalProps {
  contact: any | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenEdit?: (contact: any) => void;
  onRequestDelete?: (contact: any) => void;
  onDeleteContact?: (contact: any) => Promise<void> | void;
  clientAccounts?: any[];
  orders?: any[];
  initialOpenMeasurements?: boolean;
  db?: any;
}



export const ContactProfileModal: React.FC<ContactProfileModalProps> = ({
  contact,
  isOpen,
  onClose,
  onOpenEdit,
  onRequestDelete,
  onDeleteContact,
  clientAccounts = [],
  orders = [],
  initialOpenMeasurements = false,
  db
}) => {
  const [isMeasurementsOpen, setIsMeasurementsOpen] = useState(initialOpenMeasurements);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { isSuperAdmin, isActualSuperAdmin } = useAuth();
  const [showMergeModal, setShowMergeModal] = useState(false);

  if (!isOpen || !contact) return null;

  // Resolve Linked Account Details
  const linkedAccount = clientAccounts.find(
    a => a.accountId === contact.accountId || a.accountName === contact.companyName
  );

  // Compute Order Statistics for Contact
  const matchingOrders = orders.filter(o => {
    if (o.contactId && contact.contactId && o.contactId === contact.contactId) return true;
    const oClient = normalizeName(o.customer || o.client || o.clientName || o.contactPerson || '');
    const cName = normalizeName(contact.fullName || '');
    return Boolean(oClient && cName && oClient === cName);
  });

  const activeOrders = matchingOrders.filter(
    o => o.status !== 'Entregado' && o.status !== 'Cancelado'
  );
  const hasActiveOrders = activeOrders.length > 0;
  const isInherited = !contact.originalDocId && !contact.id;
  const canDelete = !hasActiveOrders && !isInherited;

  const orderCount = matchingOrders.length > 0 ? matchingOrders.length : (contact.orderCount || 0);
  const totalRevenue = matchingOrders.length > 0
    ? matchingOrders.reduce((sum, o) => sum + Number(o.totalPrice || 0), 0)
    : Number(contact.revenue || 0);
  const totalBalance = matchingOrders.length > 0
    ? matchingOrders.reduce(
        (sum, o) =>
          sum +
          Number(o.balance ?? (Number(o.totalPrice || 0) - Number(o.amountCollected || o.paidAmount || 0))),
        0
      )
    : Number(contact.balance || 0);

  // WhatsApp Link formatting
  const rawPhone = String(contact.phone || '').trim();
  const cleanPhoneDigits = rawPhone.replace(/[^0-9]/g, '');
  const waUrl = cleanPhoneDigits
    ? `https://wa.me/${cleanPhoneDigits.length <= 8 ? '591' + cleanPhoneDigits : cleanPhoneDigits}`
    : null;

  // Measurements extraction
  const rawMeasurements = {
    ...(contact.measurements || {}),
    ...(contact.sizingMatrix12PtCM || {}),
    ...(contact.sizingMatrix || {})
  };

  const getMeasurementVal = (key: string, altKey?: string): string | null => {
    const direct = rawMeasurements[key];
    if (direct !== undefined && direct !== null && String(direct).trim() !== '' && String(direct) !== '0') {
      return String(direct).trim();
    }
    if (altKey) {
      const altVal = rawMeasurements[altKey];
      if (altVal !== undefined && altVal !== null && String(altVal).trim() !== '' && String(altVal) !== '0') {
        return String(altVal).trim();
      }
    }
    const stripped = key.replace(/^[FP]_/, '');
    const lower = stripped.toLowerCase();
    const fallback = rawMeasurements[stripped] ?? rawMeasurements[lower];
    if (fallback !== undefined && fallback !== null && String(fallback).trim() !== '' && String(fallback) !== '0') {
      return String(fallback).trim();
    }
    return null;
  };

  const recordedCount = TAILORING_12_POINTS.filter(p => getMeasurementVal(p.key, p.alt) !== null).length;

  // Role Badge Style
  const roleText = (contact.role || 'PARTICULAR').toUpperCase();
  const getRoleBadgeStyle = (r: string) => {
    if (r.includes('ESTUDIANTE')) return 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60';
    if (r.includes('DOCENTE')) return 'bg-blue-950/60 text-blue-300 border-blue-800/60';
    if (r.includes('CHEF')) return 'bg-amber-950/60 text-amber-300 border-amber-800/60';
    if (r.includes('STAFF') || r.includes('PERSONAL')) return 'bg-purple-950/60 text-purple-300 border-purple-800/60';
    return 'bg-stone-800 text-stone-300 border-stone-700';
  };

  return (
    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-3 sm:p-4 md:p-6 animate-in fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 w-[95vw] max-w-[1700px] mx-auto max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <User size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black text-amber-400 uppercase tracking-wider bg-stone-950 px-2 py-0.5 rounded-md border border-stone-800">
                  {contact.contactId || 'CON-XXX'}
                </span>
                {isInherited && (
                  <span className="text-[10px] uppercase font-bold text-stone-500 bg-stone-800/60 px-2 py-0.5 rounded">
                    Heredado
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-stone-100 uppercase tracking-tight mt-0.5">
                Perfil de Contacto
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenEdit && (
              <button
                type="button"
                onClick={() => onOpenEdit(contact)}
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

        {/* Section 1 (Always Visible): Core Profile Info */}
        <div className="space-y-4 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-950 p-4 rounded-2xl border border-stone-800">
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Nombre Completo</p>
              <h2 className="text-xl font-black text-stone-100 uppercase tracking-tight">
                {contact.fullName || `${contact.contactNombre || ''} ${contact.contactApellido || ''}`.trim() || 'Sin Nombre'}
              </h2>
            </div>
            <span
              className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${getRoleBadgeStyle(
                roleText
              )}`}
            >
              {roleText}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Linked Account */}
            <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 flex flex-col justify-between">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
                <Building2 size={13} className="text-emerald-400" /> Cuenta Vinculada
              </span>
              <div className="mt-1">
                {linkedAccount ? (
                  <>
                    <p className="text-xs font-bold text-stone-200">{linkedAccount.accountName}</p>
                    <p className="text-[10px] font-mono text-stone-400">{linkedAccount.accountId}</p>
                  </>
                ) : contact.accountId && contact.accountId !== 'ACC-000' ? (
                  <p className="text-xs font-mono font-bold text-emerald-400">{contact.accountId}</p>
                ) : (
                  <p className="text-xs text-stone-400 font-bold">Cliente Particular (ACC-000)</p>
                )}
              </div>
            </div>

            {/* Phone & WhatsApp */}
            <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 flex flex-col justify-between">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
                <Phone size={13} className="text-amber-400" /> Teléfono / WhatsApp
              </span>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold text-stone-200">
                  {rawPhone || 'No registrado'}
                </span>
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-400 bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-800/60 px-2.5 py-1 rounded-lg transition tracking-wide"
                  >
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
                {contact.email ? (
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-xs font-mono text-stone-300 hover:text-amber-400 transition"
                  >
                    {contact.email}
                  </a>
                ) : (
                  <span className="text-xs text-stone-400 italic">No registrado</span>
                )}
              </div>
            </div>
          </div>

          {/* Social Media Strip */}
          <SocialBadges socials={contact.socials} className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800" />

          {/* Order Totals Metric Bar */}
          <div className="grid grid-cols-3 gap-2 bg-stone-950 p-3 rounded-2xl border border-stone-800">
            <div className="text-center p-2 rounded-xl bg-stone-900/60 border border-stone-800/60">
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest flex items-center justify-center gap-1">
                <ShoppingBag size={11} /> Pedidos
              </p>
              <p className="text-sm font-mono font-black text-stone-100 mt-0.5">{orderCount}</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-stone-900/60 border border-stone-800/60">
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest flex items-center justify-center gap-1">
                <DollarSign size={11} className="text-emerald-400" /> Facturado
              </p>
              <p className="text-sm font-mono font-black text-emerald-400 mt-0.5">
                Bs {totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="text-center p-2 rounded-xl bg-stone-900/60 border border-stone-800/60">
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest flex items-center justify-center gap-1">
                <Wallet size={11} className="text-amber-400" /> Saldo
              </p>
              <p
                className={`text-sm font-mono font-black mt-0.5 ${
                  totalBalance > 0 ? 'text-red-400' : 'text-stone-300'
                }`}
              >
                Bs {totalBalance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Section 2 (Collapsible Accordion): 12-Point Anatomical Measurements */}
        <div className="w-full shrink-0">
          <button
            type="button"
            onClick={() => setIsMeasurementsOpen(!isMeasurementsOpen)}
            className={`w-full p-4 flex items-center justify-between bg-stone-950 border border-stone-800 hover:bg-stone-850/60 transition cursor-pointer text-left ${
              isMeasurementsOpen ? 'rounded-t-xl border-b-0' : 'rounded-xl'
            }`}
          >
            <div className="flex items-center gap-2">
              <Ruler size={16} className="text-amber-400" />
              <span className="text-xs font-black text-stone-200 uppercase tracking-wider">
                📐 Medidas Anatómicas (12 Puntos)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-900 text-stone-400 border border-stone-800">
                {recordedCount} / 12 registradas
              </span>
            </div>
            <ChevronDown
              size={16}
              className={`text-stone-400 transition-transform duration-200 ${
                isMeasurementsOpen ? 'rotate-180 text-amber-400' : ''
              }`}
            />
          </button>

          {isMeasurementsOpen && (
            <div className="p-4 bg-stone-950/80 border border-t-0 border-stone-800 rounded-b-xl space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {TAILORING_12_POINTS.map(point => {
                  const val = getMeasurementVal(point.key, point.alt);
                  return (
                    <div
                      key={point.key}
                      className="bg-stone-900/90 border border-stone-800/80 rounded-xl p-2.5 flex flex-col justify-between"
                    >
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider truncate" title={point.label}>
                        {point.label}
                      </span>
                      <div className="mt-1 flex items-baseline gap-1">
                        {val ? (
                          <>
                            <span className="text-sm font-mono font-black text-amber-400">{val}</span>
                            <span className="text-[10px] text-stone-400 font-mono">cm</span>
                          </>
                        ) : (
                          <span className="text-xs font-mono text-stone-600">--</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {(rawMeasurements.estatura || rawMeasurements.peso) && (
                <div className="mt-3 pt-3 border-t border-stone-800/60 flex items-center gap-4 text-xs font-mono">
                  {rawMeasurements.estatura && (
                    <span className="text-stone-400">
                      Estatura: <strong className="text-stone-200">{rawMeasurements.estatura} cm</strong>
                    </span>
                  )}
                  {rawMeasurements.peso && (
                    <span className="text-stone-400">
                      Peso: <strong className="text-stone-200">{rawMeasurements.peso} kg</strong>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-800 shrink-0">
          <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canDelete || isDeleting}
            onClick={() => {
              if (onRequestDelete) {
                onRequestDelete(contact);
              } else {
                setShowConfirmDelete(true);
              }
            }}
            title={
              hasActiveOrders
                ? `No se puede eliminar: el contacto tiene ${activeOrders.length} pedido(s) activo(s)`
                : isInherited
                ? 'No se puede eliminar: contacto heredado de órdenes históricas'
                : 'Eliminar contacto del directorio'
            }
            className="px-4 py-2 text-red-400 hover:bg-red-950/40 border border-red-900/40 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Eliminar Contacto</span>
          </button>
          
          {(isSuperAdmin || isActualSuperAdmin) && (
            <button
              type="button"
              onClick={() => setShowMergeModal(true)}
              className="px-4 py-2 text-amber-500 hover:bg-amber-950/40 border border-amber-900/50 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-sm whitespace-nowrap"
            >
              <span className="hidden sm:inline">🔀 Fusionar Contacto</span>
              <span className="sm:hidden">🔀 Fusionar</span>
            </button>
          )}
          </div>
          <div className="flex items-center gap-2">
            {onOpenEdit && (
              <button
                type="button"
                onClick={() => onOpenEdit(contact)}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Pencil size={13} className="text-stone-950" />
                <span>Editar Contacto</span>
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

      {/* Inline Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                <AlertCircle size={20} />
              </div>
              <h3 className="text-lg font-black text-stone-100 uppercase tracking-tight">
                Eliminar Contacto
              </h3>
            </div>
            <p className="text-stone-300 text-xs leading-relaxed">
              ¿Estás seguro que deseas eliminar el contacto{' '}
              <strong className="text-white">{contact.fullName || contact.contactId}</strong>?
              Esta acción no se puede deshacer y el contacto será removido del directorio maestro.
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
                    if (onDeleteContact) {
                      await onDeleteContact(contact);
                    } else if (db) {
                      const targetId = contact.originalDocId || contact.id || contact.contactId;
                      if (targetId) {
                        await deleteDoc(doc(db, 'masterContacts', targetId));
                      }
                    }
                    setShowConfirmDelete(false);
                    onClose();
                  } catch (err: any) {
                    alert('Error al eliminar contacto: ' + (err.message || 'Error desconocido'));
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

      {showMergeModal && (
        <InlineMergeContactModal
          contact={contact}
          onClose={() => setShowMergeModal(false)}
          onSuccess={() => {
            setShowMergeModal(false);
            onClose();
          }}
        />
      )}
    </div>
  );
};
