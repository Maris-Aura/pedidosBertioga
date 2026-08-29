"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { getOrdersByPhone, getStoreCatalog } from "@/lib/demo-db";
import { formatCurrency, formatDateTime, formatPhone, shortOrderId } from "@/lib/format";
import { pullStoreOrders } from "@/lib/orders-sync";

export function CustomerHistory({ storeSlug }: { storeSlug: string }) {
  const { addItem } = useCart();
  const catalog = getStoreCatalog(storeSlug);
  const [phone, setPhone] = useState("");
  const [searched, setSearched] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const orders = useMemo(
    () => (catalog && searched ? getOrdersByPhone(catalog.store.id, searched) : []),
    [catalog, searched],
  );

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    if (catalog) await pullStoreOrders(catalog.store.id);
    setSearched(phone);
  }

  if (!catalog) return <p className="p-6">Loja não encontrada.</p>;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <Link href={`/${storeSlug}`} className="text-xs font-bold text-gray-600">
        ← Voltar ao cardápio
      </Link>
      <h1 className="text-2xl font-black">Meus pedidos</h1>
      <form onSubmit={onSearch} className="bg-white border rounded-xl p-4 flex gap-2">
        <input
          value={phone}
          onChange={(event) => setPhone(formatPhone(event.target.value))}
          placeholder="Seu WhatsApp"
          className="flex-1 border rounded-lg p-2 text-sm"
        />
        <button className="bg-slate-900 text-white text-xs font-bold px-4 rounded-lg">
          Buscar
        </button>
      </form>
      {notice ? <p className="text-xs font-bold text-emerald-700">{notice}</p> : null}
      {searched && orders.length === 0 ? (
        <p className="text-sm text-gray-500">Nenhum pedido encontrado neste WhatsApp.</p>
      ) : null}
      {orders.map((order) => (
        <article key={order.id} className="bg-white border rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-mono font-bold">#{shortOrderId(order.id)}</span>
            <span className="text-gray-500">{formatDateTime(order.created_at)}</span>
          </div>
          <div className="text-sm">
            {order.items.map((item) => (
              <div key={item.id}>
                {item.quantity}x {item.product_name}
              </div>
            ))}
          </div>
          {order.address ? (
            <div className="text-xs text-gray-500">{order.address}</div>
          ) : null}
          <div className="flex justify-between items-center">
            <span className="font-bold">{formatCurrency(order.total_amount)}</span>
            <button
              type="button"
              onClick={() => {
                for (const item of order.items) {
                  addItem({
                    productId: item.product_id,
                    name: item.product_name,
                    quantity: item.quantity,
                    unitPrice: item.unit_price,
                    observation: item.observation ?? "",
                    optionsSelected: item.options_selected_json,
                  });
                }
                setNotice("Itens adicionados ao carrinho.");
              }}
              className="text-xs font-bold bg-slate-900 text-white px-3 py-1.5 rounded-lg"
            >
              Pedir de novo
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
