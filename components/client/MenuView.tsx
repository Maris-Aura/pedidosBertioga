"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import { getStoreCatalog } from "@/lib/demo-db";
import type { CatalogProduct, StoreCatalog } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { ProductModal } from "./ProductModal";
import { CartBar } from "./CartBar";
import { Plus } from "lucide-react";

export function MenuView({ storeSlug }: { storeSlug: string }) {
  const { store } = useCart();
  const [catalog, setCatalog] = useState<StoreCatalog | null>(null);
  const [selected, setSelected] = useState<CatalogProduct | null>(null);

  useEffect(() => {
    setCatalog(getStoreCatalog(storeSlug));
  }, [storeSlug]);

  const grouped = useMemo(() => {
    if (!catalog) return [];
    return catalog.categories.map((category) => ({
      category,
      products: catalog.products.filter((product) => product.category_id === category.id),
    }));
  }, [catalog]);

  if (!catalog) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-sm text-gray-500">
        Carregando cardápio...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-32 space-y-6">
      <div
        className="text-slate-950 p-6 rounded-2xl mb-2 shadow-sm"
        style={{ backgroundColor: store.primary_color }}
      >
        <h1 className="text-2xl font-black">Monte seu Pedido</h1>
        <p className="text-sm font-medium mt-1">
          Cardápio da {store.name}. Escolha os itens e personalize cada um.
        </p>
      </div>

      {grouped.map(({ category, products }) => (
        <section key={category.id}>
          <h2 className="text-lg font-bold mb-3 border-b pb-1 text-slate-700">
            {category.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((product) => (
              <article
                key={product.id}
                className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center gap-3"
              >
                <div>
                  <h3 className="font-bold text-base">{product.name}</h3>
                  <p className="text-xs text-gray-500">{product.description}</p>
                  <span
                    className="font-extrabold text-sm mt-2 block"
                    style={{ color: store.primary_color }}
                  >
                    {formatCurrency(product.price)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(product)}
                  className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 shrink-0 inline-flex items-center gap-1"
                >
                  <Plus className="size-4" />
                  Adicionar
                </button>
              </article>
            ))}
          </div>
        </section>
      ))}

      {selected ? (
        <ProductModal product={selected} onClose={() => setSelected(null)} />
      ) : null}

      <CartBar storeSlug={storeSlug} />
    </div>
  );
}
