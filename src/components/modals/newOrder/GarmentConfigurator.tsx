import React from 'react';
import { compressImage } from '../../../utils/imageUtils';
import { GarmentSizingSection } from './GarmentSizingSection';
import { ImageIcon, Trash2 } from 'lucide-react';
import { isServiceApplicable } from '../../../utils/serviceUtils';
import { calculateVolumeScaledServiceUnitPrice } from '../../../utils/pricingCalculator';
import { findGarmentMetadata, getSortedFabricsForGarment } from '../../../domains/pricing/pricingResolver';
import { useAuth } from '../../../contexts/AuthContext';
import { requiredFields, fieldLabels } from '../../../utils/constants';

export interface GarmentConfiguratorProps {
  newOrder: any;
  setNewOrder: React.Dispatch<React.SetStateAction<any>>;
  currentItem: any;
  setCurrentItem: React.Dispatch<React.SetStateAction<any>>;
  pricing: any;
  orderHeaderMode: string;
  setShowQuickSizeModal: (val: boolean) => void;
  calculateItemPriceRaw: (item: any, tierOrCat: string) => number;
  getPricingTierFromClientType: (type: string) => string;
}

export const GarmentConfigurator: React.FC<GarmentConfiguratorProps> = ({
  newOrder,
  setNewOrder,
  currentItem,
  setCurrentItem,
  pricing,
  orderHeaderMode,
  setShowQuickSizeModal,
  calculateItemPriceRaw,
  getPricingTierFromClientType,
}) => {
  const { userProfile } = useAuth();
  const isUdiMode = newOrder.accountId === 'ACC-001' || newOrder.category === 'UDI' || newOrder.clientType === 'Estudiante UDI' || (newOrder.clientType === 'Universidad / Instituto' && (newOrder.companyName || '').toLowerCase().includes('udi')) || newOrder.pricingTier === 'UDI Especial' || newOrder.pricingTier === 'Contrato Institucional';

  const specialPresets = pricing?.specialPresets || { "UDI Especial": pricing?.udiPricing || {} };
  const rawTier = newOrder.pricingTier || getPricingTierFromClientType(newOrder.clientType || 'Independiente (Personal)', newOrder.accountId) || newOrder.category;
  
  let activePresetKey: string | null = null;
  if (specialPresets[rawTier]) {
    activePresetKey = rawTier;
  } else if (isUdiMode || rawTier === 'Contrato Institucional' || rawTier === 'UDI Especial') {
    activePresetKey = 'UDI Especial';
  }

  // Ensure currentItem has correct defaults if garment is 'Uniforme Completo UDI' or switching to UDI mode
  React.useEffect(() => {
    if (isUdiMode) {
      const udiDict = pricing?.udiPricing || pricing?.specialPresets?.['UDI Especial'] || {};
      const validGarments = ['Uniforme Completo UDI', ...Object.keys(udiDict)];
      if (!validGarments.includes(currentItem.name)) {
        const meta = findGarmentMetadata(pricing, 'Uniforme Completo UDI', 'CONJUNTO COMPLETO');
        setCurrentItem((prev: any) => ({
          ...prev, name: 'Uniforme Completo UDI', fabric: 'CONJUNTO COMPLETO', sku: meta.sku, fabricSku: meta.fabricSku, fabricColor: ''
        }));
      } else if (currentItem.name === 'Uniforme Completo UDI' && currentItem.fabric !== 'CONJUNTO COMPLETO') {
        const meta = findGarmentMetadata(pricing, 'Uniforme Completo UDI', 'CONJUNTO COMPLETO');
        setCurrentItem((prev: any) => ({ ...prev, fabric: 'CONJUNTO COMPLETO', sku: meta.sku, fabricSku: meta.fabricSku }));
      }
    } else if (currentItem.name === 'Uniforme Completo UDI') {
      if (currentItem.fabric !== 'CONJUNTO COMPLETO') {
        const meta = findGarmentMetadata(pricing, 'Uniforme Completo UDI', 'CONJUNTO COMPLETO');
        setCurrentItem((prev: any) => ({ ...prev, fabric: 'CONJUNTO COMPLETO', sku: meta.sku, fabricSku: meta.fabricSku }));
      }
    } else if (currentItem.name) {
      const presetFabrics = activePresetKey && specialPresets[activePresetKey]?.[currentItem.name] ? Object.keys(specialPresets[activePresetKey][currentItem.name]) : null;
      const { sortedFabrics, primaryFabric } = getSortedFabricsForGarment(pricing, currentItem.name, presetFabrics);
      if (primaryFabric && (!currentItem.fabric || !sortedFabrics.includes(currentItem.fabric))) {
        const meta = findGarmentMetadata(pricing, currentItem.name, primaryFabric);
        setCurrentItem((prev: any) => ({
          ...prev,
          fabric: primaryFabric,
          sku: meta.sku || prev.sku,
          fabricSku: meta.fabricSku || prev.fabricSku
        }));
      }
    }
  }, [isUdiMode, currentItem.name, pricing, activePresetKey]);

  const getFilteredRelevantServices = () => {
    return pricing.services?.filter((srv: any) => {
      return isServiceApplicable(srv, {
        garmentName: currentItem.name,
        presetKey: activePresetKey,
        isUdiMode,
        allStandardGarments: Object.keys(pricing.garments || {}),
        allSpecialPresets: specialPresets
      });
    }) || [];
  };

  return (
    <div className="bg-stone-950 p-6 rounded-3xl border border-stone-800 border-dashed space-y-4">
      <h4 className="text-[10px] font-black text-stone-500 uppercase tracking-widest border-b border-stone-800 pb-2 mb-2">Configurador de Prenda</h4>
      
      {/* Category-based configurator */}
      {isUdiMode || currentItem.name === 'Uniforme Completo UDI' ? (
        <div className="grid grid-cols-1 gap-3">
          <select value={currentItem.name} onChange={e => {
            const name = e.target.value;
            const udiDict = pricing?.udiPricing || pricing?.specialPresets?.['UDI Especial'] || {};
            let fabric = '';
            if (name === 'Uniforme Completo UDI') fabric = 'CONJUNTO COMPLETO';
            else fabric = Object.keys(udiDict[name] || {})[0] || 'Drill de 8oz';
            const meta = findGarmentMetadata(pricing, name, fabric);
            setCurrentItem({
              ...currentItem,
              name,
              fabric,
              sku: meta.sku,
              fabricSku: meta.fabricSku,
              measurements: {},
              services: [],
              fabricColor: ''
            });
          }} className="bg-stone-900 border border-stone-800 p-3 rounded-xl font-bold text-xs text-stone-300 outline-none">
            <option value="Uniforme Completo UDI">Uniforme Completo UDI</option>
            {Object.keys(pricing?.udiPricing || pricing?.specialPresets?.['UDI Especial'] || {}).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <div className="bg-stone-900/50 p-3 rounded-xl border border-stone-800 text-center">
            <span className="text-[11px] font-black text-amber-500 uppercase tracking-wider font-mono">
              {(() => {
                if (currentItem.name === 'Uniforme Completo UDI') return 'CONJUNTO COMPLETO';
                const udiDict = pricing?.udiPricing || pricing?.specialPresets?.['UDI Especial'] || {};
                return Object.keys(udiDict[currentItem.name] || {})[0] || currentItem.fabric || 'Drill de 8oz';
              })()}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <select value={currentItem.name} onChange={e => {
              const name = e.target.value;
              const presetFabrics = activePresetKey && specialPresets[activePresetKey]?.[name] ? Object.keys(specialPresets[activePresetKey][name]) : null;
              const { sortedFabrics, primaryFabric } = getSortedFabricsForGarment(pricing, name, presetFabrics);
              const fabric = primaryFabric || sortedFabrics[0] || '';
              const meta = findGarmentMetadata(pricing, name, fabric);
              setCurrentItem({
                ...currentItem,
                name,
                fabric,
                sku: meta.sku,
                fabricSku: meta.fabricSku,
                measurements: {},
                services: []
              });
            }} className="bg-stone-900 border border-stone-800 p-3 rounded-xl font-bold text-xs text-stone-300 outline-none">
              {(() => {
                const presetGarments = activePresetKey && specialPresets[activePresetKey] ? Object.keys(specialPresets[activePresetKey]) : [];
                const allGarments = Array.from(new Set([...presetGarments, ...Object.keys(pricing.garments || {})]));
                return allGarments.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })).map(k => <option key={k} value={k}>{k}</option>);
              })()}
            </select>
            <select value={currentItem.fabric} onChange={e => {
              const fabric = e.target.value;
              const meta = findGarmentMetadata(pricing, currentItem.name, fabric);
              setCurrentItem({
                ...currentItem,
                fabric,
                sku: meta.sku || currentItem.sku,
                fabricSku: meta.fabricSku
              });
            }} className="bg-stone-900 border border-stone-800 p-3 rounded-xl font-bold text-xs text-stone-300 outline-none">
              {(() => {
                const presetFabrics = activePresetKey && specialPresets[activePresetKey]?.[currentItem.name] ? Object.keys(specialPresets[activePresetKey][currentItem.name]) : null;
                const { sortedFabrics } = getSortedFabricsForGarment(pricing, currentItem.name, presetFabrics);
                return sortedFabrics.map(k => <option key={k} value={k}>{k}</option>);
              })()}
            </select>
          </div>
          <div>
            <input
              type="text"
              placeholder="Color de la tela (Obligatorio) - ej. Azul Marino, Blanco Óptico..."
              value={currentItem.fabricColor || ''}
              onChange={e => setCurrentItem({...currentItem, fabricColor: e.target.value})}
              className="bg-stone-900 border border-stone-800 p-3 rounded-xl font-bold text-xs text-stone-300 outline-none w-full focus:border-amber-500/50 transition-colors"
            />
          </div>
        </div>
      )}
      
      <div>
        <label className="text-[10px] font-black text-stone-600 uppercase tracking-widest block mb-2">Servicios Adicionales</label>
        <div className="flex flex-wrap gap-2">
          {(()=>{
            const relevantServices = getFilteredRelevantServices();
            
            const uniqueMap = new Map();
            relevantServices.forEach((srv: any) => {
              if (!uniqueMap.has(srv.name)) {
                uniqueMap.set(srv.name, srv);
              } else if (srv.garment === currentItem.name) {
                uniqueMap.set(srv.name, srv);
              }
            });
            
            return Array.from(uniqueMap.values()).map((srv: any, idx: number) => {
             const active = currentItem.services?.includes(srv.name) || false;
             const customPrice = srv.type === 'Escala de Volumen (Logos)' ? calculateVolumeScaledServiceUnitPrice(currentItem.qty || 1) : (currentItem.customServicePrices && currentItem.customServicePrices[srv.name] !== undefined ? currentItem.customServicePrices[srv.name] : srv.price);
                
             let priceLabel = '';
             if (srv.type === 'Escala de Volumen (Logos)') {
                priceLabel = active && customPrice !== null && customPrice !== undefined ? `+Bs${customPrice}` : '[Escalado]';
             } else if (srv.type === 'Costo Adicional Editable' || srv.price === null || srv.price === undefined) {
                priceLabel = active && customPrice !== null && customPrice !== undefined ? `+Bs${customPrice}` : (srv.type === 'Variante Base' || srv.type === 'Opción de Confección' ? '' : '[Editable]');
             } else {
                priceLabel = srv.price === 0 ? '' : '+Bs'+srv.price;
             }
                
             return (
               <button key={`${srv.name}-${idx}`} type="button" onClick={() => setCurrentItem((p: any) => {
                  const isActive = p.services?.includes(srv.name) || false;
                  let newServices = isActive ? p.services.filter((x:any) => x !== srv.name) : [...(p.services || []), srv.name];
                  
                  if (!isActive) {
                      if (srv.exclusionGroup) {
                          const conflictingNames = (pricing?.services || [])
                              .filter((s: any) => s.exclusionGroup && s.exclusionGroup.trim().toUpperCase() === srv.exclusionGroup.trim().toUpperCase() && s.name !== srv.name)
                              .map((s: any) => s.name);
                          newServices = newServices.filter((x: any) => !conflictingNames.includes(x));
                      } else {
                          if (srv.name.includes('Tiros cruzados')) {
                              newServices = newServices.filter((x:any) => !x.includes('Tiros sencillos') && (x === srv.name || !x.includes('Tiros cruzados')));
                          } else if (srv.name.includes('Tiros sencillos')) {
                              newServices = newServices.filter((x:any) => !x.includes('Tiros cruzados'));
                          }
                      }
                  }
                  
                  return {...p, services: newServices};
               })} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition border ${active ? (srv.type === 'Opción de Confección' ? 'bg-stone-200 text-stone-900 border-stone-100' : srv.type === 'Variante Base' ? 'bg-stone-400 text-stone-950 border-stone-300' : 'bg-amber-600 text-white border-amber-500') : 'bg-stone-900 text-stone-500 border-stone-800'}`}>
                 {srv.name} <span className="opacity-70 ml-1">{priceLabel}</span>
               </button>
             );
            });
          })()}
        </div>
        {(()=>{
            const relevantServices = getFilteredRelevantServices();
            
            const uniqueMap = new Map();
            relevantServices.forEach((srv: any) => {
              if (!uniqueMap.has(srv.name)) {
                uniqueMap.set(srv.name, srv);
              } else if (srv.garment === currentItem.name) {
                uniqueMap.set(srv.name, srv);
              }
            });
            
            return Array.from(uniqueMap.values())
              .filter((s:any) => (s.type === 'Costo Adicional Editable' || ((s.price === null || s.price === undefined) && s.type !== 'Variante Base' && s.type !== 'Opción de Confección')) && currentItem.services?.includes(s.name))
              .map((srv:any, idx:number) => (
                <div key={"edit-"+srv.name+"-"+idx} className="mt-2 text-left animate-in fade-in duration-200 mb-2">
                  <label className="text-[9px] font-black text-amber-500 uppercase tracking-widest block mb-1">
                    Precio para {srv.name} <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="number"
                    placeholder="Monto en Bs"
                    value={currentItem.customServicePrices?.[srv.name] ?? ''}
                    onChange={e => {
                      const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                      setCurrentItem((p: any) => ({
                        ...p, 
                        customServicePrices: { ...(p.customServicePrices || {}), [srv.name]: val }
                      }));
                    }}
                    className="w-full bg-stone-900 border border-stone-800 p-2 rounded-lg font-bold text-xs text-stone-300 outline-none" 
                  />
                </div>
              ));
        })()}
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
              onChange={e => setCurrentItem((p: any) => ({...p, pocketName: e.target.value}))} 
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
              onChange={e => setCurrentItem((p: any) => ({...p, customPocketDetails: e.target.value}))} 
              className="w-full bg-stone-900 border border-stone-800 p-3 rounded-xl font-bold text-xs text-stone-200 outline-none focus:border-amber-500 mb-2"
            />
          </div>
        )}
      </div>

      {/* Imágenes de Referencia de Diseño/Color */}
      {!isUdiMode && (
        <div className="pt-4 border-t border-stone-800 text-left">
          <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mb-2">Imágenes de Referencia (Opcional)</label>
          
          {currentItem.referenceImages && currentItem.referenceImages.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              {currentItem.referenceImages.map((img: any, idx: number) => (
                <div key={idx} className="relative group bg-stone-900 border border-stone-800 p-2 rounded-xl flex gap-2 items-center">
                  <img src={img.url} alt="Ref" className="w-10 h-10 object-cover rounded-lg border border-stone-800" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-stone-300 truncate">{img.note || 'Sin nota'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (currentItem.referenceImages || []).filter((_: any, i: number) => i !== idx);
                      setCurrentItem((prev: any) => ({ ...prev, referenceImages: updated }));
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
                    
                    const noteEl = document.getElementById('ref-img-note') as HTMLInputElement;
                    const note = noteEl ? noteEl.value.trim() : '';
                    
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                      const base64 = reader.result as string;
                      const compressed = await compressImage(base64);
                      setCurrentItem((prev: any) => ({
                        ...prev,
                        referenceImages: [...(prev.referenceImages || []), { url: compressed, note }]
                      }));
                      if (noteEl) noteEl.value = '';
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
            </div>
            <span className="text-[9px] text-stone-600 font-bold">Agrega imágenes del cliente para referenciar color o diseño específico.</span>
          </div>
        </div>
      )}
      
      {/* Medidas y Tallas */}
      <GarmentSizingSection
        newOrder={newOrder}
        currentItem={currentItem}
        setCurrentItem={setCurrentItem}
        setShowQuickSizeModal={setShowQuickSizeModal}
      />

      <div className="flex items-center gap-3 pt-2">
        <input type="number" min="1" value={currentItem.qty} onChange={e => setCurrentItem((p: any) => ({...p, qty: parseInt(e.target.value)||1}))} className="bg-stone-900 border border-stone-800 p-3 w-16 text-center rounded-xl font-black text-sm text-stone-200 outline-none" />
        <button type="button" onClick={() => {
          let itemToAdd = { ...currentItem };
          const isUdi = isUdiMode || newOrder.accountId === 'ACC-001' || newOrder.category === 'UDI' || newOrder.clientType === 'Estudiante UDI' || itemToAdd.name === 'Uniforme Completo UDI';
          if (isUdi) {
            const udiDict = pricing?.udiPricing || pricing?.specialPresets?.['UDI Especial'] || {};
            if (itemToAdd.name === 'Uniforme Completo UDI') {
              itemToAdd.fabric = 'CONJUNTO COMPLETO';
            } else {
              itemToAdd.fabric = Object.keys(udiDict[itemToAdd.name] || {})[0] || itemToAdd.fabric || 'Drill de 8oz';
            }
          }

          // 1. Mandatory Pocket Name Check
          if (itemToAdd.services?.includes('Nombre en el bolsillo')) {
            if (!itemToAdd.pocketName || itemToAdd.pocketName.trim() === '') {
              alert("⚠️ No ingresaste el nombre para el bordado en el bolsillo.\n\nPor favor, escribe el nombre exacto antes de agregar la prenda al pedido.");
              return;
            }
          }

          // 2. Mandatory Custom Pocket Specs Check
          if (itemToAdd.services?.includes('Bolsillos personalizados')) {
            if (!itemToAdd.customPocketDetails || itemToAdd.customPocketDetails.trim() === '') {
              alert("⚠️ No ingresaste el detalle para los bolsillos personalizados.\n\nPor favor, especifica la personalización antes de agregar la prenda.");
              return;
            }
          }

          // 3. Mandatory Custom Service Prices Check
          const relevantServices = getFilteredRelevantServices();
          const servicesWithMissingPrices = (itemToAdd.services || []).filter((s: string) => {
            const isEditableService = relevantServices.some((rs: { name?: string; type?: string; price?: number | null }) => 
              rs.name === s && (rs.type === 'Costo Adicional Editable' || rs.price === null || rs.price === undefined)
            );
            if (!isEditableService) return false;
            const price = itemToAdd.customServicePrices?.[s];
            return price === undefined || price === null || isNaN(Number(price));
          });

          if (servicesWithMissingPrices.length > 0) {
            alert(`⚠️ Faltan precios por definir:\n\nDebes ingresar el monto en Bs para: ${servicesWithMissingPrices.join(', ')}`);
            return;
          }

          // 4. Mandatory Fabric Color Check (Active orders)
          if (orderHeaderMode === 'Orden Activa' && !isUdiMode) {
            if (!itemToAdd.fabricColor || itemToAdd.fabricColor.trim() === '') {
              alert("⚠️ Por favor, ingresa el color de la tela (el campo es obligatorio).");
              return;
            }
          }

          if (orderHeaderMode === 'Orden Activa') {

            // Enforce 8 Filipina measurements when Ventas role is active
            const isFilipina = (itemToAdd.name || '').toLowerCase().includes('filipina') || itemToAdd.name === 'Uniforme Completo UDI';
            const isCustomSizing = itemToAdd.nonUdiSizingType === 'custom' || itemToAdd.sizingMode === 'Custom Tailored';
            if (userProfile?.role === 'VENTAS' && isFilipina && isCustomSizing) {
              const required = requiredFields['Filipina'] || [];
              const missing = required.filter((m: string) => !itemToAdd.measurements?.[m] || String(itemToAdd.measurements[m]).trim() === '');
              if (missing.length > 0) {
                const missingNames = missing.map((m: string) => fieldLabels[m] || m).join(', ');
                return alert(`Como Vendedor (Matías), debes registrar las 8 medidas obligatorias de la Filipina:\n${missingNames}`);
              }
            }

            let finalSizingMode = itemToAdd.sizingMode || 'Standard Size';
            const hasMeasurements = itemToAdd.measurements && Object.keys(itemToAdd.measurements).some(k => itemToAdd.measurements[k] && String(itemToAdd.measurements[k]).trim() !== '');
            const hasStandardSize = itemToAdd.size && ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'].includes(itemToAdd.size);
            if (!hasMeasurements && !hasStandardSize) {
              finalSizingMode = 'Pending Specs';
            }
            setNewOrder((prev: any) => ({ 
              ...prev, 
              items: [...prev.items, { ...itemToAdd, sizingMode: finalSizingMode, measurements: { ...itemToAdd.measurements } }] 
            }));
          } else {
            const activeTier = newOrder.pricingTier || getPricingTierFromClientType(newOrder.clientType || 'Independiente (Personal)', newOrder.accountId) || 'Estándar Raleo';
            setNewOrder((prev: any) => ({ ...prev, items: [...prev.items, { ...itemToAdd, pricingTier: activeTier, category: newOrder.category, measurements: { ...itemToAdd.measurements } }] }));
          }
          setCurrentItem({
            name: itemToAdd.name,
            qty: 1,
            fabric: itemToAdd.fabric,
            fabricColor: '',
            embroideries: [],
            customEmbroidery: '',
            customEmbroideryPrice: 0,
            measurements: {},
            pocketName: '',
            services: [],
            referenceImages: [],
            nonUdiSizingType: 'standard',
            size: 'M',
            sizingMode: 'Standard Size'
          });
        }} className="flex-1 bg-stone-200 hover:bg-stone-300 text-stone-950 font-black py-3 rounded-xl text-xs uppercase tracking-widest transition">
          Add ({calculateItemPriceRaw(currentItem, isUdiMode ? 'UDI Especial' : (newOrder.pricingTier || newOrder.category || 'Personal')).toFixed(2)})
        </button>
      </div>
    </div>
  );
};
