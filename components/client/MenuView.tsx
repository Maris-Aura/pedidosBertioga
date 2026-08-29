"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import { getStoreCatalog, subscribeDemoDb } from "@/lib/demo-db";
import { storeAvailability } from "@/lib/store-hours";
import Link from "next/link";
import type { CatalogProduct, StoreCatalog } from "@/lib/types";
import { contrastText, formatCurrency } from "@/lib/format";
import { ProductModal } from "./ProductModal";
import { CartBar } from "./CartBar";
import { Plus, Search } from "lucide-react";

export function MenuView({ storeSlug }: { storeSlug: string }) {
  const { store } = useCart();
  const [catalog, setCatalog] = useState<StoreCatalog | null>(null);
  const [selected, setSelected] = useState<CatalogProduct | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = () => setCatalog(getStoreCatalog(storeSlug));
    load();
    return subscribeDemoDb(load);
  }, [storeSlug]);

  const grouped = useMemo(() => {
    if (!catalog) return [];
    const term = query.trim().toLowerCase();
    return catalog.categories
      .map((category) => ({
        category,
        products: catalog.products.filter((product) => {
          if (product.category_id !== category.id) return false;
          if (!term) return true;
          return (
            product.name.toLowerCase().includes(term) ||
            product.description.toLowerCase().includes(term)
          );
        }),
      }))
      .filter((group) => group.products.length > 0);
  }, [catalog, query]);

  if (!catalog) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-sm text-gray-500">
        Carregando cardápio...
      </div>
    );
  }

  const ink = contrastText(store.primary_color);
  const availability = storeAvailability(store);
  const open = availability.receiving;

  return (
    <div className="max-w-4xl mx-auto p-4 pb-36 space-y-5">
      <div
        className="p-5 rounded-2xl"
        style={{ backgroundColor: store.primary_color, color: ink }}
      >
        <h1 className="text-2xl font-black">Cardápio</h1>
        <p className="text-sm font-medium mt-1 opacity-90">
          {store.hours} · personalize cada item e envie o pedido.
        </p>
        <Link href={`/${storeSlug}/conta`} className="text-xs font-bold underline mt-2 inline-block">
          Meus pedidos
        </Link>
      </div>

      {!open ? (
        <p className="text-sm font-bold text-red-800 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {availability.reason}
        </p>
      ) : null}

      <label className="block relative">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar no cardápio"
          className="w-full border rounded-xl bg-white pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 store-ring"
        />
      </label>

      {catalog.categories.length > 0 ? (
        <nav className="sticky top-14 z-40 -mx-4 px-4 py-2 bg-gray-100/95 backdrop-blur overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {catalog.categories.map((category) => (
              <a
                key={category.id}
                href={`#cat-${category.id}`}
                className="text-xs font-bold px-3 py-1.5 rounded-full bg-white border whitespace-nowrap"
              >
                {category.name}
              </a>
            ))}
          </div>
        </nav>
      ) : null}

      {grouped.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">
          Nenhum item encontrado.
        </p>
      ) : null}

      {grouped.map(({ category, products }) => (
        <section key={category.id} id={`cat-${category.id}`}>
          <h2 className="text-lg font-bold mb-3 border-b pb-1 text-slate-700">
            {category.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((product) => (
              <article
                key={product.id}
                className="bg-white rounded-xl border overflow-hidden flex gap-3"
              >
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image_url}
                    alt=""
                    className="w-24 h-24 object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="w-24 h-24 shrink-0"
                    style={{ backgroundColor: store.primary_color }}
                  />
                )}
                <div className="py-3 pr-3 flex-1 min-w-0 flex justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-base leading-tight">{product.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {product.description}
                    </p>
                    <span
                      className="font-extrabold text-sm mt-1.5 block"
                      style={{ color: store.primary_color }}
                    >
                      {formatCurrency(product.price)}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={!open}
                    onClick={() => setSelected(product)}
                    className="self-center bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 shrink-0 inline-flex items-center gap-1 disabled:opacity-40"
                  >
                    <Plus className="size-4" />
                    Adicionar
                  </button>
                </div>
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
