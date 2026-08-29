"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getActiveStores, subscribeDemoDb } from "@/lib/demo-db";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/site";
import { contrastText } from "@/lib/format";
import type { Store } from "@/lib/types";
import { StoreMark } from "@/components/ui/StoreMark";

export function HomeStores() {
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    const load = () => setStores(getActiveStores());
    load();
    return subscribeDemoDb(load);
  }, []);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="bg-slate-900 text-white p-6 rounded-2xl">
        <p className="text-xs font-bold tracking-wide text-amber-300 uppercase">
          Delivery em Bertioga
        </p>
        <h1 className="text-3xl font-black mt-1">{SITE_NAME}</h1>
        <p className="text-sm text-slate-300 mt-2">
          Cardápio digital das lojas locais. Peça pelo celular e acompanhe o
          status em tempo real.
        </p>
        <p className="text-xs text-slate-500 mt-3">{SITE_DOMAIN}</p>
      </div>
      <div className="grid gap-4">
        {stores.map((store) => (
          <Link
            key={store.id}
            href={`/${store.slug}`}
            className="bg-white border rounded-2xl p-4 flex items-center gap-4 hover:border-slate-300 transition"
          >
            <StoreMark store={store} size={56} />
            <div className="flex-1 min-w-0">
              <h2 className="font-black text-lg leading-tight">{store.name}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {store.hours} · Bertioga
              </p>
            </div>
            <div className="text-right shrink-0 space-y-1">
              <span
                className={`block text-[11px] font-bold ${
                  store.accepting_orders ? "text-emerald-700" : "text-red-600"
                }`}
              >
                {store.accepting_orders ? "Aberta agora" : "Fechada"}
              </span>
              <span
                className="text-xs font-black px-3 py-1.5 rounded-lg inline-block"
                style={{
                  backgroundColor: store.primary_color,
                  color: contrastText(store.primary_color),
                }}
              >
                Ver cardápio
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
