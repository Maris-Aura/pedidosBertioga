"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import type { CatalogProduct, SelectedOption } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import { contrastText, formatCurrency } from "@/lib/format";
import { FieldNotice } from "@/components/ui/Notice";
import { QuantityStepper } from "@/components/ui/QuantityStepper";

export function ProductModal({
  product,
  onClose,
}: {
  product: CatalogProduct;
  onClose: () => void;
}) {
  const { addItem, store } = useCart();
  const [observation, setObservation] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
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
        setError(`Selecione pelo menos ${option.min_choices} opção em "${option.title}".`);
        return;
      }
    }

    addItem({
      productId: product.id,
      name: product.name,
      quantity,
      unitPrice,
      observation,
      optionsSelected: selectedOptions,
    });
    onClose();
  }

  const ink = contrastText(store.primary_color);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full p-5 space-y-4 max-h-[92vh] overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-black text-xl text-slate-900">{product.name}</h3>
            <p className="text-xs text-gray-500 mt-1">{product.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 rounded-lg bg-gray-100 shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>

        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt=""
            className="w-full h-40 object-cover rounded-xl"
          />
        ) : null}

        {product.options.map((option) => {
          const count = selectedIds[option.id]?.length ?? 0;
          return (
            <div key={option.id} className="space-y-2 text-sm border-t pt-3">
              <div className="flex justify-between gap-2">
                <div className="font-bold text-xs" style={{ color: store.primary_color }}>
                  {option.title.toUpperCase()}
                  {option.max_choices > 1 ? ` (até ${option.max_choices})` : ""}
                </div>
                {option.max_choices > 1 ? (
                  <span className="text-[11px] text-gray-500">
                    {count}/{option.max_choices}
                  </span>
                ) : null}
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
          );
        })}

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

        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700">Quantidade</span>
          <QuantityStepper value={quantity} onChange={setQuantity} />
        </div>

        <FieldNotice message={error} />

        <div className="flex gap-2 pt-2 border-t">
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
            className="w-1/2 font-black py-2.5 rounded-xl text-xs hover:opacity-90"
            style={{ backgroundColor: store.primary_color, color: ink }}
          >
            Adicionar {formatCurrency(unitPrice * quantity)}
          </button>
        </div>
      </div>
    </div>
  );
}
