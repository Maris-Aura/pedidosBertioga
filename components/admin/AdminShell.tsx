"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  demoLogout,
  getStoreBySlug,
  setAcceptingOrders,
  subscribeDemoDb,
} from "@/lib/demo-db";
import type { Store } from "@/lib/types";
import { StoreMark } from "@/components/ui/StoreMark";

export function AdminShell({
  storeSlug,
  children,
}: {
  storeSlug: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [store, setStore] = useState<Store | null>(null);

  useEffect(() => {
    const load = () => setStore(getStoreBySlug(storeSlug));
    load();
    return subscribeDemoDb(load);
  }, [storeSlug]);

  if (!store) {
    return <p className="p-6 text-sm text-gray-500">Carregando painel...</p>;
  }

  const onSettings = pathname?.includes("/settings");
  const onCouriers = pathname?.includes("/couriers");
  const onDashboard = pathname?.includes("/dashboard");
  const onOrders = !onSettings && !onCouriers && !onDashboard;

  return (
    <div>
      <header className="bg-slate-900 text-white px-3 py-2.5 sticky top-0 z-50 pt-[max(0.625rem,env(safe-area-inset-top))]">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <StoreMark store={store} size={32} />
            <div className="min-w-0">
              <div className="font-bold text-sm truncate">{store.name}</div>
              <div className="text-[11px] text-slate-400">Painel da cozinha</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAcceptingOrders(store.id, !store.accepting_orders)}
              className={`text-[11px] font-bold px-2.5 py-1.5 rounded-full ${
                store.accepting_orders
                  ? "bg-emerald-400 text-slate-950"
                  : "bg-red-500 text-white"
              }`}
            >
              {store.accepting_orders ? "Loja aberta" : "Loja fechada"}
            </button>
            <Link
              href={`/${storeSlug}/admin`}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold ${
                onOrders ? "bg-white text-slate-900" : "bg-slate-800 hover:bg-slate-700"
              }`}
            >
              Pedidos
            </Link>
            <Link
              href={`/${storeSlug}/admin/dashboard`}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold ${
                onDashboard ? "bg-white text-slate-900" : "bg-slate-800 hover:bg-slate-700"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href={`/${storeSlug}/admin/couriers`}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold ${
                onCouriers ? "bg-white text-slate-900" : "bg-slate-800 hover:bg-slate-700"
              }`}
            >
              Planilha
            </Link>
            <Link
              href={`/${storeSlug}/admin/settings`}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold ${
                onSettings ? "bg-white text-slate-900" : "bg-slate-800 hover:bg-slate-700"
              }`}
            >
              Configurações
            </Link>
            <button
              type="button"
              onClick={() => {
                demoLogout();
                router.push(`/${storeSlug}/admin/login`);
              }}
              className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg font-bold"
            >
              Sair
            </button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
