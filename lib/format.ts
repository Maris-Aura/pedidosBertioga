import type { OrderStatus, PaymentMethod } from "./types";

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
  return id.replace(/\D/g, "").slice(-4).padStart(4, "0");
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Aguardando Confirmação",
  preparing: "Em Produção",
  out_for_delivery: "Saiu para Entrega",
  delivered: "Entregue",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "pending",
  "preparing",
  "out_for_delivery",
  "delivered",
];

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  pix: "PIX",
  card: "Cartão na Entrega",
  cash: "Dinheiro",
};

export function nextStatus(status: OrderStatus): OrderStatus | null {
  const index = ORDER_STATUS_FLOW.indexOf(status);
  return index >= 0 && index < ORDER_STATUS_FLOW.length - 1
    ? ORDER_STATUS_FLOW[index + 1]
    : null;
}

export function statusActionLabel(status: OrderStatus) {
  if (status === "pending") return "Aceitar Pedido";
  if (status === "preparing") return "Saiu para Entrega";
  if (status === "out_for_delivery") return "Marcar Entregue";
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
