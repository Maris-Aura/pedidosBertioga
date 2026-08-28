"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  assignCourier,
  demoLogout,
  getOrdersByStore,
  getStoreCatalog,
  subscribeDemoDb,
  updateOrderStatus,
} from "@/lib/demo-db";
import { startLoopAlarm } from "@/lib/audio";
import { nextStatus } from "@/lib/format";
import type { OrderWithDetails, StoreCatalog } from "@/lib/types";
import { SoundAlert } from "./SoundAlert";
import { OrderCard } from "./OrderCard";
import { ThermalReceipt } from "./ThermalReceipt";

export function KdsPanel({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();
  const [catalog, setCatalog] = useState<StoreCatalog | null>(null);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [alarmOn, setAlarmOn] = useState(false);
  const [printOrder, setPrintOrder] = useState<OrderWithDetails | null>(null);
  const seenIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);
  const alarmRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    const load = () => {
      const data = getStoreCatalog(storeSlug);
      setCatalog(data);
      if (!data) return;
      const nextOrders = getOrdersByStore(data.store.id);
      setOrders(nextOrders);

      const pendingIds = nextOrders
        .filter((order) => order.status === "pending")
        .map((order) => order.id);

      if (!initialized.current) {
        pendingIds.forEach((id) => seenIds.current.add(id));
        initialized.current = true;
        if (pendingIds.length > 0) setAlarmOn(true);
        return;
      }

      const hasNew = pendingIds.some((id) => !seenIds.current.has(id));
      pendingIds.forEach((id) => seenIds.current.add(id));
      if (hasNew) setAlarmOn(true);
    };

    load();
    return subscribeDemoDb(load);
  }, [storeSlug]);

  useEffect(() => {
    if (alarmOn) {
      alarmRef.current?.stop();
      alarmRef.current = startLoopAlarm();
    } else {
      alarmRef.current?.stop();
      alarmRef.current = null;
    }
    return () => {
      alarmRef.current?.stop();
    };
  }, [alarmOn]);

  function silence() {
    setAlarmOn(false);
  }

  function advance(order: OrderWithDetails) {
    const upcoming = nextStatus(order.status);
    if (!upcoming) return;
    updateOrderStatus(order.id, upcoming);
    if (order.status === "pending") {
      const stillPending = orders.some(
        (item) => item.id !== order.id && item.status === "pending",
      );
      if (!stillPending) setAlarmOn(false);
    }
  }

  function print(order: OrderWithDetails) {
    setPrintOrder(order);
    window.setTimeout(() => window.print(), 50);
  }

  if (!catalog) {
    return <p className="p-6">Loja não encontrada.</p>;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <SoundAlert visible={alarmOn} onSilence={silence} />

      <div className="flex justify-between items-center border-b pb-4 gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Painel KDS / Cozinha</h1>
          <p className="text-xs text-gray-500">{catalog.store.name} · Pedidos em tempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/${storeSlug}/admin/settings`}
            className="text-xs bg-white border font-bold px-3 py-2 rounded-lg"
          >
            Configurações
          </Link>
          <button
            type="button"
            onClick={() => {
              demoLogout();
              router.push(`/${storeSlug}/admin/login`);
            }}
            className="text-xs bg-slate-100 font-bold px-3 py-2 rounded-lg"
          >
            Sair
          </button>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
            Loja Aberta
          </span>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border rounded-xl p-8 text-center text-sm text-gray-500">
          Nenhum pedido no momento. O alarme toca automaticamente quando um novo pedido chegar.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              store={catalog.store}
              order={order}
              couriers={catalog.couriers}
              onAdvance={() => advance(order)}
              onAssignCourier={(courierId) => assignCourier(order.id, courierId || null)}
              onPrint={() => print(order)}
            />
          ))}
        </div>
      )}

      {printOrder ? <ThermalReceipt store={catalog.store} order={printOrder} /> : null}
    </div>
  );
}
