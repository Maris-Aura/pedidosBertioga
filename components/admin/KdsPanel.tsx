"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  assignCourier,
  createTestDeliveryOrder,
  getOrdersByStore,
  getStoreCatalog,
  subscribeDemoDb,
  updateOrderStatus,
} from "@/lib/demo-db";
import { startLoopAlarm } from "@/lib/audio";
import { KDS_ACTIVE_STATUSES, nextStatus } from "@/lib/format";
import type { OrderStatus, OrderWithDetails, StoreCatalog } from "@/lib/types";
import { SoundAlert } from "./SoundAlert";
import { OrderCard } from "./OrderCard";
import { ThermalReceipt } from "./ThermalReceipt";
import { startOrdersPolling } from "@/lib/orders-sync";

export function KdsPanel({ storeSlug }: { storeSlug: string }) {
  const [catalog, setCatalog] = useState<StoreCatalog | null>(null);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [alarmOn, setAlarmOn] = useState(false);
  const [printOrder, setPrintOrder] = useState<OrderWithDetails | null>(null);
  const [receiptWidth, setReceiptWidth] = useState<"80mm" | "58mm">("80mm");
  const [showArchived, setShowArchived] = useState(false);
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
      if (pendingIds.length === 0) setAlarmOn(false);
    };

    load();
    const data = getStoreCatalog(storeSlug);
    const stopPoll = data ? startOrdersPolling(data.store.id, load) : undefined;
    const unsub = subscribeDemoDb(load);
    return () => {
      unsub();
      stopPoll?.();
    };
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

  function advance(order: OrderWithDetails) {
    const upcoming = nextStatus(order.status);
    if (!upcoming) return;
    updateOrderStatus(order.id, upcoming);
  }

  function print(order: OrderWithDetails, width: "80mm" | "58mm") {
    setReceiptWidth(width);
    setPrintOrder(order);
    document.documentElement.style.setProperty("--receipt-width", width);
    window.setTimeout(() => window.print(), 50);
  }

  const columns = useMemo(() => {
    const map: Record<OrderStatus, OrderWithDetails[]> = {
      pending: [],
      preparing: [],
      out_for_delivery: [],
      delivered: [],
    };
    for (const order of orders) {
      map[order.status].push(order);
    }
    return map;
  }, [orders]);

  if (!catalog) {
    return <p className="p-6">Loja não encontrada.</p>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <SoundAlert visible={alarmOn} />

      <div>
        <h1 className="text-2xl font-black text-slate-900">Pedidos da cozinha</h1>
        <p className="text-xs text-gray-500">
          {catalog.store.name} · colunas por status · o alarme só para ao aceitar
        </p>
        <button
          type="button"
          onClick={() => createTestDeliveryOrder(storeSlug)}
          className="mt-2 text-xs font-bold bg-white border px-3 py-1.5 rounded-lg"
        >
          Criar pedido teste
        </button>
      </div>

      {orders.filter((order) => order.status !== "delivered").length === 0 ? (
        <div className="bg-white border rounded-xl p-8 text-center text-sm text-gray-500">
          Nenhum pedido em andamento. O alarme toca quando um novo pedido chegar.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {KDS_ACTIVE_STATUSES.map((status) => (
            <section key={status} className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wide text-slate-500 bg-white border rounded-lg px-3 py-2">
                {status === "pending"
                  ? "Aguardando"
                  : status === "preparing"
                    ? "Em produção"
                    : "Entrega / Retirada"}{" "}
                · {columns[status].length}
              </h2>
              {columns[status].map((order) => (
                <OrderCard
                  key={order.id}
                  store={catalog.store}
                  storeSlug={storeSlug}
                  order={order}
                  couriers={catalog.couriers}
                  onAdvance={() => advance(order)}
                  onAssignCourier={(courierId) => assignCourier(order.id, courierId || null)}
                  onPrint={() => print(order, receiptWidth)}
                />
              ))}
            </section>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-gray-600">Largura da comanda:</span>
        {(["80mm", "58mm"] as const).map((width) => (
          <button
            key={width}
            type="button"
            onClick={() => setReceiptWidth(width)}
            className={`px-3 py-1.5 rounded-lg font-bold border ${
              receiptWidth === width ? "bg-slate-900 text-white" : "bg-white"
            }`}
          >
            {width}
          </button>
        ))}
      </div>

      {columns.delivered.length > 0 ? (
        <section>
          <button
            type="button"
            onClick={() => setShowArchived((value) => !value)}
            className="text-xs font-bold text-gray-600"
          >
            {showArchived ? "▾" : "▸"} Arquivados ({columns.delivered.length})
          </button>
          {showArchived ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              {columns.delivered.map((order) => (
                <OrderCard
                  key={order.id}
                  store={catalog.store}
                  storeSlug={storeSlug}
                  order={order}
                  couriers={catalog.couriers}
                  onAdvance={() => advance(order)}
                  onAssignCourier={(courierId) => assignCourier(order.id, courierId || null)}
                  onPrint={() => print(order, receiptWidth)}
                />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {printOrder ? (
        <ThermalReceipt store={catalog.store} order={printOrder} width={receiptWidth} />
      ) : null}
    </div>
  );
}
