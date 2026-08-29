import { mergeRemoteOrders } from "@/lib/demo-db";
import type { OrderWithDetails } from "@/lib/types";

export async function pullStoreOrders(storeId: string) {
  const response = await fetch(`/api/orders?storeId=${encodeURIComponent(storeId)}`);
  if (!response.ok) return;
  const data = (await response.json()) as { orders?: OrderWithDetails[] };
  mergeRemoteOrders(data.orders ?? []);
}

export async function pullOrderById(orderId: string) {
  const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
  if (!response.ok) return null;
  const data = (await response.json()) as { order?: OrderWithDetails };
  if (data.order) mergeRemoteOrders([data.order]);
  return data.order ?? null;
}

export function startOrdersPolling(storeId: string, onChange?: () => void) {
  const tick = async () => {
    await pullStoreOrders(storeId);
    onChange?.();
  };
  void tick();
  const timer = window.setInterval(() => {
    void tick();
  }, 12000);
  return () => window.clearInterval(timer);
}
