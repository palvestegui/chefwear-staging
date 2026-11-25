import React, { useState, useEffect } from 'react';
import { doc, setDoc, writeBatch, Firestore } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firebase';
import {
  SettingsFormState,
  SettingsPricingLike,
  SettingsServiceEntry,
  validateSettingsPricingForm,
} from '../utils/settingsFormValidation';

export type { SettingsFormState, SettingsPricingLike, SettingsServiceEntry };

export const useSettingsMutations = (
  pricing: SettingsPricingLike | null | undefined,
  db: unknown,
  orders: unknown[]
) => {
  const [activeSettingsTab, setActiveSettingsTab] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');
  const [settingsForm, setSettingsFormState] = useState<SettingsFormState>({
    garments: {},
    udiPricing: {},
    specialPresets: {},
    specialPresetServices: {},
    specialPresetIncludedServices: {},
    specialPresetBundles: {},
    specialPresetDiscounts: {},
    discountRulesByTier: {},
    services: [],
  });

  const setSettingsForm: React.Dispatch<React.SetStateAction<unknown>> = (action) => {
    if (typeof action === 'function') {
      const updater = action as (prev: SettingsFormState) => SettingsFormState;
      setSettingsFormState((prev) => updater(prev));
    } else if (action && typeof action === 'object') {
      setSettingsFormState(action as SettingsFormState);
    }
  };

  useEffect(() => {
    if (pricing) {
      setSettingsFormState({
        garments: pricing.garments || {},
        udiPricing: pricing.udiPricing || {},
        specialPresets: pricing.specialPresets || {},
        specialPresetServices: pricing.specialPresetServices || {},
        specialPresetIncludedServices: pricing.specialPresetIncludedServices || {},
        specialPresetBundles: pricing.specialPresetBundles || {},
        specialPresetDiscounts: pricing.specialPresetDiscounts || {},
        discountRulesByTier: pricing.discountRulesByTier || {},
        services: pricing.services || [],
        exclusionGroups: pricing.exclusionGroups,
        catalogGarments: pricing.catalogGarments || {},
      });
    }
  }, [pricing]);

  const [showPricingConfirm, setShowPricingConfirm] = useState(false);
  const [showPricingSuccess, setShowPricingSuccess] = useState(false);
  const [pricingValidationError, setPricingValidationError] = useState<string | null>(null);
  const [invalidPriceFields, setInvalidPriceFields] = useState<Set<string>>(new Set());
  const [newProductInput, setNewProductInput] = useState('');
  const [newFabricInputs, setNewFabricInputs] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [tempName, setTempName] = useState<string>('');

  const [activeSpecialPreset, setActiveSpecialPreset] = useState<string>('');
  const [newPresetNameInput, setNewPresetNameInput] = useState<string>('');
  const [showAddPresetInput, setShowAddPresetInput] = useState<boolean>(false);
  const [newPresetInput, setNewPresetInput] = useState<string>('');
  const [newPresetFabricInputs, setNewPresetFabricInputs] = useState<Record<string, string>>({});
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
    setSettingsFormState((p) => {
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
      Object.keys(updatedSpecialPresets).forEach((presetKey) => {
        if (updatedSpecialPresets[presetKey]?.[oldName]) {
          updatedSpecialPresets[presetKey] = {
            ...updatedSpecialPresets[presetKey],
            [trimmedNewName]: updatedSpecialPresets[presetKey][oldName],
          };
          delete updatedSpecialPresets[presetKey][oldName];
        }
      });

      const updatedServices = [...(p.services || [])].map((srv) => {
        const updated: SettingsServiceEntry = { ...srv };
        if (updated.garment === oldName) updated.garment = trimmedNewName;
        if (Array.isArray(updated.appliesToStandard) && updated.appliesToStandard.includes(oldName)) {
          updated.appliesToStandard = updated.appliesToStandard.map((g) => (g === oldName ? trimmedNewName : g));
        }
        return updated;
      });

      return {
        ...p,
        garments: updateds,
        udiPricing: updatedUdiPricing,
        specialPresets: updatedSpecialPresets,
        services: updatedServices,
      };
    });
    setEditingName(null);
  };

  const validatePricingForm = (): boolean => {
    const invalid = validateSettingsPricingForm(settingsForm);
    setInvalidPriceFields(invalid);

    if (invalid.size > 0) {
      setPricingValidationError('Todos los precios (Raleo y B2B) deben estar configurados antes de guardar.');
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

  const requestUpdatePricing = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!validatePricingForm()) return;
    setShowPricingConfirm(true);
  };

  const executeUpdatePricing = async (e?: React.SyntheticEvent) => {
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
      const updatedSpecialPresets = settingsForm.specialPresets || {};
      const updatedUdiPricing = updatedSpecialPresets['UDI Especial'] ? updatedSpecialPresets['UDI Especial'] : {};

      const payload = {
        ...settingsForm,
        specialPresets: updatedSpecialPresets,
        specialPresetServices: settingsForm.specialPresetServices || {},
        specialPresetIncludedServices: settingsForm.specialPresetIncludedServices || {},
        specialPresetBundles: settingsForm.specialPresetBundles || {},
        specialPresetDiscounts: settingsForm.specialPresetDiscounts || {},
        discountRulesByTier: settingsForm.discountRulesByTier || {},
        udiPricing: updatedUdiPricing,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db as Firestore, 'pricing', 'global'), payload, { merge: true });
      setShowPricingConfirm(false);
      setShowPricingSuccess(true);
      setTimeout(() => setShowPricingSuccess(false), 3000);
    } catch (err) {
      setShowPricingConfirm(false);
      handleFirestoreError(err, OperationType.UPDATE, 'pricing/global');
    }
  };

  const handleResetDatabase = async () => {
    if (enteredPin !== '3606') return;
    setIsResetting(true);
    try {
      const firestoreDb = db as Firestore;
      const batch = writeBatch(firestoreDb);
      orders.forEach((o) => {
        const orderId = (o as { id?: string } | null)?.id;
        if (orderId) batch.delete(doc(firestoreDb, 'orders', orderId));
      });
      await batch.commit();
      alert('La base de datos de pedidos fue restablecida con éxito. Todo ha sido limpiado para sus pruebas.');
      setIsResetConfirmOpen(false);
      setEnteredPin('');
    } catch (err) {
      console.error('Error al restablecer:', err);
      alert('Error al restablecer los pedidos en Firestore. Verifique sus permisos.');
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
    handleResetDatabase,
  };
};
