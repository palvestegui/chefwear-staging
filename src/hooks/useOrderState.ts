import { Order, OrderItem } from '../types';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { INITIAL_ORDER_STATE, INITIAL_ITEM_STATE } from '../utils/orderFormDefaults';

export const useOrderState = (editingOrder: Order | null, setEditingOrder: (order: Order | null) => void) => {
  const { userProfile, user, isSuperAdmin } = useAuth();

  const [newOrder, setNewOrder] = useState<Order>(INITIAL_ORDER_STATE as Order);
  const [currentItem, setCurrentItem] = useState<OrderItem>(INITIAL_ITEM_STATE as OrderItem);
  const [orderHeaderMode, setOrderHeaderMode] = useState<'Cotización' | 'Orden Activa'>('Cotización');
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initializedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const isSuper = Boolean(
      isSuperAdmin ||
        userProfile?.role === 'SUPER_ADMIN' ||
        userProfile?.role === 'SUPERADMIN' ||
        (user?.email && user.email.toLowerCase() === 'palvestegui@gmail.com')
    );
    const defaultSeller = userProfile?.name || user?.displayName || '';
    const defaultEmail = userProfile?.email || user?.email || '';
    const defaultUid = userProfile?.uid || user?.uid || '';
    const targetKey = editingOrder ? editingOrder.id || '__EDIT__' : '__NEW__';

    if (initializedKeyRef.current !== targetKey) {
      initializedKeyRef.current = targetKey;
      if (editingOrder) {
        setNewOrder({
          ...INITIAL_ORDER_STATE,
          ...editingOrder,
          sellerName: (isSuper ? editingOrder.sellerName : defaultSeller) || defaultSeller,
          sellerEmail: (isSuper ? editingOrder.sellerEmail : defaultEmail) || defaultEmail,
          sellerUid: (isSuper ? editingOrder.sellerUid : defaultUid) || defaultUid,
          items: editingOrder.items || [],
        });
        setEditingQuoteId(editingOrder.id || null);
        setOrderHeaderMode(
          editingOrder.id?.startsWith('COT-') || editingOrder.status === 'Estimado' ? 'Cotización' : 'Orden Activa'
        );
      } else {
        setNewOrder({
          ...INITIAL_ORDER_STATE,
          sellerName: defaultSeller,
          sellerEmail: defaultEmail,
          sellerUid: defaultUid,
        });
        setCurrentItem(INITIAL_ITEM_STATE);
        setEditingQuoteId(null);
        setOrderHeaderMode('Cotización');
      }
      return;
    }

    // Background profile refresh: only backfill missing seller identity without clobbering active form edits
    if (defaultSeller || defaultEmail || defaultUid) {
      setNewOrder((prev) => ({
        ...prev,
        sellerName: prev.sellerName || defaultSeller,
        sellerEmail: prev.sellerEmail || defaultEmail,
        sellerUid: prev.sellerUid || defaultUid,
      }));
    }
  }, [editingOrder, userProfile, user, isSuperAdmin]);

  const resetForm = useCallback(() => {
    initializedKeyRef.current = null;
    const defaultSeller = userProfile?.name || user?.displayName || '';
    setNewOrder({
      ...INITIAL_ORDER_STATE,
      sellerName: defaultSeller,
      sellerEmail: userProfile?.email || user?.email || '',
      sellerUid: userProfile?.uid || user?.uid || '',
    });
    setCurrentItem(INITIAL_ITEM_STATE);
    setEditingQuoteId(null);
    setEditingOrder(null);
  }, [userProfile, user, setEditingOrder]);

  return {
    newOrder,
    setNewOrder,
    currentItem,
    setCurrentItem,
    orderHeaderMode,
    setOrderHeaderMode,
    editingQuoteId,
    setEditingQuoteId,
    isSubmitting,
    setIsSubmitting,
    resetForm,
    userProfile,
    user,
  };
};
