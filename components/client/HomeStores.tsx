"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getActiveStores } from "@/lib/demo-db";
import type { Store } from "@/lib/types";

export function HomeStores() {
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    setStores(getActiveStores());
  }, []);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="bg-slate-900 text-white p-6 rounded-2xl">
        <h1 className="text-3xl font-black">Pedidos Bertioga</h1>
        <p className="text-sm text-slate-300 mt-2">
          Escolha a loja para abrir o cardápio digital.
        </p>
      </div>
      <div className="grid gap-4">
        {stores.map((store) => (
          <Link
            key={store.id}
            href={`/${store.slug}`}
            className="bg-white border rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition"
          >
            <div>
              <h2 className="font-black text-lg">{store.name}</h2>
              <p className="text-xs text-gray-500">/{store.slug}</p>
            </div>
            <span
              className="text-xs font-black px-3 py-1.5 rounded-lg text-slate-950"
              style={{ backgroundColor: store.primary_color }}
            >
              Ver cardápio
            </span>
          </Link>
        ))}
      </div>
      <p className="text-xs text-gray-400 text-center">
        <Link href="/master" className="underline">
          Acesso Master
        </Link>
      </p>
    </main>
  );
}
