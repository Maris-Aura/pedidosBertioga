import { fullDeliveryAddress, mapsDirectionsUrl } from "@/lib/maps";
import {
  formatCurrency,
  PAYMENT_LABEL,
  shortOrderId,
} from "@/lib/format";
import { SITE_URL } from "@/lib/site";
import type { OrderWithDetails, Store } from "@/lib/types";

export function appUrl(path: string) {
  if (typeof window !== "undefined") return `${window.location.origin}${path}`;
  return `${SITE_URL}${path}`;
}

export function orderMapsQuery(order: OrderWithDetails) {
  return fullDeliveryAddress(order.address, order.neighborhood?.name);
}

export function courierPanelPath(storeSlug: string, courierId: string) {
  return `/${storeSlug}/entregador/${courierId}`;
}

export function customerTalkAboutOrderMessage(store: Store, order: OrderWithDetails) {
  const items = order.items
    .map((item) => `${item.quantity}x ${item.product_name}`)
    .join(", ");
  const address =
    order.order_type === "delivery"
      ? orderMapsQuery(order)
      : "Retirada na loja";
  return [
    `Olá, sou ${order.customer_name} e quero falar sobre o pedido #${shortOrderId(order.id)} na ${store.name}.`,
    items,
    address,
    `${PAYMENT_LABEL[order.payment_method]} · ${formatCurrency(order.total_amount)}`,
    order.notes ? `Obs: ${order.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function courierDispatchMessage(
  store: Store,
  storeSlug: string,
  order: OrderWithDetails,
) {
  const query = orderMapsQuery(order);
  return [
    `Entrega #${shortOrderId(order.id)} — ${store.name}`,
    `Cliente: ${order.customer_name} · ${order.customer_phone}`,
    `Endereço: ${query}`,
    `Mapa: ${mapsDirectionsUrl(query)}`,
    `Seu painel: ${appUrl(courierPanelPath(storeSlug, order.courier_id || ""))}`,
    `Pagamento: ${PAYMENT_LABEL[order.payment_method]} · ${formatCurrency(order.total_amount)}`,
    order.notes ? `Obs: ${order.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
