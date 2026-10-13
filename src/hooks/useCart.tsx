import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CartItem, Customer, Product } from '../types';
import { playBeep } from '../utils/printReceiptHelper';
import { getStoredProducts, getStoredSettings } from '../utils/storage';

interface CartContextType {
  items: CartItem[];
  lastActiveItem: CartItem | null;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setItemDiscount: (productId: string, discount: number) => void;
  discount: number;
  setDiscount: (discount: number) => void;
  surcharge: number;
  setSurcharge: (surcharge: number) => void;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  notes: string;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  subtotal: number;
  total: number;
  totalItems: number;
  loadItems: (items: CartItem[], customer?: Customer | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'odelot_pdv_cart_v3';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    // Clear legacy seed cart
    try {
      localStorage.removeItem('odelot_seeded_cart_v2');
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return [];
  });

  const [lastActiveItem, setLastActiveItem] = useState<CartItem | null>(() => {
    return items[0] || null;
  });

  const [discount, setDiscount] = useState<number>(0);
  const [surcharge, setSurcharge] = useState<number>(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    if (items.length > 0 && !lastActiveItem) {
      setLastActiveItem(items[0]);
    } else if (items.length === 0) {
      setLastActiveItem(null);
    }
  }, [items, lastActiveItem]);

  const addItem = (product: Product, quantity: number = 1) => {
    const settings = getStoredSettings();
    if (settings.enableSound) {
      playBeep();
    }

    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const currentItem = updated[existingIndex];
        const newQty = currentItem.quantity + quantity;
        const modifiedItem: CartItem = {
          ...currentItem,
          quantity: newQty,
          subtotal: Math.max(0, newQty * currentItem.unitPrice - currentItem.discount),
        };
        updated[existingIndex] = modifiedItem;
        setLastActiveItem(modifiedItem);
        return updated;
      } else {
        const newItem: CartItem = {
          id: `item-${product.id}-${Date.now()}`,
          product,
          quantity,
          unitPrice: product.sellPrice,
          discount: 0,
          subtotal: quantity * product.sellPrice,
        };
        setLastActiveItem(newItem);
        return [...prev, newItem];
      }
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => {
      const filtered = prev.filter((item) => item.product.id !== productId);
      if (lastActiveItem?.product.id === productId) {
        setLastActiveItem(filtered[0] || null);
      }
      return filtered;
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const updatedItem: CartItem = {
            ...item,
            quantity,
            subtotal: Math.max(0, quantity * item.unitPrice - item.discount),
          };
          setLastActiveItem(updatedItem);
          return updatedItem;
        }
        return item;
      })
    );
  };

  const setItemDiscount = (productId: string, itemDiscount: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const validDiscount = Math.max(0, Math.min(itemDiscount, item.quantity * item.unitPrice));
          return {
            ...item,
            discount: validDiscount,
            subtotal: Math.max(0, item.quantity * item.unitPrice - validDiscount),
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setLastActiveItem(null);
    setDiscount(0);
    setSurcharge(0);
    setSelectedCustomer(null);
    setNotes('');
  };

  const loadItems = (loadedItems: CartItem[], customer?: Customer | null) => {
    setItems(loadedItems);
    setLastActiveItem(loadedItems[0] || null);
    if (customer) setSelectedCustomer(customer);
  };

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  }, [items]);

  const itemsTotalDiscount = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.discount || 0), 0);
  }, [items]);

  const total = useMemo(() => {
    const rawTotal = subtotal - itemsTotalDiscount - (discount || 0) + (surcharge || 0);
    return Math.max(0, rawTotal);
  }, [subtotal, itemsTotalDiscount, discount, surcharge]);

  const totalItems = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        lastActiveItem,
        addItem,
        removeItem,
        updateQuantity,
        setItemDiscount,
        discount,
        setDiscount,
        surcharge,
        setSurcharge,
        selectedCustomer,
        setSelectedCustomer,
        notes,
        setNotes,
        clearCart,
        subtotal,
        total,
        totalItems,
        loadItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
