"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { CartProvider } from "@/context/CartContext";
import { getStoreBySlug, subscribeDemoDb } from "@/lib/demo-db";
import type { Store } from "@/lib/types";
import { StoreMark } from "@/components/ui/StoreMark";

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
    const load = () => {
      setStore(getStoreBySlug(storeSlug));
      setReady(true);
    };
    load();
    return subscribeDemoDb(load);
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
      <header className="bg-slate-900 text-white px-3 py-2.5 sticky top-0 z-50 pt-[max(0.625rem,env(safe-area-inset-top))]">
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-3 text-sm">
          <Link href={`/${store.slug}`} className="flex items-center gap-2 min-w-0">
            <StoreMark store={store} size={36} />
            <span className="min-w-0">
              <span className="font-bold text-base block truncate" style={{ color: store.primary_color }}>
                {store.name}
              </span>
              <span className="text-[11px] text-slate-300 block">
                {store.hours} · Bertioga
              </span>
            </span>
          </Link>
          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
              store.accepting_orders
                ? "bg-emerald-400/20 text-emerald-200"
                : "bg-red-400/20 text-red-200"
            }`}
          >
            {store.accepting_orders ? "Aberta" : "Fechada"}
          </span>
        </div>
      </header>
      <CartProvider store={store}>{children}</CartProvider>
    </div>
  );
}
