"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import {
  createOrder,
  findCoupon,
  getOrdersByPhone,
  getStoreCatalog,
} from "@/lib/demo-db";
import { applyCoupon, normalizeCouponCode } from "@/lib/coupons";
import { extraDeliveryFees, storeIsReceivingOrders } from "@/lib/store-hours";
import { fullDeliveryAddress } from "@/lib/maps";
import { buildPixCopyPaste } from "@/lib/pix";
import { contrastText, formatCurrency, formatPhone } from "@/lib/format";
import type { Neighborhood, PaymentMethod, StoreCatalog } from "@/lib/types";
import { Trash2 } from "lucide-react";
import { FieldNotice } from "@/components/ui/Notice";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { MapPreview } from "@/components/ui/MapPreview";
import { PixBlock } from "./PixBlock";

export function CheckoutForm({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();
  const { store, items, subtotal, removeItem, updateQuantity, clear } = useCart();
  const [catalog, setCatalog] = useState<StoreCatalog | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");
  const [neighborhoodId, setNeighborhoodId] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [changeFor, setChangeFor] = useState("");
  const [notes, setNotes] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const data = getStoreCatalog(storeSlug);
    setCatalog(data);
    if (data?.neighborhoods[0]) setNeighborhoodId(data.neighborhoods[0].id);
  }, [storeSlug]);

  const open = storeIsReceivingOrders(store);
  const selectedNeighborhood: Neighborhood | undefined = catalog?.neighborhoods.find(
    (item) => item.id === neighborhoodId,
  );
  const extras = extraDeliveryFees(store);
  const baseFee = orderType === "delivery" ? (selectedNeighborhood?.delivery_fee ?? 0) : 0;
  const extraFee = orderType === "delivery" ? extras.total : 0;
  const deliveryFee = baseFee + extraFee;
  const previous = getOrdersByPhone(store.id, phone);
  const coupon = couponCode ? findCoupon(store.id, normalizeCouponCode(couponCode)) : null;
  const couponResult = applyCoupon(coupon, subtotal, previous.length === 0);
  const discount = couponResult.discount;
  const total = Math.max(0, subtotal + deliveryFee - discount);
  const mapsQuery =
    orderType === "delivery"
      ? fullDeliveryAddress(address, selectedNeighborhood?.name)
      : "";
  const ink = contrastText(store.primary_color);
  const savedAddresses = [
    ...new Map(
      previous
        .filter((order) => order.address)
        .map((order) => [
          `${order.address}|${order.neighborhood_id}`,
          {
            address: order.address ?? "",
            neighborhoodId: order.neighborhood_id ?? "",
          },
        ]),
    ).values(),
  ].slice(0, 5);

  useEffect(() => {
    setCouponError(couponCode && couponResult.error ? couponResult.error : null);
  }, [couponCode, couponResult.error]);

  const paymentOptions = useMemo(
    () => [
      {
        value: "pix" as const,
        title: "PIX no Site",
        description: "QR e Copia e Cola com o valor exato.",
      },
      {
        value: "card" as const,
        title: "Cartão na Entrega",
        description: "O entregador leva a maquininha.",
      },
      {
        value: "cash" as const,
        title: "Dinheiro",
        description: "Pagar no momento da entrega.",
      },
    ],
    [],
  );

  const pixPreview =
    paymentMethod === "pix" && store.pix_key
      ? buildPixCopyPaste({
          pixKey: store.pix_key,
          merchantName: store.name,
          amount: total,
          txid: "PEDIDO",
        })
      : null;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!open) {
      setError("A loja está fechada no momento.");
      return;
    }
    if (!name.trim() || !phone.trim()) {
      setError("Informe nome e WhatsApp para enviar o pedido.");
      return;
    }
    if (orderType === "delivery" && (!neighborhoodId || !address.trim())) {
      setError("Selecione o bairro e informe o endereço completo.");
      return;
    }
    if (couponCode && couponResult.error) {
      setError(couponResult.error);
      return;
    }
    if (items.length === 0) return;

    setSubmitting(true);
    const order = createOrder({
      storeId: store.id,
      customerName: name.trim(),
      customerPhone: phone,
      orderType,
      address: orderType === "delivery" ? address.trim() : null,
      neighborhoodId: orderType === "delivery" ? neighborhoodId : null,
      paymentMethod,
      changeFor:
        paymentMethod === "cash" && changeFor
          ? Number(changeFor.replace(",", "."))
          : null,
      notes: notes.trim() || null,
      items,
      totalAmount: total,
      couponCode: coupon ? coupon.code : null,
      discount,
    });
    clear();
    router.push(`/${storeSlug}/status/${order.id}`);
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl border text-center">
        <p className="font-bold">Seu carrinho está vazio.</p>
        <Link href={`/${storeSlug}`} className="text-sm underline mt-2 inline-block">
          Voltar ao cardápio
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-4xl mx-auto p-4 space-y-4 pb-[max(2rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex justify-between gap-3">
        <Link href={`/${storeSlug}`} className="text-xs text-gray-600 font-bold inline-flex">
          ← Voltar ao cardápio
        </Link>
        <Link href={`/${storeSlug}/conta`} className="text-xs font-bold text-slate-700">
          Meus pedidos
        </Link>
      </div>

      <section className="bg-white p-5 rounded-xl border space-y-3">
        <h2 className="font-bold text-lg">Itens</h2>
        {items.map((item) => (
          <div key={item.id} className="flex justify-between gap-3 text-sm border-b pb-3">
            <div className="min-w-0">
              <div className="font-medium">{item.name}</div>
              {item.optionsSelected.length > 0 ? (
                <div className="text-xs text-gray-500">
                  {item.optionsSelected.map((option) => option.name).join(", ")}
                </div>
              ) : null}
              {item.observation ? (
                <div className="text-xs text-amber-700">Obs: {item.observation}</div>
              ) : null}
              <div className="mt-2">
                <QuantityStepper
                  value={item.quantity}
                  onChange={(value) => updateQuantity(item.id, value)}
                />
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className="font-bold">{formatCurrency(item.unitPrice * item.quantity)}</span>
              <button type="button" onClick={() => removeItem(item.id)} aria-label="Remover">
                <Trash2 className="size-4 text-gray-400" />
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="bg-white p-5 rounded-xl border">
        <h2 className="font-bold text-lg mb-4">1. Dados do Cliente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block text-xs font-bold text-gray-700">
            Seu Nome *
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 store-ring"
            />
          </label>
          <label className="block text-xs font-bold text-gray-700">
            WhatsApp *
            <input
              required
              value={phone}
              onChange={(event) => setPhone(formatPhone(event.target.value))}
              className="mt-1 w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 store-ring"
            />
          </label>
        </div>
      </section>

      <section className="bg-white p-5 rounded-xl border">
        <h2 className="font-bold text-lg mb-4">2. Entrega ou Retirada</h2>
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
            <input
              type="radio"
              checked={orderType === "delivery"}
              onChange={() => setOrderType("delivery")}
            />
            Delivery
          </label>
          <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
            <input
              type="radio"
              checked={orderType === "pickup"}
              onChange={() => setOrderType("pickup")}
            />
            Retirada na Loja
          </label>
        </div>

        {orderType === "delivery" ? (
          <div className="space-y-3">
            {savedAddresses.length > 0 ? (
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-700">Endereços salvos</p>
                {savedAddresses.map((item) => (
                  <button
                    key={`${item.address}-${item.neighborhoodId}`}
                    type="button"
                    onClick={() => {
                      setAddress(item.address);
                      if (item.neighborhoodId) setNeighborhoodId(item.neighborhoodId);
                    }}
                    className="block w-full text-left text-xs bg-slate-50 border rounded-lg px-3 py-2"
                  >
                    {item.address}
                  </button>
                ))}
              </div>
            ) : null}
            <label className="block text-xs font-bold text-gray-700">
              Selecione o Bairro *
              <select
                value={neighborhoodId}
                onChange={(event) => setNeighborhoodId(event.target.value)}
                className="mt-1 w-full border rounded-lg p-2 text-sm"
              >
                {catalog?.neighborhoods.map((neighborhood) => (
                  <option key={neighborhood.id} value={neighborhood.id}>
                    {neighborhood.name} (Taxa: {formatCurrency(neighborhood.delivery_fee)})
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-bold text-gray-700">
              Endereço Completo *
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Rua, número, complemento"
                className="mt-1 w-full border rounded-lg p-2 text-sm"
              />
            </label>
            <MapPreview query={mapsQuery} />
          </div>
        ) : null}
      </section>

      <section className="bg-white p-5 rounded-xl border">
        <h2 className="font-bold text-lg mb-4">3. Forma de Pagamento</h2>
        <div className="space-y-2">
          {paymentOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <input
                type="radio"
                checked={paymentMethod === option.value}
                onChange={() => setPaymentMethod(option.value)}
              />
              <div>
                <span className="font-bold text-sm block">{option.title}</span>
                <span className="text-xs text-gray-500 block">{option.description}</span>
              </div>
            </label>
          ))}
        </div>
        {pixPreview ? (
          <div className="mt-3">
            <PixBlock payload={pixPreview} amount={total} />
          </div>
        ) : null}
        {paymentMethod === "cash" ? (
          <label className="block text-xs font-bold text-gray-700 mt-3">
            Precisa de troco para quanto?
            <input
              value={changeFor}
              onChange={(event) => setChangeFor(event.target.value)}
              placeholder="Ex: 50,00"
              className="mt-1 w-full border rounded-lg p-2 text-sm"
            />
          </label>
        ) : null}
        <label className="block text-xs font-bold text-gray-700 mt-3">
          Cupom
          <input
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
            placeholder="Ex: BERTIOGA10"
            className="mt-1 w-full border rounded-lg p-2 text-sm"
          />
        </label>
        {couponError ? <p className="text-xs text-red-600 font-bold mt-1">{couponError}</p> : null}
        {discount > 0 ? (
          <p className="text-xs text-emerald-700 font-bold mt-1">
            Cupom aplicado: −{formatCurrency(discount)}
          </p>
        ) : null}
        <label className="block text-xs font-bold text-gray-700 mt-3">
          Observação geral do pedido
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="mt-1 w-full border rounded-lg p-2 text-sm"
            rows={2}
          />
        </label>
      </section>

      <FieldNotice message={error} />

      <section className="bg-slate-900 text-white p-5 rounded-xl space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal:</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Taxa de Entrega:</span>
          <span>{formatCurrency(baseFee)}</span>
        </div>
        {extraFee > 0 ? (
          <div className="flex justify-between text-sm text-amber-200">
            <span>
              Taxa extra
              {extras.sunday > 0 ? " domingo" : ""}
              {extras.night > 0 ? " noturna" : ""}:
            </span>
            <span>{formatCurrency(extraFee)}</span>
          </div>
        ) : null}
        {discount > 0 ? (
          <div className="flex justify-between text-sm text-emerald-200">
            <span>Desconto:</span>
            <span>−{formatCurrency(discount)}</span>
          </div>
        ) : null}
        <div
          className="flex justify-between text-lg font-black border-t border-slate-700 pt-2"
          style={{ color: store.primary_color }}
        >
          <span>Total:</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <button
          type="submit"
          disabled={submitting || !open}
          className="w-full font-black py-3 rounded-xl mt-4 text-center text-base hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: store.primary_color, color: ink }}
        >
          {open ? "Enviar Pedido para a Loja" : "Loja fechada"}
        </button>
      </section>
    </form>
  );
}
