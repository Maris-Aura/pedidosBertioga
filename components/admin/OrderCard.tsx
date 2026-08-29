"use client";

import { Printer, MessageCircle } from "lucide-react";
import type { Courier, OrderWithDetails, Store } from "@/lib/types";
import {
  formatCurrency,
  nextStatus,
  orderStatusLabel,
  PAYMENT_LABEL,
  statusActionLabel,
  whatsappLink,
  whatsappStatusMessage,
} from "@/lib/format";

export function OrderCard({
  store,
  order,
  couriers,
  onAdvance,
  onAssignCourier,
  onPrint,
}: {
  store: Store;
  order: OrderWithDetails;
  couriers: Courier[];
  onAdvance: () => void;
  onAssignCourier: (courierId: string) => void;
  onPrint: () => void;
}) {
  const upcoming = nextStatus(order.status);
  const message = whatsappStatusMessage(order, store.name);

  return (
    <article
      className={`bg-white rounded-xl p-5 space-y-4 border-2 ${
        order.status === "pending" ? "border-amber-400" : "border-slate-200"
      }`}
    >
      <div className="flex justify-between items-start border-b pb-3">
        <div>
          <span className="font-mono text-xs font-bold text-gray-400">
            #{order.id.slice(-4).toUpperCase()}
          </span>
          <h3 className="font-bold text-base text-slate-900">{order.customer_name}</h3>
          <p className="text-xs text-gray-500">{order.customer_phone}</p>
        </div>
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            order.status === "pending"
              ? "bg-amber-100 text-amber-800"
              : order.status === "delivered"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-sky-100 text-sky-800"
          }`}
        >
          {orderStatusLabel(order.status, order.order_type)}
        </span>
      </div>

      <div className="text-sm space-y-1">
        <div className="font-bold text-xs text-gray-500">ITENS DO PEDIDO:</div>
        {order.items.map((item) => (
          <div key={item.id}>
            <div className="flex justify-between">
              <span className="font-medium">
                {item.quantity}x {item.product_name}
              </span>
              <span className="font-bold">{formatCurrency(item.unit_price * item.quantity)}</span>
            </div>
            {item.options_selected_json.length > 0 ? (
              <div className="text-xs text-gray-500 pl-2">
                • {item.options_selected_json.map((option) => option.name).join(", ")}
              </div>
            ) : null}
            {item.observation ? (
              <div className="text-xs text-amber-700 pl-2">Obs: {item.observation}</div>
            ) : null}
          </div>
        ))}
        {order.notes ? (
          <div className="text-xs bg-amber-50 text-amber-900 rounded-lg p-2 mt-2">
            Pedido: {order.notes}
          </div>
        ) : null}
        <div className="flex justify-between border-t pt-2 font-black text-slate-900">
          <span>Total (com taxa):</span>
          <span style={{ color: store.primary_color }}>{formatCurrency(order.total_amount)}</span>
        </div>
        <div className="text-xs text-gray-500">
          Pagamento:{" "}
          <strong className="text-slate-800">{PAYMENT_LABEL[order.payment_method]}</strong>
          {order.change_for ? ` · Troco ${formatCurrency(order.change_for)}` : ""}
        </div>
        <div className="text-xs text-gray-500">
          {order.order_type === "pickup" ? "Retirada na loja" : "Endereço:"}{" "}
          <strong className="text-slate-800">
            {order.order_type === "pickup"
              ? ""
              : `${order.address ?? ""}${order.neighborhood ? ` (${order.neighborhood.name})` : ""}`}
          </strong>
        </div>
      </div>

      {order.order_type === "delivery" ? (
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            Entregador Responsável:
          </label>
          <select
            value={order.courier_id ?? ""}
            onChange={(event) => onAssignCourier(event.target.value)}
            className="w-full border rounded-lg p-2 text-xs bg-gray-50"
          >
            <option value="">Selecione o Motoboy...</option>
            {couriers.map((courier) => (
              <option key={courier.id} value={courier.id}>
                {courier.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 border-t pt-3">
        <button
          type="button"
          onClick={onPrint}
          className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1"
        >
          <Printer className="size-4" />
          Imprimir
        </button>
        {upcoming ? (
          <button
            type="button"
            onClick={onAdvance}
            className="font-black text-xs py-2 rounded-lg text-slate-950"
            style={{ backgroundColor: store.primary_color }}
          >
            {statusActionLabel(order.status, order.order_type)} →
          </button>
        ) : (
          <div className="text-xs font-bold text-emerald-700 flex items-center justify-center">
            Pedido concluído
          </div>
        )}
      </div>

      <a
        href={whatsappLink(order.customer_phone, message)}
        target="_blank"
        rel="noreferrer"
        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1"
      >
        <MessageCircle className="size-4" />
        Avisar no WhatsApp
      </a>
    </article>
  );
}
