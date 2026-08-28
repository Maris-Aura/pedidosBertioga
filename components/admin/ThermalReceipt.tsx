"use client";

import { formatCurrency, formatDateTime, PAYMENT_LABEL } from "@/lib/format";
import type { OrderWithDetails, Store } from "@/lib/types";

export function ThermalReceipt({
  store,
  order,
}: {
  store: Store;
  order: OrderWithDetails;
}) {
  return (
    <div id="printable-receipt" className="hidden print:block font-mono text-xs p-2">
      <div className="text-center border-b border-black pb-2 mb-2">
        <div className="font-bold text-sm uppercase">{store.name}</div>
        <div>PEDIDO #{order.id.slice(-4).toUpperCase()}</div>
        <div>{formatDateTime(order.created_at)}</div>
      </div>
      <div className="mb-2">
        <div>
          <strong>CLIENTE:</strong> {order.customer_name}
        </div>
        <div>
          <strong>TEL:</strong> {order.customer_phone}
        </div>
        <div>
          <strong>TIPO:</strong> {order.order_type === "delivery" ? "DELIVERY" : "RETIRADA"}
        </div>
        {order.address ? (
          <div>
            <strong>END:</strong> {order.address}
            {order.neighborhood ? ` - ${order.neighborhood.name}` : ""}
          </div>
        ) : null}
      </div>
      <div className="border-t border-b border-black py-2 mb-2 space-y-1">
        {order.items.map((item) => (
          <div key={item.id}>
            <div className="flex justify-between">
              <span>
                {item.quantity}x {item.product_name}
              </span>
              <span>{formatCurrency(item.unit_price * item.quantity)}</span>
            </div>
            {item.options_selected_json.length > 0 ? (
              <div className="text-[10px] pl-2">
                - {item.options_selected_json.map((option) => option.name).join(", ")}
              </div>
            ) : null}
            {item.observation ? (
              <div className="text-[10px] pl-2">Obs: {item.observation}</div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="text-right space-y-1">
        {order.neighborhood ? (
          <div>Taxa Entrega: {formatCurrency(order.neighborhood.delivery_fee)}</div>
        ) : null}
        <div className="font-bold text-sm">TOTAL: {formatCurrency(order.total_amount)}</div>
        <div>PAGAMENTO: {PAYMENT_LABEL[order.payment_method]}</div>
        {order.change_for ? <div>TROCO PARA: {formatCurrency(order.change_for)}</div> : null}
        {order.notes ? <div className="text-left mt-2">OBS GERAL: {order.notes}</div> : null}
      </div>
    </div>
  );
}
