import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { OrderWithDetails } from "@/lib/types";

type GlobalOrders = typeof globalThis & { __pbOrders?: OrderWithDetails[] };

function memoryOrders() {
  const globalStore = globalThis as GlobalOrders;
  if (!globalStore.__pbOrders) globalStore.__pbOrders = [];
  return globalStore.__pbOrders;
}

function supabase() {
  if (!isSupabaseConfigured()) return null;
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function upsertMemory(order: OrderWithDetails) {
  const list = memoryOrders();
  const index = list.findIndex((item) => item.id === order.id);
  if (index >= 0) list[index] = order;
  else list.unshift(order);
}

export async function saveRemoteOrder(order: OrderWithDetails) {
  upsertMemory(order);
  const client = supabase();
  if (!client) return { remote: false };
  const { error } = await client.from("app_orders").upsert({
    id: order.id,
    store_id: order.store_id,
    status: order.status,
    courier_id: order.courier_id,
    data: order,
    created_at: order.created_at,
  });
  return { remote: !error, error: error?.message };
}

export async function listRemoteOrders(storeId?: string) {
  const client = supabase();
  if (client) {
    const query = client.from("app_orders").select("data");
    const { data, error } = storeId ? await query.eq("store_id", storeId) : await query;
    if (!error && data) {
      const orders = data
        .map((row) => row.data as OrderWithDetails)
        .filter(Boolean);
      for (const order of orders) upsertMemory(order);
      return { orders, remote: true };
    }
  }
  const orders = storeId
    ? memoryOrders().filter((order) => order.store_id === storeId)
    : [...memoryOrders()];
  return { orders, remote: false };
}

export async function getRemoteOrder(id: string) {
  const listed = await listRemoteOrders();
  return listed.orders.find((order) => order.id === id) ?? null;
}
