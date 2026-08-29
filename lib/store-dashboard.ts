import { digitsOnly } from "@/lib/format";
import type { OrderWithDetails, PaymentMethod } from "@/lib/types";

export type PeriodStats = {
  orders: number;
  sales: number;
  previousOrders: number;
  previousSales: number;
};

export type SeriesPoint = {
  key: string;
  label: string;
  orders: number;
  sales: number;
};

export type ProductRank = {
  name: string;
  quantity: number;
  sales: number;
};

export type StoreDashboardData = {
  today: PeriodStats;
  week: PeriodStats;
  month: PeriodStats;
  ticketMonth: number;
  customers: number;
  newCustomersMonth: number;
  returningCustomersMonth: number;
  openOrders: number;
  deliveredMonth: number;
  deliveryOrders: number;
  pickupOrders: number;
  payments: { method: PaymentMethod; orders: number; sales: number }[];
  lastDays: SeriesPoint[];
  months: SeriesPoint[];
  topProducts: ProductRank[];
};

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfWeek(date: Date) {
  const next = startOfDay(date);
  const weekday = (next.getDay() + 6) % 7;
  next.setDate(next.getDate() - weekday);
  return next;
}

function startOfMonth(date: Date) {
  const next = startOfDay(date);
  next.setDate(1);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  return next;
}

function customerKey(order: OrderWithDetails) {
  return digitsOnly(order.customer_phone) || order.customer_name.trim().toLowerCase();
}

function inRange(iso: string, from: Date, to: Date) {
  const time = new Date(iso).getTime();
  return time >= from.getTime() && time < to.getTime();
}

function summarize(orders: OrderWithDetails[]): Omit<PeriodStats, "previousOrders" | "previousSales"> {
  return {
    orders: orders.length,
    sales: orders.reduce((sum, order) => sum + order.total_amount, 0),
  };
}

function periodStats(current: OrderWithDetails[], previous: OrderWithDetails[]): PeriodStats {
  const now = summarize(current);
  const before = summarize(previous);
  return {
    ...now,
    previousOrders: before.orders,
    previousSales: before.sales,
  };
}

export function changePercent(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 100);
}

export function buildStoreDashboard(
  orders: OrderWithDetails[],
  now = new Date(),
): StoreDashboardData {
  const todayStart = startOfDay(now);
  const tomorrow = addDays(todayStart, 1);
  const yesterdayStart = addDays(todayStart, -1);
  const weekStart = startOfWeek(now);
  const nextWeek = addDays(weekStart, 7);
  const prevWeekStart = addDays(weekStart, -7);
  const monthStart = startOfMonth(now);
  const nextMonth = addMonths(monthStart, 1);
  const prevMonthStart = addMonths(monthStart, -1);

  const todayOrders = orders.filter((order) => inRange(order.created_at, todayStart, tomorrow));
  const weekOrders = orders.filter((order) => inRange(order.created_at, weekStart, nextWeek));
  const monthOrders = orders.filter((order) => inRange(order.created_at, monthStart, nextMonth));

  const customers = new Set(orders.map(customerKey).filter(Boolean));
  const firstSeen = new Map<string, number>();
  for (const order of [...orders].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    const key = customerKey(order);
    if (!key || firstSeen.has(key)) continue;
    firstSeen.set(key, new Date(order.created_at).getTime());
  }

  let newCustomersMonth = 0;
  let returningCustomersMonth = 0;
  const seenThisMonth = new Set<string>();
  for (const order of monthOrders) {
    const key = customerKey(order);
    if (!key || seenThisMonth.has(key)) continue;
    seenThisMonth.add(key);
    const first = firstSeen.get(key) ?? 0;
    if (first >= monthStart.getTime()) newCustomersMonth += 1;
    else returningCustomersMonth += 1;
  }

  const lastDays: SeriesPoint[] = [];
  for (let index = 13; index >= 0; index -= 1) {
    const from = addDays(todayStart, -index);
    const to = addDays(from, 1);
    const bucket = orders.filter((order) => inRange(order.created_at, from, to));
    lastDays.push({
      key: from.toISOString(),
      label: from.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      ...summarize(bucket),
    });
  }

  const months: SeriesPoint[] = [];
  for (let index = 5; index >= 0; index -= 1) {
    const from = addMonths(monthStart, -index);
    const to = addMonths(from, 1);
    const bucket = orders.filter((order) => inRange(order.created_at, from, to));
    months.push({
      key: `${from.getFullYear()}-${from.getMonth()}`,
      label: from.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      ...summarize(bucket),
    });
  }

  const productMap = new Map<string, ProductRank>();
  for (const order of monthOrders) {
    for (const item of order.items) {
      const current = productMap.get(item.product_name) ?? {
        name: item.product_name,
        quantity: 0,
        sales: 0,
      };
      current.quantity += item.quantity;
      current.sales += item.unit_price * item.quantity;
      productMap.set(item.product_name, current);
    }
  }

  const paymentMap = new Map<PaymentMethod, { orders: number; sales: number }>();
  for (const order of monthOrders) {
    const current = paymentMap.get(order.payment_method) ?? { orders: 0, sales: 0 };
    current.orders += 1;
    current.sales += order.total_amount;
    paymentMap.set(order.payment_method, current);
  }

  return {
    today: periodStats(
      todayOrders,
      orders.filter((order) => inRange(order.created_at, yesterdayStart, todayStart)),
    ),
    week: periodStats(
      weekOrders,
      orders.filter((order) => inRange(order.created_at, prevWeekStart, weekStart)),
    ),
    month: periodStats(
      monthOrders,
      orders.filter((order) => inRange(order.created_at, prevMonthStart, monthStart)),
    ),
    ticketMonth: monthOrders.length
      ? monthOrders.reduce((sum, order) => sum + order.total_amount, 0) / monthOrders.length
      : 0,
    customers: customers.size,
    newCustomersMonth,
    returningCustomersMonth,
    openOrders: orders.filter((order) => order.status !== "delivered").length,
    deliveredMonth: monthOrders.filter((order) => order.status === "delivered").length,
    deliveryOrders: monthOrders.filter((order) => order.order_type === "delivery").length,
    pickupOrders: monthOrders.filter((order) => order.order_type === "pickup").length,
    payments: (["pix", "card", "cash"] as const)
      .map((method) => ({
        method,
        orders: paymentMap.get(method)?.orders ?? 0,
        sales: paymentMap.get(method)?.sales ?? 0,
      }))
      .filter((item) => item.orders > 0),
    lastDays,
    months,
    topProducts: [...productMap.values()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5),
  };
}
