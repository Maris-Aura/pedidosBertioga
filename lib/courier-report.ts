import type { OrderWithDetails } from "@/lib/types";

export type CourierPeriod = "day" | "week" | "month";

export type CourierOrderRow = {
  id: string;
  created_at: string;
  status: OrderWithDetails["status"];
  customer_name: string;
  address: string | null;
  neighborhood: string | null;
  delivery_fee: number;
  total_amount: number;
  items: { name: string; quantity: number }[];
};

export type CourierSummary = {
  id: string;
  name: string;
  phone: string;
  deliveries: number;
  fees: number;
  sales: number;
  orders: CourierOrderRow[];
};

function startOfPeriod(period: CourierPeriod, now = new Date()) {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  if (period === "week") {
    const weekday = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - weekday);
  }
  if (period === "month") {
    date.setDate(1);
  }
  return date;
}

export function buildCourierReport(
  orders: OrderWithDetails[],
  couriers: { id: string; name: string; phone: string }[],
  period: CourierPeriod,
) {
  const from = startOfPeriod(period).getTime();
  const rows: CourierSummary[] = couriers.map((courier) => ({
    id: courier.id,
    name: courier.name,
    phone: courier.phone,
    deliveries: 0,
    fees: 0,
    sales: 0,
    orders: [],
  }));
  const byId = new Map(rows.map((row) => [row.id, row]));

  for (const order of orders) {
    if (order.order_type !== "delivery" || !order.courier_id) continue;
    if (new Date(order.created_at).getTime() < from) continue;
    const row = byId.get(order.courier_id);
    if (!row) continue;
    const fee = order.neighborhood?.delivery_fee ?? 0;
    row.orders.push({
      id: order.id,
      created_at: order.created_at,
      status: order.status,
      customer_name: order.customer_name,
      address: order.address,
      neighborhood: order.neighborhood?.name ?? null,
      delivery_fee: fee,
      total_amount: order.total_amount,
      items: order.items.map((item) => ({
        name: item.product_name,
        quantity: item.quantity,
      })),
    });
    if (order.status === "delivered") {
      row.deliveries += 1;
      row.fees += fee;
      row.sales += order.total_amount;
    }
  }

  for (const row of rows) {
    row.orders.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  return rows.sort((a, b) => b.deliveries - a.deliveries || a.name.localeCompare(b.name));
}
