"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getOrdersByStore,
  getStoreCatalog,
  subscribeDemoDb,
  updateOrderStatus,
} from "@/lib/demo-db";
import { startOrdersPolling } from "@/lib/orders-sync";
import { formatCurrency, formatDateTime, orderStatusLabel, shortOrderId } from "@/lib/format";
import { fullDeliveryAddress } from "@/lib/maps";
import { MapPreview } from "@/components/ui/MapPreview";
import type { OrderWithDetails, StoreCatalog } from "@/lib/types";

export function CourierPanel({
  storeSlug,
  courierId,
}: {
  storeSlug: string;
  courierId: string;
}) {
  const [catalog, setCatalog] = useState<StoreCatalog | null>(null);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);

  useEffect(() => {
    const load = () => {
      const data = getStoreCatalog(storeSlug);
      setCatalog(data);
      if (data) setOrders(getOrdersByStore(data.store.id));
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

  const courier = catalog?.couriers.find((item) => item.id === courierId);
  const mine = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.courier_id === courierId &&
          order.order_type === "delivery" &&
          order.status !== "delivered",
      ),
    [courierId, orders],
  );

  if (!catalog) return <p className="p-6">Loja não encontrada.</p>;
  if (!courier) {
    return (
      <div className="max-w-lg mx-auto mt-16 bg-white border rounded-2xl p-6 text-center">
        <h1 className="font-black text-xl">Link de entregador inválido</h1>
        <p className="text-sm text-gray-500 mt-2">Peça um novo link na loja.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      <div>
        <p className="text-xs text-gray-500">{catalog.store.name}</p>
        <h1 className="text-2xl font-black">Entregas de {courier.name}</h1>
      </div>
      {mine.length === 0 ? (
        <p className="bg-white border rounded-xl p-6 text-sm text-gray-500">
          Nenhuma entrega em andamento.
        </p>
      ) : (
        mine.map((order) => {
          const query = fullDeliveryAddress(order.address, order.neighborhood?.name);
          return (
            <article key={order.id} className="bg-white border rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="font-mono font-bold">#{shortOrderId(order.id)}</span>
                <span className="text-xs">{orderStatusLabel(order.status, "delivery")}</span>
              </div>
              <div className="text-sm font-bold">{order.customer_name}</div>
              <div className="text-xs text-gray-500">{order.customer_phone}</div>
              <div className="text-sm">{query}</div>
              <div className="text-xs text-gray-500">{formatDateTime(order.created_at)}</div>
              <MapPreview query={query} />
              <div className="text-sm font-black">{formatCurrency(order.total_amount)}</div>
              <button
                type="button"
                onClick={() => updateOrderStatus(order.id, "delivered")}
                className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm"
              >
                Marcar entregue
              </button>
            </article>
          );
        })
      )}
    </div>
  );
}
