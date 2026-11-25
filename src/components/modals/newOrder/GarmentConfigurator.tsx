import React from 'react';
import { GarmentSizingSection } from './GarmentSizingSection';
import { GarmentServicesSelector } from './GarmentServicesSelector';
import { GarmentReferenceImages } from './GarmentReferenceImages';
import { findGarmentMetadata, getSortedFabricsForGarment } from '../../../domains/pricing/pricingResolver';
import { extractValidFabricKeys } from '../../../domains/pricing/fabricAliasMap';
import { useAuth } from '../../../contexts/AuthContext';
import { requiredFields, fieldLabels } from '../../../utils/constants';
import { Order, OrderItem, PricingData } from '../../../types';
import { PricingItemInput } from '../../../hooks/usePricingEngine';
import {
  buildGroupedGarmentOptions,
  getUniqueRelevantServices,
  resolveCatalogCategory,
  resolveGarmentBaseFamily,
} from '../../../utils/garmentConfiguratorUtils';

export interface GarmentConfiguratorProps {
  newOrder: Order;
  setNewOrder: React.Dispatch<React.SetStateAction<Order>>;
  currentItem: OrderItem;
  setCurrentItem: React.Dispatch<React.SetStateAction<OrderItem>>;
  pricing: PricingData;
  orderHeaderMode: string;
  setShowQuickSizeModal: (val: boolean) => void;
  calculateItemPriceRaw: (item: PricingItemInput, tierOrCat?: string) => number;
  getPricingTierFromClientType: (type: string, accountId?: string, accountPricingTier?: string) => string;
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
  const isUdiMode =
    newOrder.accountId === 'ACC-001' ||
    newOrder.category === 'UDI' ||
    newOrder.clientType === 'Estudiante UDI' ||
    (newOrder.clientType === 'Universidad / Instituto' &&
      (newOrder.companyName || '').toLowerCase().includes('udi')) ||
    newOrder.pricingTier === 'UDI Especial' ||
    newOrder.pricingTier === 'Contrato Institucional';

  const specialPresets = (pricing?.specialPresets || {
    'UDI Especial': pricing?.udiPricing || {},
  }) as Record<string, Record<string, unknown>>;
  const rawTier =
    newOrder.pricingTier ||
    getPricingTierFromClientType(newOrder.clientType || 'Independiente (Personal)', newOrder.accountId) ||
    newOrder.category ||
    '';

  let activePresetKey: string | null = null;
  if (specialPresets[rawTier]) {
    activePresetKey = rawTier;
  } else if (isUdiMode || rawTier === 'Contrato Institucional' || rawTier === 'UDI Especial') {
    activePresetKey = 'UDI Especial';
  }

  const garmentOptions = buildGroupedGarmentOptions(pricing, activePresetKey, specialPresets);
  const activeCatalogCategory = resolveCatalogCategory(pricing, currentItem.name);
  const activeBaseFamily = resolveGarmentBaseFamily(currentItem.name, activeCatalogCategory);

  React.useEffect(() => {
    if (isUdiMode) {
      const udiDict = (pricing?.udiPricing || pricing?.specialPresets?.['UDI Especial'] || {}) as Record<string, unknown>;
      const validGarments = ['Uniforme Completo UDI', ...Object.keys(udiDict)];
      if (!validGarments.includes(currentItem.name)) {
        const meta = findGarmentMetadata(pricing, 'Uniforme Completo UDI', 'CONJUNTO COMPLETO');
        setCurrentItem((prev) => ({
          ...prev,
          name: 'Uniforme Completo UDI',
          fabric: 'CONJUNTO COMPLETO',
          sku: meta.sku,
          fabricSku: meta.fabricSku,
          fabricColor: '',
        }));
      } else if (currentItem.name === 'Uniforme Completo UDI' && currentItem.fabric !== 'CONJUNTO COMPLETO') {
        const meta = findGarmentMetadata(pricing, 'Uniforme Completo UDI', 'CONJUNTO COMPLETO');
        setCurrentItem((prev) => ({ ...prev, fabric: 'CONJUNTO COMPLETO', sku: meta.sku, fabricSku: meta.fabricSku }));
      }
    } else if (currentItem.name === 'Uniforme Completo UDI') {
      if (currentItem.fabric !== 'CONJUNTO COMPLETO') {
        const meta = findGarmentMetadata(pricing, 'Uniforme Completo UDI', 'CONJUNTO COMPLETO');
        setCurrentItem((prev) => ({ ...prev, fabric: 'CONJUNTO COMPLETO', sku: meta.sku, fabricSku: meta.fabricSku }));
      }
    } else if (currentItem.name) {
      const presetRecord = activePresetKey ? specialPresets[activePresetKey]?.[currentItem.name] : undefined;
      const presetFabrics = presetRecord ? extractValidFabricKeys(presetRecord) : null;
      const { sortedFabrics, primaryFabric } = getSortedFabricsForGarment(pricing, currentItem.name, presetFabrics);
      if (primaryFabric && (!currentItem.fabric || !sortedFabrics.includes(currentItem.fabric))) {
        const meta = findGarmentMetadata(pricing, currentItem.name, primaryFabric);
        setCurrentItem((prev) => ({
          ...prev,
          fabric: primaryFabric,
          sku: meta.sku || prev.sku,
          fabricSku: meta.fabricSku || prev.fabricSku,
        }));
      }
    }
  }, [isUdiMode, currentItem.name, pricing, activePresetKey]);

  const relevantServices = getUniqueRelevantServices({
    services: pricing?.services,
    garmentName: currentItem.name,
    baseFamily: activeBaseFamily,
    presetKey: activePresetKey,
    isUdiMode,
    allStandardGarments: Object.keys(pricing?.garments || {}),
    allSpecialPresets: specialPresets,
  });

  const udiDict = (pricing?.udiPricing || pricing?.specialPresets?.['UDI Especial'] || {}) as Record<string, unknown>;
  const activePresetFabrics = activePresetKey && specialPresets[activePresetKey]?.[currentItem.name]
    ? extractValidFabricKeys(specialPresets[activePresetKey][currentItem.name])
    : null;
  const { sortedFabrics: activeSortedFabrics } = getSortedFabricsForGarment(
    pricing,
    currentItem.name,
    activePresetFabrics
  );

  const handleAddItem = () => {
    const itemToAdd: OrderItem = { ...currentItem };
    const isUdi =
      isUdiMode ||
      newOrder.accountId === 'ACC-001' ||
      newOrder.category === 'UDI' ||
      newOrder.clientType === 'Estudiante UDI' ||
      itemToAdd.name === 'Uniforme Completo UDI';
    if (isUdi) {
      itemToAdd.fabric =
        itemToAdd.name === 'Uniforme Completo UDI'
          ? 'CONJUNTO COMPLETO'
          : extractValidFabricKeys(udiDict[itemToAdd.name])[0] || itemToAdd.fabric || 'Drill de 8oz';
    }

    if (itemToAdd.services?.includes('Nombre en el bolsillo') && (!itemToAdd.pocketName || !itemToAdd.pocketName.trim())) {
      alert('⚠️ No ingresaste el nombre para el bordado en el bolsillo.\n\nPor favor, escribe el nombre exacto antes de agregar la prenda al pedido.');
      return;
    }
    if (itemToAdd.services?.includes('Bolsillos personalizados') && (!itemToAdd.customPocketDetails || !itemToAdd.customPocketDetails.trim())) {
      alert('⚠️ No ingresaste el detalle para los bolsillos personalizados.\n\nPor favor, especifica la personalización antes de agregar la prenda.');
      return;
    }

    const servicesWithMissingPrices = (itemToAdd.services || []).filter((s) => {
      const isEditableService = relevantServices.some(
        (rs) =>
          rs.name === s &&
          (rs.type === 'Costo Adicional Editable' || rs.price === null || rs.price === undefined)
      );
      if (!isEditableService) return false;
      const price = itemToAdd.customServicePrices?.[s];
      return price === undefined || price === null || Number.isNaN(Number(price));
    });
    if (servicesWithMissingPrices.length > 0) {
      alert(`⚠️ Faltan precios por definir:\n\nDebes ingresar el monto en Bs para: ${servicesWithMissingPrices.join(', ')}`);
      return;
    }

    if (orderHeaderMode === 'Orden Activa' && !isUdiMode && (!itemToAdd.fabricColor || !itemToAdd.fabricColor.trim())) {
      alert('⚠️ Por favor, ingresa el color de la tela (el campo es obligatorio).');
      return;
    }

    if (orderHeaderMode === 'Orden Activa') {
      const isFilipina = activeBaseFamily === 'Filipina' || itemToAdd.name === 'Uniforme Completo UDI';
      const isCustomSizing = itemToAdd.nonUdiSizingType === 'custom' || itemToAdd.sizingMode === 'Custom Tailored';
      if (userProfile?.role === 'VENTAS' && isFilipina && isCustomSizing) {
        const required = requiredFields['Filipina'] || [];
        const missing = required.filter(
          (m) => !itemToAdd.measurements?.[m] || String(itemToAdd.measurements[m]).trim() === ''
        );
        if (missing.length > 0) {
          const missingNames = missing.map((m) => fieldLabels[m] || m).join(', ');
          return alert(`Como Vendedor (Matías), debes registrar las 8 medidas obligatorias de la Filipina:\n${missingNames}`);
        }
      }

      let finalSizingMode = itemToAdd.sizingMode || 'Standard Size';
      const hasMeasurements =
        itemToAdd.measurements &&
        Object.keys(itemToAdd.measurements).some((k) => itemToAdd.measurements?.[k] && String(itemToAdd.measurements[k]).trim() !== '');
      const hasStandardSize =
        itemToAdd.size && ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'].includes(itemToAdd.size);
      if (!hasMeasurements && !hasStandardSize) {
        finalSizingMode = 'Pending Specs';
      }
      setNewOrder((prev) => ({
        ...prev,
        items: [...prev.items, { ...itemToAdd, sizingMode: finalSizingMode, measurements: { ...itemToAdd.measurements } }],
      }));
    } else {
      const activeTier =
        newOrder.pricingTier ||
        getPricingTierFromClientType(newOrder.clientType || 'Independiente (Personal)', newOrder.accountId) ||
        'Estándar Raleo';
      setNewOrder((prev) => ({
        ...prev,
        items: [
          ...prev.items,
          { ...itemToAdd, pricingTier: activeTier, category: newOrder.category, measurements: { ...itemToAdd.measurements } },
        ],
      }));
    }
    setCurrentItem({
      name: itemToAdd.name,
      sku: itemToAdd.sku,
      fabricSku: itemToAdd.fabricSku,
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
      sizingMode: 'Standard Size',
    });
  };

  return (
    <div className="bg-stone-950 p-6 rounded-3xl border border-stone-800 border-dashed space-y-4">
      <h4 className="text-[10px] font-black text-stone-500 uppercase tracking-widest border-b border-stone-800 pb-2 mb-2">
        Configurador de Prenda
      </h4>

      {isUdiMode || currentItem.name === 'Uniforme Completo UDI' ? (
        <div className="grid grid-cols-1 gap-3">
          <select
            value={currentItem.name}
            onChange={(e) => {
              const name = e.target.value;
              const fabric = name === 'Uniforme Completo UDI'
                ? 'CONJUNTO COMPLETO'
                : extractValidFabricKeys(udiDict[name])[0] || 'Drill de 8oz';
              const meta = findGarmentMetadata(pricing, name, fabric);
              setCurrentItem({
                ...currentItem,
                name,
                fabric,
                sku: meta.sku,
                fabricSku: meta.fabricSku,
                measurements: {},
                services: [],
                fabricColor: '',
              });
            }}
            className="bg-stone-900 border border-stone-800 p-3 rounded-xl font-bold text-xs text-stone-300 outline-none"
          >
            <option value="Uniforme Completo UDI">Uniforme Completo UDI</option>
            {Object.keys(udiDict).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <div className="bg-stone-900/50 p-3 rounded-xl border border-stone-800 text-center">
            <span className="text-[11px] font-black text-amber-500 uppercase tracking-wider font-mono">
              {currentItem.name === 'Uniforme Completo UDI'
                ? 'CONJUNTO COMPLETO'
                : extractValidFabricKeys(udiDict[currentItem.name])[0] || currentItem.fabric || 'Drill de 8oz'}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <select
              value={currentItem.name}
              onChange={(e) => {
                const name = e.target.value;
                const presetFabrics = activePresetKey && specialPresets[activePresetKey]?.[name]
                  ? extractValidFabricKeys(specialPresets[activePresetKey][name])
                  : null;
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
                  services: [],
                });
              }}
              className="bg-stone-900 border border-stone-800 p-3 rounded-xl font-bold text-xs text-stone-300 outline-none"
            >
              {garmentOptions.presetGarments.length > 0 && (
                <optgroup label={`Tarifario Especial (${activePresetKey})`}>
                  {garmentOptions.presetGarments.map((name) => (
                    <option key={`preset-${name}`} value={name}>
                      {name}
                    </option>
                  ))}
                </optgroup>
              )}
              {garmentOptions.baseGarments.length > 0 && (
                <optgroup label="Prendas Base">
                  {garmentOptions.baseGarments.map((name) => (
                    <option key={`base-${name}`} value={name}>
                      {name}
                    </option>
                  ))}
                </optgroup>
              )}
              {garmentOptions.catalogGarments.length > 0 && (
                <optgroup label="Catálogo Maestro">
                  {garmentOptions.catalogGarments.map((item) => (
                    <option key={`cat-${item.name}`} value={item.name}>
                      {item.category ? `${item.name} · ${item.category}` : item.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <select
              value={currentItem.fabric || ''}
              onChange={(e) => {
                const fabric = e.target.value;
                const meta = findGarmentMetadata(pricing, currentItem.name, fabric);
                setCurrentItem({
                  ...currentItem,
                  fabric,
                  sku: meta.sku || currentItem.sku,
                  fabricSku: meta.fabricSku,
                });
              }}
              className="bg-stone-900 border border-stone-800 p-3 rounded-xl font-bold text-xs text-stone-300 outline-none"
            >
              {activeSortedFabrics.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div>
            <input
              type="text"
              placeholder="Color de la tela (Obligatorio) - ej. Azul Marino, Blanco Óptico..."
              value={currentItem.fabricColor || ''}
              onChange={(e) => setCurrentItem({ ...currentItem, fabricColor: e.target.value })}
              className="bg-stone-900 border border-stone-800 p-3 rounded-xl font-bold text-xs text-stone-300 outline-none w-full focus:border-amber-500/50 transition-colors"
            />
          </div>
        </div>
      )}

      <GarmentServicesSelector
        currentItem={currentItem}
        setCurrentItem={setCurrentItem}
        relevantServices={relevantServices}
        allServices={pricing?.services || []}
        orderHeaderMode={orderHeaderMode}
      />

      {!isUdiMode && (
        <GarmentReferenceImages currentItem={currentItem} setCurrentItem={setCurrentItem} />
      )}

      <GarmentSizingSection
        newOrder={newOrder}
        currentItem={currentItem}
        setCurrentItem={setCurrentItem}
        setShowQuickSizeModal={setShowQuickSizeModal}
        catalogCategory={activeCatalogCategory}
      />

      <div className="flex items-center gap-3 pt-2">
        <input
          type="number"
          min="1"
          value={currentItem.qty}
          onChange={(e) => setCurrentItem((p) => ({ ...p, qty: parseInt(e.target.value, 10) || 1 }))}
          className="bg-stone-900 border border-stone-800 p-3 w-16 text-center rounded-xl font-black text-sm text-stone-200 outline-none"
        />
        <button
          type="button"
          onClick={handleAddItem}
          className="flex-1 bg-stone-200 hover:bg-stone-300 text-stone-950 font-black py-3 rounded-xl text-xs uppercase tracking-widest transition"
        >
          Add (
          {calculateItemPriceRaw(
            currentItem,
            isUdiMode ? 'UDI Especial' : newOrder.pricingTier || newOrder.category || 'Personal'
          ).toFixed(2)}
          )
        </button>
      </div>
    </div>
  );
};
