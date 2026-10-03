'use client';

import { createContext, useContext, useEffect, useMemo, useReducer, useState, useCallback } from 'react';
import { settingsDefaults, gstRateFor } from '@/lib/settings-shared';
import { shippingFor, freeDeliveryGap } from '@/lib/config';

const CartContext = createContext(null);
const STORAGE_KEY = 'elyf.cart.v1';

function lineTotal(item) {
  return item.price * item.qty;
}

function reducer(state, action) {
  switch (action.type) {
    case 'hydrate':
      return action.items;
    case 'add': {
      const { product, qty } = action;
      const existing = state.find((i) => i.slug === product.slug);
      const minQty = Math.max(qty, product.moq || 1);
      if (existing) {
        return state.map((i) =>
          i.slug === product.slug ? { ...i, qty: i.qty + minQty } : i,
        );
      }
      return [
        ...state,
        {
          slug: product.slug,
          name: product.name,
          partNo: product.partNo,
          unit: product.unit,
          price: product.price,
          moq: product.moq || 1,
          image: product.images?.[0] || '',
          category: product.category,
          categoryName: product.categoryName,
          qty: minQty,
        },
      ];
    }
    case 'setQty': {
      const min = action.item.moq || 1;
      const qty = Math.max(Number(action.qty) || min, min);
      return state.map((i) => (i.slug === action.item.slug ? { ...i, qty } : i));
    }
    case 'remove':
      return state.filter((i) => i.slug !== action.slug);
    case 'clear':
      return [];
    default:
      return state;
  }
}

export function CartProvider({ children, settings }) {
  // Settings come from the database (editable in /admin/settings) and fall back
  // to the values in src/lib/config.js when the database is not configured.
  const resolved = settings || settingsDefaults;

  const [items, dispatch] = useReducer(reducer, []);
  const [isOpen, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [shippingId, setShippingId] = useState('delivery');

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: 'hydrate', items: JSON.parse(raw) });
      const ship = window.localStorage.getItem(STORAGE_KEY + '.shipping');
      if (ship) setShippingId(ship);
    } catch (e) {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      /* ignore */
    }
  }, [items, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY + '.shipping', shippingId);
    } catch (e) {
      /* ignore */
    }
  }, [shippingId, ready]);

  const add = useCallback((product, qty) => {
    dispatch({ type: 'add', product, qty: qty || product.moq || 1 });
    setOpen(true);
  }, []);

  const value = useMemo(() => {
    const activeShipping = resolved.shipping.filter((m) => m.enabled !== false);
    const method =
      activeShipping.find((m) => m.id === shippingId) || activeShipping[0] || resolved.shipping[0];

    const subtotal = items.reduce((sum, i) => sum + lineTotal(i), 0);
    const gstAmount = items.reduce(
      (sum, i) => sum + lineTotal(i) * gstRateFor(i.category, resolved.gst),
      0,
    );
    const count = items.reduce((sum, i) => sum + i.qty, 0);
    const lines = items.length;
    const gross = subtotal + gstAmount;
    const shipping = shippingFor(method, gross);
    const total = gross + shipping;

    return {
      settings: resolved,
      store: resolved.store,
      gst: resolved.gst,
      shippingMethods: activeShipping.length ? activeShipping : resolved.shipping,
      paymentMethods: resolved.payments.filter((p) => p.enabled !== false),
      storeOpen: resolved.storeOpen,
      items,
      count,
      lines,
      subtotal,
      gst: gstAmount,
      shipping,
      total,
      gross,
      shippingId,
      setShippingId,
      shippingMethod: method,
      freeDeliveryGap: freeDeliveryGap(method, gross),
      freeDeliveryThreshold: method?.freeAbove || null,
      freeDeliverySaving: shippingFor(method, 0),
      isOpen,
      openCart: () => setOpen(true),
      closeCart: () => setOpen(false),
      add,
      setQty: (item, qty) => dispatch({ type: 'setQty', item, qty }),
      remove: (slug) => dispatch({ type: 'remove', slug }),
      clear: () => dispatch({ type: 'clear' }),
    };
  }, [items, isOpen, shippingId, add, resolved]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
