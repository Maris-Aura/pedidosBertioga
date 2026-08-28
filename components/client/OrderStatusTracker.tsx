"use client";

import { useEffect, useState } from "react";
import { Clock, Copy } from "lucide-react";
import { getOrderById, getStoreBySlug, subscribeDemoDb } from "@/lib/demo-db";
import { buildPixCopyPaste } from "@/lib/pix";
import { formatCurrency, ORDER_STATUS_FLOW, ORDER_STATUS_LABEL } from "@/lib/format";
import type { OrderStatus, OrderWithDetails, Store } from "@/lib/types";

export function OrderStatusTracker({
  storeSlug,
  orderId,
}: {
  storeSlug: string;
  orderId: string;
}) {
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = () => {
      setOrder(getOrderById(orderId));
      setStore(getStoreBySlug(storeSlug));
      setReady(true);
    };
    load();
    return subscribeDemoDb(load);
  }, [orderId, storeSlug]);

  if (!ready) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl text-center">
        Carregando pedido...
      </div>
    );
  }

  if (!order || !store) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl text-center">
        Pedido não encontrado.
      </div>
    );
  }

  const pixCode =
    order.payment_method === "pix"
      ? buildPixCopyPaste({
          pixKey: store.pix_key,
          merchantName: store.name,
          amount: order.total_amount,
          txid: order.id.replace(/[^A-Za-z0-9]/g, "").slice(0, 20),
        })
      : null;

  const currentIndex = ORDER_STATUS_FLOW.indexOf(order.status);

  async function copyPix() {
    if (!pixCode) return;
    await navigator.clipboard.writeText(pixCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white p-6 rounded-2xl border shadow-sm text-center space-y-6">
        <div className="inline-block p-3 bg-amber-100 text-amber-600 rounded-full">
          <Clock className="size-10" />
        </div>
        <div>
          <h2 className="text-2xl font-black">Pedido enviado com sucesso!</h2>
          <p className="text-sm text-gray-500 mt-1">
            Código do Pedido:{" "}
            <span className="font-mono font-bold text-slate-900">
              #{order.id.slice(-4).toUpperCase()}
            </span>
          </p>
        </div>

        {pixCode ? (
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-left space-y-2">
            <div className="font-bold text-sm text-slate-900">Chave PIX Copia e Cola:</div>
            <div className="bg-white p-2 rounded border font-mono text-xs text-gray-600 break-all">
              {pixCode}
            </div>
            <p className="text-xs text-gray-500">
              Valor exato: <strong>{formatCurrency(order.total_amount)}</strong>
            </p>
            <button
              type="button"
              onClick={copyPix}
              className="w-full bg-slate-900 text-white font-bold text-xs py-2 rounded-lg inline-flex items-center justify-center gap-2"
            >
              <Copy className="size-4" />
              {copied ? "Código PIX copiado!" : "Copiar Código PIX"}
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            Pagamento: {order.payment_method === "card" ? "Cartão na entrega" : "Dinheiro na entrega"}
            {order.change_for ? ` · Troco para ${formatCurrency(order.change_for)}` : ""}
          </p>
        )}

        <div className="space-y-4 pt-4 border-t text-left">
          <div className="font-bold text-sm text-gray-700">Status em Tempo Real:</div>
          <div className="space-y-3">
            {ORDER_STATUS_FLOW.map((status: OrderStatus, index) => {
              const active = index <= currentIndex;
              const current = index === currentIndex;
              return (
                <div
                  key={status}
                  className={`flex items-center gap-3 ${
                    current
                      ? "font-bold text-amber-600"
                      : active
                        ? "font-medium text-emerald-700"
                        : "font-medium text-gray-400"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full ${
                      current
                        ? "bg-amber-500 animate-pulse"
                        : active
                          ? "bg-emerald-500"
                          : "bg-gray-300"
                    }`}
                  />
                  {index + 1}. {ORDER_STATUS_LABEL[status]}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
