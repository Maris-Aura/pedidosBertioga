"use client";

import { useEffect, useMemo, useState } from "react";
import { getOrdersByStore, getStoreCatalog, subscribeDemoDb } from "@/lib/demo-db";
import { buildStoreDashboard, changePercent, type SeriesPoint } from "@/lib/store-dashboard";

function deltaOrNone(current: number, previous: number) {
  if (current === 0 && previous === 0) return undefined;
  return changePercent(current, previous);
}
import { formatCurrency, PAYMENT_LABEL } from "@/lib/format";
import type { OrderWithDetails, StoreCatalog } from "@/lib/types";

export function StoreDashboard({ storeSlug }: { storeSlug: string }) {
  const [catalog, setCatalog] = useState<StoreCatalog | null>(null);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);

  useEffect(() => {
    const load = () => {
      const data = getStoreCatalog(storeSlug);
      setCatalog(data);
      if (data) setOrders(getOrdersByStore(data.store.id));
    };
    load();
    return subscribeDemoDb(load);
  }, [storeSlug]);

  const data = useMemo(() => buildStoreDashboard(orders), [orders]);

  if (!catalog) return <p className="p-6">Loja não encontrada.</p>;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div>
        <h1 className="text-2xl font-black">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          {catalog.store.name} · vendas, pedidos e clientes desta loja.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          title="Pedidos hoje"
          value={String(data.today.orders)}
          extra={formatCurrency(data.today.sales)}
          delta={deltaOrNone(data.today.orders, data.today.previousOrders)}
          compare="ontem"
        />
        <Kpi
          title="Pedidos na semana"
          value={String(data.week.orders)}
          extra={formatCurrency(data.week.sales)}
          delta={deltaOrNone(data.week.orders, data.week.previousOrders)}
          compare="semana passada"
        />
        <Kpi
          title="Pedidos no mês"
          value={String(data.month.orders)}
          extra={formatCurrency(data.month.sales)}
          delta={deltaOrNone(data.month.sales, data.month.previousSales)}
          compare="mês passado"
        />
        <Kpi
          title="Clientes cadastrados"
          value={String(data.customers)}
          extra={`${data.newCustomersMonth} novos neste mês`}
        />
        <Kpi title="Ticket médio do mês" value={formatCurrency(data.ticketMonth)} />
        <Kpi
          title="Em andamento"
          value={String(data.openOrders)}
          extra={`${data.deliveredMonth} entregues no mês`}
        />
        <Kpi title="Delivery no mês" value={String(data.deliveryOrders)} extra="com entrega" />
        <Kpi title="Retirada no mês" value={String(data.pickupOrders)} extra="no balcão" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Vendas dos últimos 14 dias" series={data.lastDays} color={catalog.store.primary_color} />
        <ChartCard title="Valor mês a mês" series={data.months} color={catalog.store.primary_color} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="bg-white border rounded-xl p-4 space-y-3">
          <h2 className="font-bold">Clientes deste mês</h2>
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Novos" value={data.newCustomersMonth} />
            <MiniStat label="Recorrentes" value={data.returningCustomersMonth} />
          </div>
          <p className="text-xs text-gray-500">
            Cliente é quem já fez pedido nesta loja, identificado pelo WhatsApp.
          </p>
        </section>

        <section className="bg-white border rounded-xl p-4 space-y-3">
          <h2 className="font-bold">Pagamentos do mês</h2>
          {data.payments.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum pagamento neste mês.</p>
          ) : (
            data.payments.map((item) => (
              <div key={item.method} className="flex justify-between text-sm border-b last:border-b-0 py-1.5">
                <span>
                  {PAYMENT_LABEL[item.method]} · {item.orders} pedido(s)
                </span>
                <span className="font-bold">{formatCurrency(item.sales)}</span>
              </div>
            ))
          )}
        </section>
      </div>

      <section className="bg-white border rounded-xl p-4 space-y-3">
        <h2 className="font-bold">Mais vendidos no mês</h2>
        {data.topProducts.length === 0 ? (
          <p className="text-sm text-gray-500">Ainda não há itens vendidos neste mês.</p>
        ) : (
          data.topProducts.map((product, index) => (
            <div key={product.name} className="flex justify-between gap-3 text-sm border-b last:border-b-0 py-1.5">
              <span>
                {index + 1}. {product.name} · {product.quantity} un.
              </span>
              <span className="font-bold">{formatCurrency(product.sales)}</span>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function Kpi({
  title,
  value,
  extra,
  delta,
  compare,
}: {
  title: string;
  value: string;
  extra?: string;
  delta?: number;
  compare?: string;
}) {
  return (
    <article className="bg-white border rounded-xl p-4 space-y-1">
      <div className="text-[11px] font-black uppercase text-gray-500">{title}</div>
      <div className="text-2xl font-black">{value}</div>
      {extra ? <div className="text-xs text-gray-500">{extra}</div> : null}
      {typeof delta === "number" && compare ? (
        <div className={`text-[11px] font-bold ${delta >= 0 ? "text-emerald-700" : "text-red-600"}`}>
          {delta >= 0 ? "+" : ""}
          {delta}% vs {compare}
        </div>
      ) : null}
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-50 border rounded-lg p-3">
      <div className="text-[11px] font-bold text-gray-500">{label}</div>
      <div className="text-xl font-black">{value}</div>
    </div>
  );
}

function ChartCard({
  title,
  series,
  color,
}: {
  title: string;
  series: SeriesPoint[];
  color: string;
}) {
  const max = Math.max(...series.map((item) => item.sales), 0);

  return (
    <section className="bg-white border rounded-xl p-4 space-y-3">
      <div className="flex items-end justify-between gap-2">
        <h2 className="font-bold">{title}</h2>
        <span className="text-xs font-bold text-gray-500">
          {formatCurrency(series.reduce((sum, item) => sum + item.sales, 0))}
        </span>
      </div>
      <div className="h-44 flex items-end gap-1.5">
        {series.map((item) => {
          const height = max > 0 ? Math.max(6, Math.round((item.sales / max) * 100)) : 6;
          return (
            <div key={item.key} className="flex-1 min-w-0 h-full flex flex-col justify-end items-center gap-1">
              <div
                title={`${item.label}: ${formatCurrency(item.sales)} · ${item.orders} pedido(s)`}
                className="w-full rounded-t-md"
                style={{ height: `${height}%`, backgroundColor: color, opacity: item.sales > 0 ? 1 : 0.2 }}
              />
              <span className="text-[10px] text-gray-500 truncate w-full text-center">{item.label}</span>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-gray-500">Passe o mouse nas barras para ver o valor de cada período.</p>
    </section>
  );
}
