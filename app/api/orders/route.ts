import { NextRequest, NextResponse } from "next/server";
import { listRemoteOrders, saveRemoteOrder } from "@/lib/remote-orders";
import type { OrderWithDetails } from "@/lib/types";

export async function GET(request: NextRequest) {
  const storeId = request.nextUrl.searchParams.get("storeId") ?? undefined;
  const listed = await listRemoteOrders(storeId);
  return NextResponse.json({ orders: listed.orders, remote: listed.remote });
}

export async function POST(request: NextRequest) {
  const order = (await request.json()) as OrderWithDetails;
  if (!order?.id || !order.store_id) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }
  const result = await saveRemoteOrder(order);
  return NextResponse.json({ ok: true, remote: result.remote, error: result.error });
}
