"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { contrastText, formatCurrency } from "@/lib/format";
import { storeIsReceivingOrders } from "@/lib/store-hours";

export function CartBar({ storeSlug }: { storeSlug: string }) {
  const { items, itemCount, subtotal, store } = useCart();

  if (items.length === 0) return null;

  const ink = contrastText(store.primary_color);
  const preview = items
    .slice(0, 3)
    .map((item) => `${item.quantity}x ${item.name}`)
    .join(" · ");
  const extra = items.length > 3 ? ` +${items.length - 3}` : "";

  return (
    <div className="fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] px-4 z-40">
      <div className="max-w-4xl mx-auto bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center gap-3">
        <div className="min-w-0">
          <span
            className="text-xs font-black px-2 py-1 rounded-full"
            style={{ backgroundColor: store.primary_color, color: ink }}
          >
            {itemCount} {itemCount === 1 ? "item" : "itens"}
          </span>
          <div className="text-[11px] text-slate-300 mt-1 truncate">
            {preview}
            {extra}
          </div>
          <div className="font-bold text-lg">{formatCurrency(subtotal)}</div>
        </div>
        {storeIsReceivingOrders(store) ? (
          <Link
            href={`/${storeSlug}/checkout`}
            className="font-extrabold px-5 py-2.5 rounded-lg text-sm hover:opacity-90 shrink-0"
            style={{ backgroundColor: store.primary_color, color: ink }}
          >
            Ver pedido
          </Link>
        ) : (
          <span className="text-xs text-slate-400 shrink-0">Loja fechada</span>
        )}
      </div>
    </div>
  );
}
