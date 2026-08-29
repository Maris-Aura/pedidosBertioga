import { NextRequest, NextResponse } from "next/server";
import { getRemoteOrder, saveRemoteOrder } from "@/lib/remote-orders";
import type { OrderStatus } from "@/lib/types";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const order = await getRemoteOrder(id);
  if (!order) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  return NextResponse.json({ order });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const order = await getRemoteOrder(id);
  if (!order) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  const body = (await request.json()) as { status?: OrderStatus; courier_id?: string | null };
  if (body.status) order.status = body.status;
  if (body.courier_id !== undefined) order.courier_id = body.courier_id;
  await saveRemoteOrder(order);
  return NextResponse.json({ ok: true, order });
}
