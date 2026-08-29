import type { Order, OrderStatus, OrderType, PaymentMethod } from "./types";

export function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function shortOrderId(id: string) {
  return id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase().padStart(4, "0");
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Aguardando Confirmação",
  preparing: "Em Produção",
  out_for_delivery: "Saiu para Entrega",
  delivered: "Entregue",
};

const PICKUP_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Aguardando Confirmação",
  preparing: "Em Produção",
  out_for_delivery: "Pronto para Retirar",
  delivered: "Retirado",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "pending",
  "preparing",
  "out_for_delivery",
  "delivered",
];

export const KDS_ACTIVE_STATUSES: OrderStatus[] = [
  "pending",
  "preparing",
  "out_for_delivery",
];

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  pix: "PIX",
  card: "Cartão na Entrega",
  cash: "Dinheiro",
};

export function orderStatusLabel(status: OrderStatus, orderType: OrderType = "delivery") {
  return orderType === "pickup" ? PICKUP_STATUS_LABEL[status] : ORDER_STATUS_LABEL[status];
}

export function nextStatus(status: OrderStatus): OrderStatus | null {
  const index = ORDER_STATUS_FLOW.indexOf(status);
  return index >= 0 && index < ORDER_STATUS_FLOW.length - 1
    ? ORDER_STATUS_FLOW[index + 1]
    : null;
}

export function statusActionLabel(status: OrderStatus, orderType: OrderType = "delivery") {
  if (status === "pending") return "Aceitar Pedido";
  if (status === "preparing") {
    return orderType === "pickup" ? "Pronto para Retirar" : "Saiu para Entrega";
  }
  if (status === "out_for_delivery") {
    return orderType === "pickup" ? "Marcar Retirado" : "Marcar Entregue";
  }
  return "Concluído";
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function formatPhone(value: string) {
  const digits = digitsOnly(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").replace(/-$/, "");
}

export function whatsappLink(phone: string, text: string) {
  const digits = digitsOnly(phone);
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(text)}`;
}

export function whatsappStatusMessage(
  order: Pick<Order, "id" | "customer_name" | "status" | "order_type">,
  storeName: string,
) {
  const code = shortOrderId(order.id);
  const status = orderStatusLabel(order.status, order.order_type);
  return `Olá ${order.customer_name}, seu pedido #${code} na ${storeName} está: ${status}.`;
}

export function contrastText(hex: string) {
  const raw = hex.replace("#", "");
  if (raw.length < 6) return "#0f172a";
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? "#0f172a" : "#ffffff";
}
