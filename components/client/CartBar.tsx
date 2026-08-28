"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/format";

export function CartBar({ storeSlug }: { storeSlug: string }) {
  const { items, itemCount, subtotal, store } = useCart();

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto bg-slate-900 text-white p-4 rounded-xl shadow-2xl flex justify-between items-center z-40">
      <div>
        <span
          className="text-xs text-slate-950 font-black px-2 py-1 rounded-full"
          style={{ backgroundColor: store.primary_color }}
        >
          {itemCount} {itemCount === 1 ? "item" : "itens"}
        </span>
        <div className="font-bold text-lg mt-0.5">{formatCurrency(subtotal)}</div>
      </div>
      <Link
        href={`/${storeSlug}/checkout`}
        className="text-slate-950 font-extrabold px-5 py-2.5 rounded-lg text-sm hover:opacity-90"
        style={{ backgroundColor: store.primary_color }}
      >
        Avançar para Entrega →
      </Link>
    </div>
  );
}
