"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  getStoreCatalog,
  saveCategory,
  saveCourier,
  saveNeighborhood,
  savePixKey,
  saveProduct,
  removeNeighborhood,
  removeProduct,
  subscribeDemoDb,
} from "@/lib/demo-db";
import type { StoreCatalog } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

type Tab = "menu" | "neighborhoods" | "couriers" | "payment";

export function StoreSettings({ storeSlug }: { storeSlug: string }) {
  const [tab, setTab] = useState<Tab>("menu");
  const [catalog, setCatalog] = useState<StoreCatalog | null>(null);

  useEffect(() => {
    const load = () => setCatalog(getStoreCatalog(storeSlug));
    load();
    return subscribeDemoDb(load);
  }, [storeSlug]);

  if (!catalog) return <p className="p-6">Loja não encontrada.</p>;

  const tabs: { id: Tab; label: string }[] = [
    { id: "menu", label: "Cardápio" },
    { id: "neighborhoods", label: "Bairros" },
    { id: "couriers", label: "Entregadores" },
    { id: "payment", label: "Pagamento" },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <Link href={`/${storeSlug}/admin`} className="text-xs font-bold text-gray-600">
        ← Voltar ao KDS
      </Link>
      <h1 className="text-2xl font-black">Configurações da Loja</h1>
      <div className="flex gap-2 flex-wrap">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              tab === item.id ? "bg-slate-900 text-white" : "bg-white border"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "menu" ? <MenuTab catalog={catalog} /> : null}
      {tab === "neighborhoods" ? <NeighborhoodsTab catalog={catalog} /> : null}
      {tab === "couriers" ? <CouriersTab catalog={catalog} /> : null}
      {tab === "payment" ? <PaymentTab catalog={catalog} /> : null}
    </div>
  );
}

function MenuTab({ catalog }: { catalog: StoreCatalog }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState(catalog.categories[0]?.id ?? "");
  const [categoryName, setCategoryName] = useState("");

  function addCategory(event: FormEvent) {
    event.preventDefault();
    if (!categoryName.trim()) return;
    saveCategory({
      id: crypto.randomUUID(),
      store_id: catalog.store.id,
      name: categoryName.trim(),
      order: catalog.categories.length + 1,
      active: true,
    });
    setCategoryName("");
  }

  function addProduct(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !categoryId) return;
    saveProduct({
      id: crypto.randomUUID(),
      store_id: catalog.store.id,
      category_id: categoryId,
      name: name.trim(),
      description: description.trim(),
      price: Number(price.replace(",", ".")) || 0,
      image_url: null,
      active: true,
    });
    setName("");
    setDescription("");
    setPrice("");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={addCategory} className="bg-white p-4 rounded-xl border flex gap-2">
        <input
          value={categoryName}
          onChange={(event) => setCategoryName(event.target.value)}
          placeholder="Nova categoria"
          className="flex-1 border rounded-lg p-2 text-sm"
        />
        <button className="bg-slate-900 text-white text-xs font-bold px-3 rounded-lg">
          Adicionar categoria
        </button>
      </form>

      <form onSubmit={addProduct} className="bg-white p-4 rounded-xl border grid gap-2 md:grid-cols-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nome do produto"
          className="border rounded-lg p-2 text-sm"
        />
        <input
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          placeholder="Preço"
          className="border rounded-lg p-2 text-sm"
        />
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Descrição"
          className="border rounded-lg p-2 text-sm md:col-span-2"
        />
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className="border rounded-lg p-2 text-sm"
        >
          {catalog.categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <button className="bg-slate-900 text-white text-xs font-bold px-3 rounded-lg">
          Salvar produto
        </button>
      </form>

      {catalog.categories.map((category) => (
        <section key={category.id} className="bg-white p-4 rounded-xl border">
          <h2 className="font-bold mb-2">{category.name}</h2>
          {catalog.products
            .filter((product) => product.category_id === category.id)
            .map((product) => (
              <div key={product.id} className="flex justify-between text-sm border-b py-2">
                <span>
                  {product.name} · {formatCurrency(product.price)}
                </span>
                <button
                  type="button"
                  className="text-red-600 text-xs font-bold"
                  onClick={() => removeProduct(product.id)}
                >
                  Remover
                </button>
              </div>
            ))}
        </section>
      ))}
    </div>
  );
}

function NeighborhoodsTab({ catalog }: { catalog: StoreCatalog }) {
  const [name, setName] = useState("");
  const [fee, setFee] = useState("");

  function add(event: FormEvent) {
    event.preventDefault();
    saveNeighborhood({
      id: crypto.randomUUID(),
      store_id: catalog.store.id,
      name: name.trim(),
      delivery_fee: Number(fee.replace(",", ".")) || 0,
    });
    setName("");
    setFee("");
  }

  return (
    <div className="space-y-3">
      <form onSubmit={add} className="bg-white p-4 rounded-xl border flex gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Bairro"
          className="flex-1 border rounded-lg p-2 text-sm"
        />
        <input
          value={fee}
          onChange={(event) => setFee(event.target.value)}
          placeholder="Taxa"
          className="w-28 border rounded-lg p-2 text-sm"
        />
        <button className="bg-slate-900 text-white text-xs font-bold px-3 rounded-lg">
          Salvar
        </button>
      </form>
      {catalog.neighborhoods.map((neighborhood) => (
        <div
          key={neighborhood.id}
          className="bg-white p-3 rounded-xl border flex justify-between text-sm"
        >
          <span>
            {neighborhood.name} · {formatCurrency(neighborhood.delivery_fee)}
          </span>
          <button
            type="button"
            className="text-red-600 text-xs font-bold"
            onClick={() => removeNeighborhood(neighborhood.id)}
          >
            Remover
          </button>
        </div>
      ))}
    </div>
  );
}

function CouriersTab({ catalog }: { catalog: StoreCatalog }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  function add(event: FormEvent) {
    event.preventDefault();
    saveCourier({
      id: crypto.randomUUID(),
      store_id: catalog.store.id,
      name: name.trim(),
      phone,
      active: true,
    });
    setName("");
    setPhone("");
  }

  return (
    <div className="space-y-3">
      <form onSubmit={add} className="bg-white p-4 rounded-xl border grid gap-2 md:grid-cols-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nome do motoboy"
          className="border rounded-lg p-2 text-sm"
        />
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Telefone"
          className="border rounded-lg p-2 text-sm"
        />
        <button className="bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-lg md:col-span-2">
          Cadastrar entregador
        </button>
      </form>
      {catalog.couriers.map((courier) => (
        <div key={courier.id} className="bg-white p-3 rounded-xl border text-sm">
          {courier.name} · {courier.phone}
        </div>
      ))}
    </div>
  );
}

function PaymentTab({ catalog }: { catalog: StoreCatalog }) {
  const [pixKey, setPixKey] = useState(catalog.store.pix_key);

  function save(event: FormEvent) {
    event.preventDefault();
    savePixKey(catalog.store.id, pixKey.trim());
  }

  return (
    <form onSubmit={save} className="bg-white p-4 rounded-xl border space-y-3">
      <label className="block text-xs font-bold">
        Chave PIX da loja
        <input
          value={pixKey}
          onChange={(event) => setPixKey(event.target.value)}
          className="mt-1 w-full border rounded-lg p-2 text-sm"
        />
      </label>
      <button className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg">
        Salvar chave PIX
      </button>
    </form>
  );
}
