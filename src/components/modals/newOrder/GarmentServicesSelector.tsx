import React from 'react';
import { OrderItem, ServicePricing } from '../../../types';
import { ServiceItem } from '../../../utils/serviceUtils';
import { calculateVolumeScaledServiceUnitPrice } from '../../../utils/pricingCalculator';

export interface GarmentServicesSelectorProps {
  currentItem: OrderItem;
  setCurrentItem: React.Dispatch<React.SetStateAction<OrderItem>>;
  relevantServices: ServiceItem[];
  allServices: ServicePricing[];
  orderHeaderMode: string;
}

export const GarmentServicesSelector: React.FC<GarmentServicesSelectorProps> = ({
  currentItem,
  setCurrentItem,
  relevantServices,
  allServices,
  orderHeaderMode,
}) => {
  const editableActiveServices = relevantServices.filter(
    (s) =>
      (s.type === 'Costo Adicional Editable' ||
        ((s.price === null || s.price === undefined) &&
          s.type !== 'Variante Base' &&
          s.type !== 'Opción de Confección')) &&
      currentItem.services?.includes(s.name || '')
  );

  return (
    <div>
      <label className="text-[10px] font-black text-stone-600 uppercase tracking-widest block mb-2">
        Servicios Adicionales
      </label>
      <div className="flex flex-wrap gap-2">
        {relevantServices.map((srv, idx) => {
          const srvName = srv.name || '';
          const active = currentItem.services?.includes(srvName) || false;
          const customPrice =
            srv.type === 'Escala de Volumen (Logos)'
              ? calculateVolumeScaledServiceUnitPrice(currentItem.qty || 1)
              : currentItem.customServicePrices && currentItem.customServicePrices[srvName] !== undefined
                ? currentItem.customServicePrices[srvName]
                : srv.price;

          let priceLabel = '';
          if (srv.type === 'Escala de Volumen (Logos)') {
            priceLabel = active && customPrice !== null && customPrice !== undefined ? `+Bs${customPrice}` : '[Escalado]';
          } else if (srv.type === 'Costo Adicional Editable' || srv.price === null || srv.price === undefined) {
            priceLabel =
              active && customPrice !== null && customPrice !== undefined
                ? `+Bs${customPrice}`
                : srv.type === 'Variante Base' || srv.type === 'Opción de Confección'
                  ? ''
                  : '[Editable]';
          } else {
            priceLabel = srv.price === 0 ? '' : `+Bs${srv.price}`;
          }

          return (
            <button
              key={`${srvName}-${idx}`}
              type="button"
              onClick={() =>
                setCurrentItem((p) => {
                  const isActive = p.services?.includes(srvName) || false;
                  let newServices = isActive
                    ? (p.services || []).filter((x) => x !== srvName)
                    : [...(p.services || []), srvName];

                  if (!isActive) {
                    if (srv.exclusionGroup) {
                      const targetGroup = srv.exclusionGroup.trim().toUpperCase();
                      const conflictingNames = allServices
                        .filter((s) => {
                          const grp = (s as { exclusionGroup?: string }).exclusionGroup;
                          return grp && grp.trim().toUpperCase() === targetGroup && s.name !== srvName;
                        })
                        .map((s) => s.name);
                      newServices = newServices.filter((x) => !conflictingNames.includes(x));
                    } else if (srvName.includes('Tiros cruzados')) {
                      newServices = newServices.filter(
                        (x) => !x.includes('Tiros sencillos') && (x === srvName || !x.includes('Tiros cruzados'))
                      );
                    } else if (srvName.includes('Tiros sencillos')) {
                      newServices = newServices.filter((x) => !x.includes('Tiros cruzados'));
                    }
                  }

                  return { ...p, services: newServices };
                })
              }
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition border ${
                active
                  ? srv.type === 'Opción de Confección'
                    ? 'bg-stone-200 text-stone-900 border-stone-100'
                    : srv.type === 'Variante Base'
                      ? 'bg-stone-400 text-stone-950 border-stone-300'
                      : 'bg-amber-600 text-white border-amber-500'
                  : 'bg-stone-900 text-stone-500 border-stone-800'
              }`}
            >
              {srvName} <span className="opacity-70 ml-1">{priceLabel}</span>
            </button>
          );
        })}
      </div>

      {editableActiveServices.map((srv, idx) => {
        const srvName = srv.name || '';
        return (
          <div key={`edit-${srvName}-${idx}`} className="mt-2 text-left animate-in fade-in duration-200 mb-2">
            <label className="text-[9px] font-black text-amber-500 uppercase tracking-widest block mb-1">
              Precio para {srvName} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              placeholder="Monto en Bs"
              value={currentItem.customServicePrices?.[srvName] ?? ''}
              onChange={(e) => {
                const raw = e.target.value;
                setCurrentItem((p) => {
                  const nextPrices = { ...(p.customServicePrices || {}) };
                  if (raw === '') {
                    delete nextPrices[srvName];
                  } else {
                    nextPrices[srvName] = parseFloat(raw);
                  }
                  return { ...p, customServicePrices: nextPrices };
                });
              }}
              className="w-full bg-stone-900 border border-stone-800 p-2 rounded-lg font-bold text-xs text-stone-300 outline-none"
            />
          </div>
        );
      })}

      {currentItem.services?.includes('Nombre en el bolsillo') && (
        <div className="mt-2 text-left animate-in fade-in duration-200 mb-2">
          <label className="text-[9px] font-black text-amber-500 uppercase tracking-widest block mb-1">
            Nombre para el Bolsillo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required={orderHeaderMode === 'Orden Activa'}
            placeholder="Ej: Chef Carlos"
            value={currentItem.pocketName || ''}
            onChange={(e) => setCurrentItem((p) => ({ ...p, pocketName: e.target.value }))}
            className="w-full bg-stone-900 border border-stone-800 p-3 rounded-xl font-bold text-xs text-stone-200 outline-none focus:border-amber-500 mb-2"
          />
        </div>
      )}
      {currentItem.services?.includes('Bolsillos personalizados') && (
        <div className="mt-2 text-left animate-in fade-in duration-200 mb-2">
          <label className="text-[9px] font-black text-amber-500 uppercase tracking-widest block mb-1">
            Detalle de personalización de bolsillos <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required={orderHeaderMode === 'Orden Activa'}
            placeholder="Ej: Bolsillo doble extra ancho..."
            value={currentItem.customPocketDetails || ''}
            onChange={(e) => setCurrentItem((p) => ({ ...p, customPocketDetails: e.target.value }))}
            className="w-full bg-stone-900 border border-stone-800 p-3 rounded-xl font-bold text-xs text-stone-200 outline-none focus:border-amber-500 mb-2"
          />
        </div>
      )}
    </div>
  );
};
