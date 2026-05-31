'use client';

import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import {
  calculateShipping,
  DEFAULT_SHIPPING_CONFIG,
  settingsToConfig,
  type ShippingConfig,
} from '@/lib/shipping';

export interface CartItem {
  productId: string;
  productSlug: string;
  productName: string;
  size: string;
  color?: string;
  price: number;
  quantity: 1;
  image: string;
}

interface CartState {
  items: CartItem[];
  hydrated: boolean;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { productId: string; size: string; color?: string } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const exists = state.items.find(
        (i) => i.productId === action.payload.productId && i.size === action.payload.size && i.color === action.payload.color
      );
      if (exists) return state;
      return { ...state, items: [...state.items, action.payload] };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(
          (i) => !(i.productId === action.payload.productId && i.size === action.payload.size && i.color === action.payload.color)
        ),
      };
    case 'CLEAR_CART':
      return { ...state, items: [] };
    case 'LOAD_CART':
      return { items: action.payload, hydrated: true };
    default:
      return state;
  }
}

interface CartContextType {
  items: CartItem[];
  hydrated: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size: string, color?: string) => void;
  clearCart: () => void;
  subtotal: number;
  shipping: number;
  total: number;
  itemCount: number;
  shippingConfig: ShippingConfig;
  untilFreeShipping: number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], hydrated: false });
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig>(DEFAULT_SHIPPING_CONFIG);

  useEffect(() => {
    fetch('/api/shipping-settings')
      .then((r) => r.json())
      .then((d) => setShippingConfig(settingsToConfig(d)))
      .catch(() => {});
  }, []);

  // Hydrate from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('shehri_cart');
    try {
      dispatch({ type: 'LOAD_CART', payload: saved ? JSON.parse(saved) : [] });
    } catch {
      dispatch({ type: 'LOAD_CART', payload: [] });
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (state.hydrated) {
      localStorage.setItem('shehri_cart', JSON.stringify(state.items));
    }
  }, [state.items, state.hydrated]);

  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = calculateShipping(subtotal, shippingConfig);
  const total = subtotal + shipping;
  const untilFreeShipping = Math.max(0, shippingConfig.freeShippingAbove - subtotal);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        hydrated: state.hydrated,
        addItem: (item) => dispatch({ type: 'ADD_ITEM', payload: item }),
        removeItem: (productId, size, color) =>
          dispatch({ type: 'REMOVE_ITEM', payload: { productId, size, color } }),
        clearCart: () => dispatch({ type: 'CLEAR_CART' }),
        subtotal,
        shipping,
        total,
        itemCount: state.items.length,
        shippingConfig,
        untilFreeShipping,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
