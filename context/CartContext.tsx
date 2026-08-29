"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem, Store } from "@/lib/types";

type CartContextValue = {
  store: Store;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function storageKey(slug: string) {
  return `pb-cart:${slug}`;
}

function sameLine(a: Omit<CartItem, "id" | "quantity">, b: CartItem) {
  return (
    a.productId === b.productId &&
    a.observation === b.observation &&
    a.unitPrice === b.unitPrice &&
    JSON.stringify(a.optionsSelected) === JSON.stringify(b.optionsSelected)
  );
}

export function CartProvider({
  store,
  children,
}: {
  store: Store;
  children: ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey(store.slug));
    if (!raw) return;
    try {
      setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      setItems([]);
    }
  }, [store.slug]);

  useEffect(() => {
    localStorage.setItem(storageKey(store.slug), JSON.stringify(items));
  }, [items, store.slug]);

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
    setItems((current) => {
      const match = current.find((entry) => sameLine(item, entry));
      if (match) {
        return current.map((entry) =>
          entry.id === match.id
            ? { ...entry, quantity: entry.quantity + item.quantity }
            : entry,
        );
      }
      return [...current, { ...item, id: crypto.randomUUID() }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((current) => {
      if (quantity < 1) return current.filter((item) => item.id !== id);
      return current.map((item) => (item.id === id ? { ...item, quantity } : item));
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    return {
      store,
      items,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      clear,
    };
  }, [addItem, clear, items, removeItem, store, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de CartProvider");
  }
  return context;
}
