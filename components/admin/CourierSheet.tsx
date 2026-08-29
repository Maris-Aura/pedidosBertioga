"use client";

import { useEffect, useMemo, useState } from "react";
import { getOrdersByStore, getStoreCatalog, subscribeDemoDb } from "@/lib/demo-db";
import { buildCourierReport, type CourierPeriod } from "@/lib/courier-report";
import { formatCurrency, formatDateTime, orderStatusLabel, shortOrderId } from "@/lib/format";
import type { OrderWithDetails, StoreCatalog } from "@/lib/types";
import { ChevronDown } from "lucide-react";

const PERIODS: { id: CourierPeriod; label: string }[] = [
  { id: "day", label: "Hoje" },
  { id: "week", label: "Semana" },
  { id: "month", label: "Mês" },
];

export function CourierSheet({ storeSlug }: { storeSlug: string }) {
  const [catalog, setCatalog] = useState<StoreCatalog | null>(null);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [period, setPeriod] = useState<CourierPeriod>("day");
  const [openId, setOpenId] = useState<string | null>(null);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      const data = getStoreCatalog(storeSlug);
      setCatalog(data);
      if (data) setOrders(getOrdersByStore(data.store.id));
    };
    load();
    return subscribeDemoDb(load);
  }, [storeSlug]);

  const rows = useMemo(
    () => (catalog ? buildCourierReport(orders, catalog.couriers, period) : []),
    [catalog, orders, period],
  );

  if (!catalog) return <p className="p-6">Loja não encontrada.</p>;

  const totals = rows.reduce(
    (acc, row) => ({
      deliveries: acc.deliveries + row.deliveries,
      fees: acc.fees + row.fees,
      sales: acc.sales + row.sales,
    }),
    { deliveries: 0, fees: 0, sales: 0 },
  );

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div>
        <h1 className="text-2xl font-black">Planilha dos motoboys</h1>
        <p className="text-sm text-gray-500 mt-1">
          Entregas concluídas, taxas e histórico de cada motoboy.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {PERIODS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setPeriod(item.id);
              setOpenOrderId(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              period === item.id ? "bg-slate-900 text-white" : "bg-white border"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[11px] font-black uppercase text-gray-500 bg-slate-50 border-b">
          <div className="col-span-5">Motoboy</div>
          <div className="col-span-2 text-right">Entregas</div>
          <div className="col-span-2 text-right">Taxas</div>
          <div className="col-span-3 text-right">Pedidos</div>
        </div>

        {rows.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">Cadastre um motoboy em Configurações.</p>
        ) : (
          rows.map((row) => {
            const open = openId === row.id;
            return (
              <div key={row.id} className="border-b last:border-b-0">
                <button
                  type="button"
                  onClick={() => {
                    setOpenId(open ? null : row.id);
                    setOpenOrderId(null);
                  }}
                  className="w-full grid grid-cols-12 gap-2 px-3 py-3 text-sm items-center text-left"
                >
                  <div className="col-span-5 flex items-center gap-2 min-w-0">
                    <span
                      className={`size-6 rounded-full border flex items-center justify-center shrink-0 ${
                        open ? "bg-slate-900 text-white" : "bg-white"
                      }`}
                    >
                      <ChevronDown
                        className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`}
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="font-bold block truncate">{row.name}</span>
                      <span className="text-[11px] text-gray-500">{row.phone || "sem telefone"}</span>
                    </span>
                  </div>
                  <div className="col-span-2 text-right font-bold">{row.deliveries}</div>
                  <div className="col-span-2 text-right">{formatCurrency(row.fees)}</div>
                  <div className="col-span-3 text-right">{formatCurrency(row.sales)}</div>
                </button>

                {open ? (
                  <div className="px-3 pb-3 space-y-2">
                    {row.orders.length === 0 ? (
                      <p className="text-xs text-gray-500 pl-8">
                        Nenhuma entrega atribuída neste período.
                      </p>
                    ) : (
                      row.orders.map((order) => {
                        const expanded = openOrderId === order.id;
                        return (
                          <div key={order.id} className="ml-8 border rounded-lg bg-slate-50">
                            <button
                              type="button"
                              onClick={() => setOpenOrderId(expanded ? null : order.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs"
                            >
                              <span
                                className={`size-5 rounded border flex items-center justify-center font-black ${
                                  expanded
                                    ? "bg-emerald-600 text-white border-emerald-600"
                                    : "bg-white"
                                }`}
                              >
                                {expanded ? "v" : ""}
                              </span>
                              <span className="font-mono font-bold">#{shortOrderId(order.id)}</span>
                              <span className="text-gray-500">{formatDateTime(order.created_at)}</span>
                              <span className="ml-auto font-bold">
                                {formatCurrency(order.delivery_fee)}
                              </span>
                            </button>
                            {expanded ? (
                              <div className="px-3 pb-3 text-xs space-y-1 border-t">
                                <div className="pt-2">
                                  <span className="text-gray-500">Cliente</span>
                                  <div className="font-bold">{order.customer_name}</div>
                                </div>
                                <div>
                                  <span className="text-gray-500">Status</span>
                                  <div className="font-bold">
                                    {orderStatusLabel(order.status, "delivery")}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-500">Endereço</span>
                                  <div className="font-bold">
                                    {[order.address, order.neighborhood].filter(Boolean).join(" · ") ||
                                      "Sem endereço"}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-500">Itens</span>
                                  <div>
                                    {order.items
                                      .map((item) => `${item.quantity}x ${item.name}`)
                                      .join(", ")}
                                  </div>
                                </div>
                                <div className="flex justify-between pt-1">
                                  <span>Taxa</span>
                                  <span className="font-bold">
                                    {formatCurrency(order.delivery_fee)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Total do pedido</span>
                                  <span className="font-bold">
                                    {formatCurrency(order.total_amount)}
                                  </span>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : null}
              </div>
            );
          })
        )}

        <div className="grid grid-cols-12 gap-2 px-3 py-3 text-sm font-black bg-slate-100">
          <div className="col-span-5">Total</div>
          <div className="col-span-2 text-right">{totals.deliveries}</div>
          <div className="col-span-2 text-right">{formatCurrency(totals.fees)}</div>
          <div className="col-span-3 text-right">{formatCurrency(totals.sales)}</div>
        </div>
      </div>
    </div>
  );
}
