"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { getOrderById, getStoreBySlug, subscribeDemoDb } from "@/lib/demo-db";
import { pullOrderById } from "@/lib/orders-sync";
import { MapPreview } from "@/components/ui/MapPreview";
import { fullDeliveryAddress } from "@/lib/maps";
import { buildPixCopyPaste } from "@/lib/pix";
import {
  formatCurrency,
  ORDER_STATUS_FLOW,
  orderStatusLabel,
  PAYMENT_LABEL,
  whatsappLink,
} from "@/lib/format";
import type { OrderStatus, OrderWithDetails, Store } from "@/lib/types";
import { PixBlock } from "./PixBlock";
import { customerTalkAboutOrderMessage } from "@/lib/dispatch";
import { MessageCircle } from "lucide-react";

export function OrderStatusTracker({
  storeSlug,
  orderId,
}: {
  storeSlug: string;
  orderId: string;
}) {
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = () => {
      setOrder(getOrderById(orderId));
      setStore(getStoreBySlug(storeSlug));
      setReady(true);
    };
    load();
    void pullOrderById(orderId).then((remote) => {
      if (remote) setOrder(remote);
    });
    const timer = window.setInterval(() => {
      void pullOrderById(orderId).then((remote) => {
        if (remote) setOrder(getOrderById(orderId) ?? remote);
      });
    }, 12000);
    const unsub = subscribeDemoDb(load);
    return () => {
      unsub();
      window.clearInterval(timer);
    };
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

  return (
    <div className="max-w-4xl mx-auto p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="bg-white p-6 rounded-2xl border text-center space-y-6">
        <div
          className="inline-block p-3 rounded-full"
          style={{ backgroundColor: `${store.primary_color}22`, color: store.primary_color }}
        >
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

        {order.order_type === "delivery" && order.address ? (
          <div className="text-left">
            <p className="text-sm font-bold mb-2">{order.address}</p>
            <MapPreview query={fullDeliveryAddress(order.address, order.neighborhood?.name)} />
          </div>
        ) : null}

        {pixCode ? (
          <PixBlock payload={pixCode} amount={order.total_amount} />
        ) : (
          <p className="text-sm text-gray-600">
            Pagamento: {PAYMENT_LABEL[order.payment_method]}
            {order.change_for ? ` · Troco para ${formatCurrency(order.change_for)}` : ""}
          </p>
        )}

        {store.whatsapp ? (
          <a
            href={whatsappLink(store.whatsapp, customerTalkAboutOrderMessage(store, order))}
            target="_blank"
            rel="noreferrer"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <MessageCircle className="size-4" />
            Falar sobre meu pedido
          </a>
        ) : null}

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
                      ? "font-bold"
                      : active
                        ? "font-medium text-emerald-700"
                        : "font-medium text-gray-400"
                  }`}
                  style={current ? { color: store.primary_color } : undefined}
                >
                  <div
                    className={`w-4 h-4 rounded-full ${
                      current
                        ? "animate-pulse"
                        : active
                          ? "bg-emerald-500"
                          : "bg-gray-300"
                    }`}
                    style={current ? { backgroundColor: store.primary_color } : undefined}
                  />
                  {index + 1}. {orderStatusLabel(status, order.order_type)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
