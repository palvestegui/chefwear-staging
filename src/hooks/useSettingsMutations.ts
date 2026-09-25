import { useState, useEffect } from 'react';
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firebase';

export const useSettingsMutations = (pricing: any, db: any, orders: any[]) => {
  const [activeSettingsTab, setActiveSettingsTab] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');
  const [settingsForm, setSettingsForm] = useState<any>({
    garments: {},
    udiPricing: {},
    specialPresets: {},
    specialPresetServices: {},
    specialPresetDiscounts: {},
    discountRulesByTier: {},
    services: []
  });
  
  useEffect(() => {
    if (pricing) {
      setSettingsForm({
        garments: pricing.garments || {},
        udiPricing: pricing.udiPricing || {},
        specialPresets: pricing.specialPresets || {},
        specialPresetServices: pricing.specialPresetServices || {},
        specialPresetDiscounts: pricing.specialPresetDiscounts || {},
        discountRulesByTier: pricing.discountRulesByTier || {},
        services: pricing.services || [],
        catalogGarments: pricing.catalogGarments || {}
      });
    }
  }, [pricing]);

  const [showPricingConfirm, setShowPricingConfirm] = useState(false);
  const [showPricingSuccess, setShowPricingSuccess] = useState(false);
  const [pricingValidationError, setPricingValidationError] = useState<string | null>(null);
  const [invalidPriceFields, setInvalidPriceFields] = useState<Set<string>>(new Set());
  const [newProductInput, setNewProductInput] = useState('');
  const [newFabricInputs, setNewFabricInputs] = useState<{[garment: string]: string}>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [tempName, setTempName] = useState<string>('');

  const [activeSpecialPreset, setActiveSpecialPreset] = useState<string>('UDI Especial');
  const [newPresetNameInput, setNewPresetNameInput] = useState<string>('');
  const [showAddPresetInput, setShowAddPresetInput] = useState<boolean>(false);
  const [newPresetInput, setNewPresetInput] = useState<string>('');
  const [newPresetFabricInputs, setNewPresetFabricInputs] = useState<{[garment: string]: string}>({});
  const [confirmDeletePreset, setConfirmDeletePreset] = useState<string | null>(null);

  const [enteredPin, setEnteredPin] = useState('');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleRename = (oldName: string, newName: string) => {
    const trimmedNewName = newName.trim();
    if (!trimmedNewName || trimmedNewName === oldName) {
      setEditingName(null);
      return;
    }
    setSettingsForm((p: any) => {
      const updateds = { ...p.garments };
      if (updateds[oldName]) {
        updateds[trimmedNewName] = updateds[oldName];
        delete updateds[oldName];
      }

      const updatedUdiPricing = { ...p.udiPricing };
      if (updatedUdiPricing[oldName]) {
        updatedUdiPricing[trimmedNewName] = updatedUdiPricing[oldName];
        delete updatedUdiPricing[oldName];
      }

      const updatedSpecialPresets = { ...p.specialPresets };
      Object.keys(updatedSpecialPresets).forEach(presetKey => {
        if (updatedSpecialPresets[presetKey][oldName]) {
          updatedSpecialPresets[presetKey][trimmedNewName] = updatedSpecialPresets[presetKey][oldName];
          delete updatedSpecialPresets[presetKey][oldName];
        }
      });

      const updatedServices = [...(p.services || [])].map((srv: any) => {
        let updated = { ...srv };
        if (updated.garment === oldName) updated.garment = trimmedNewName;
        if (Array.isArray(updated.appliesToStandard) && updated.appliesToStandard.includes(oldName)) {
          updated.appliesToStandard = updated.appliesToStandard.map((g: string) => g === oldName ? trimmedNewName : g);
        }
        return updated;
      });

      return {
        ...p,
        garments: updateds,
        udiPricing: updatedUdiPricing,
        specialPresets: updatedSpecialPresets,
        services: updatedServices
      };
    });
    setEditingName(null);
  };

  const validatePricingForm = (): boolean => {
    const invalid = new Set<string>();
    
    // Check Tab A (Global / Default)
    Object.keys(settingsForm.garments).forEach((garment) => {
      const fabrics = settingsForm.garments[garment] || {};
      Object.keys(fabrics).forEach((fabric) => {
        if (garment === 'Gorro' && (fabric.includes('Tornado') || fabric.includes('Gabardina de 1ra'))) return;
        const val = fabrics[fabric];
        const numVal = typeof val === 'number' ? val : (typeof val === 'object' && val !== null ? Number(val.priceRaleo || val.priceB2B || 0) : 0);
        if (val === undefined || val === null || isNaN(numVal) || numVal <= 0) {
          invalid.add(`tabA:${garment}:${fabric}`);
        }
      });
    });

    // Check Tab B (Special Presets)
    const currentPresets = settingsForm.specialPresets || { "UDI Especial": settingsForm.udiPricing || {} };
    Object.keys(currentPresets).forEach(pKey => {
      const pData = currentPresets[pKey] || {};
      Object.keys(pData).forEach((garment) => {
        const fabrics = pData[garment] || {};
        Object.keys(fabrics).forEach((fabric) => {
          const val = fabrics[fabric];
          const numVal = typeof val === 'number' ? val : (typeof val === 'object' && val !== null ? Number(val.priceRaleo || val.priceB2B || 0) : 0);
          if (val === undefined || val === null || isNaN(numVal) || numVal <= 0) {
            invalid.add(`tabB:${pKey}:${garment}:${fabric}`);
          }
        });
      });
    });

    setInvalidPriceFields(invalid);

    if (invalid.size > 0) {
      setPricingValidationError("Todos los precios (Raleo y B2B) deben estar configurados antes de guardar.");
      const firstKey = Array.from(invalid)[0];
      if (firstKey.startsWith('tabA:')) {
        setActiveSettingsTab('A');
      } else if (firstKey.startsWith('tabB:')) {
        setActiveSettingsTab('B');
        const parts = firstKey.split(':');
        if (parts[1]) setActiveSpecialPreset(parts[1]);
      }
      return false;
    }

    setPricingValidationError(null);
    return true;
  };

  const requestUpdatePricing = (e: any) => {
    if(e) e.preventDefault();
    if (!validatePricingForm()) {
      return;
    }
    setShowPricingConfirm(true);
  };

  const executeUpdatePricing = async (e?: any) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!validatePricingForm()) {
      setShowPricingConfirm(false);
      return;
    }
    setShowPricingConfirm(false);
    try {
      const updatedSpecialPresets = settingsForm.specialPresets || {
        "UDI Especial": settingsForm.udiPricing || {}
      };
      const updatedUdiPricing = updatedSpecialPresets["UDI Especial"] || settingsForm.udiPricing || {};

      const payload = {
        ...settingsForm,
        specialPresets: updatedSpecialPresets,
        specialPresetServices: settingsForm.specialPresetServices || {},
        specialPresetDiscounts: settingsForm.specialPresetDiscounts || {},
        discountRulesByTier: settingsForm.discountRulesByTier || {},
        udiPricing: updatedUdiPricing,
        updatedAt: Date.now()
      };

      await setDoc(doc(db, 'pricing', 'global'), payload, { merge: true });
      setShowPricingConfirm(false);
      setShowPricingSuccess(true);
      setTimeout(() => setShowPricingSuccess(false), 3000);
    } catch(err) {
      setShowPricingConfirm(false);
      handleFirestoreError(err, OperationType.UPDATE, 'pricing/global');
    }
  };
  
  const handleResetDatabase = async () => {
    if (enteredPin !== '3606') return;
    setIsResetting(true);
    try {
      const batch = writeBatch(db);
      orders.forEach((o: any) => {
        batch.delete(doc(db, 'orders', o.id));
      });
      await batch.commit();
      alert('La base de datos de pedidos fue restablecida con éxito. Todo ha sido limpiado para sus pruebas.');
      setIsResetConfirmOpen(false);
      setEnteredPin('');
    } catch (err) {
      console.error("Error al restablecer:", err);
      alert("Error al restablecer los pedidos en Firestore. Verifique sus permisos.");
    } finally {
      setIsResetting(false);
    }
  };

  return {
    activeSettingsTab, setActiveSettingsTab,
    settingsForm, setSettingsForm,
    showPricingConfirm, setShowPricingConfirm,
    showPricingSuccess, setShowPricingSuccess,
    pricingValidationError, setPricingValidationError,
    invalidPriceFields, setInvalidPriceFields,
    newProductInput, setNewProductInput,
    newFabricInputs, setNewFabricInputs,
    confirmDelete, setConfirmDelete,
    editingName, setEditingName,
    tempName, setTempName,
    activeSpecialPreset, setActiveSpecialPreset,
    newPresetNameInput, setNewPresetNameInput,
    showAddPresetInput, setShowAddPresetInput,
    newPresetInput, setNewPresetInput,
    newPresetFabricInputs, setNewPresetFabricInputs,
    confirmDeletePreset, setConfirmDeletePreset,
    enteredPin, setEnteredPin,
    isResetConfirmOpen, setIsResetConfirmOpen,
    isResetting, setIsResetting,
    handleRename,
    validatePricingForm,
    requestUpdatePricing,
    executeUpdatePricing,
    handleResetDatabase
  };
};
