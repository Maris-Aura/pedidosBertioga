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
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function storageKey(slug: string) {
  return `pb-cart:${slug}`;
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
    setItems((current) => [
      ...current,
      { ...item, id: crypto.randomUUID() },
    ]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    return { store, items, itemCount, subtotal, addItem, removeItem, clear };
  }, [addItem, clear, items, removeItem, store]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de CartProvider");
  }
  return context;
}
