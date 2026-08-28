"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { CartProvider } from "@/context/CartContext";
import { getStoreBySlug } from "@/lib/demo-db";
import type { Store } from "@/lib/types";

export function StoreShell({
  storeSlug,
  children,
}: {
  storeSlug: string;
  children: ReactNode;
}) {
  const [store, setStore] = useState<Store | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setStore(getStoreBySlug(storeSlug));
    setReady(true);
  }, [storeSlug]);

  if (!ready) {
    return <div className="p-8 text-center text-sm text-gray-500">Carregando loja...</div>;
  }

  if (!store) {
    return (
      <div className="max-w-lg mx-auto mt-20 bg-white p-6 rounded-2xl text-center">
        <h1 className="font-black text-xl">Loja não encontrada</h1>
        <Link href="/" className="text-sm underline mt-3 inline-block">
          Voltar ao início
        </Link>
      </div>
    );
  }

  if (!store.active) {
    return (
      <div className="max-w-lg mx-auto mt-20 bg-white p-6 rounded-2xl text-center">
        <h1 className="font-black text-xl">Loja temporariamente suspensa</h1>
        <p className="text-sm text-gray-500 mt-2">Tente novamente mais tarde.</p>
      </div>
    );
  }

  return (
    <div style={{ ["--store-color" as string]: store.primary_color }}>
      <header className="bg-slate-900 text-white p-3 shadow-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center text-sm">
          <Link href={`/${store.slug}`} className="font-bold text-base" style={{ color: store.primary_color }}>
            {store.name}
          </Link>
          <Link href={`/${store.slug}/admin`} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg">
            Painel da loja
          </Link>
        </div>
      </header>
      <CartProvider store={store}>{children}</CartProvider>
    </div>
  );
}
