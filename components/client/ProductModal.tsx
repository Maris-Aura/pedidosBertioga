"use client";

import { useMemo, useState } from "react";
import type { CatalogProduct, SelectedOption } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/format";

export function ProductModal({
  product,
  onClose,
}: {
  product: CatalogProduct;
  onClose: () => void;
}) {
  const { addItem, store } = useCart();
  const [observation, setObservation] = useState("");
  const [selectedIds, setSelectedIds] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    for (const option of product.options) {
      initial[option.id] =
        option.min_choices === 1 && option.max_choices === 1 && option.items[0]
          ? [option.items[0].id]
          : [];
    }
    return initial;
  });

  const selectedOptions: SelectedOption[] = useMemo(() => {
    const result: SelectedOption[] = [];
    for (const option of product.options) {
      for (const itemId of selectedIds[option.id] ?? []) {
        const item = option.items.find((entry) => entry.id === itemId);
        if (item) {
          result.push({
            optionTitle: option.title,
            name: item.name,
            price: item.price,
          });
        }
      }
    }
    return result;
  }, [product.options, selectedIds]);

  const extras = selectedOptions.reduce((sum, item) => sum + item.price, 0);
  const unitPrice = product.price + extras;

  function toggle(optionId: string, itemId: string, maxChoices: number) {
    setSelectedIds((current) => {
      const list = current[optionId] ?? [];
      if (maxChoices === 1) {
        return { ...current, [optionId]: [itemId] };
      }
      if (list.includes(itemId)) {
        return { ...current, [optionId]: list.filter((id) => id !== itemId) };
      }
      if (list.length >= maxChoices) return current;
      return { ...current, [optionId]: [...list, itemId] };
    });
  }

  function confirm() {
    for (const option of product.options) {
      const count = selectedIds[option.id]?.length ?? 0;
      if (count < option.min_choices) {
        window.alert(`Selecione pelo menos ${option.min_choices} opção em "${option.title}".`);
        return;
      }
    }

    addItem({
      productId: product.id,
      name: product.name,
      quantity: 1,
      unitPrice,
      observation,
      optionsSelected: selectedOptions,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="font-black text-xl text-slate-900">{product.name}</h3>
        <p className="text-xs text-gray-500">{product.description}</p>

        {product.options.map((option) => (
          <div key={option.id} className="space-y-2 text-sm border-t pt-3">
            <div className="font-bold text-xs" style={{ color: store.primary_color }}>
              {option.title.toUpperCase()}
              {option.max_choices > 1 ? ` (até ${option.max_choices})` : ""}
            </div>
            {option.items.map((item) => {
              const checked = selectedIds[option.id]?.includes(item.id) ?? false;
              return (
                <label key={item.id} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <input
                      type={option.max_choices === 1 ? "radio" : "checkbox"}
                      name={option.id}
                      checked={checked}
                      onChange={() => toggle(option.id, item.id, option.max_choices)}
                      className="rounded"
                    />
                    {item.name}
                  </span>
                  {item.price > 0 ? (
                    <span className="text-xs font-bold text-slate-600">
                      + {formatCurrency(item.price)}
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>
        ))}

        <label className="block text-xs font-bold text-gray-700">
          Observação do item
          <textarea
            value={observation}
            onChange={(event) => setObservation(event.target.value)}
            className="mt-1 w-full border rounded-lg p-2 text-sm"
            rows={2}
            placeholder="Ex: sem granola, pouco açúcar..."
          />
        </label>

        <div className="flex gap-2 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 bg-gray-100 font-bold py-2.5 rounded-xl text-xs"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirm}
            className="w-1/2 text-slate-950 font-black py-2.5 rounded-xl text-xs hover:opacity-90"
            style={{ backgroundColor: store.primary_color }}
          >
            Adicionar {formatCurrency(unitPrice)}
          </button>
        </div>
      </div>
    </div>
  );
}
