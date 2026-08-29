"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  getStoreCatalog,
  patchStore,
  removeNeighborhood,
  removeProduct,
  removeProductOption,
  saveCategory,
  saveCourier,
  saveNeighborhood,
  saveProduct,
  saveProductOption,
  subscribeDemoDb,
} from "@/lib/demo-db";
import type {
  CatalogProduct,
  OptionItem,
  ProductOption,
  StoreCatalog,
} from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { SuccessNotice } from "@/components/ui/Notice";
import { ImagePicker } from "@/components/ui/ImagePicker";

type Tab = "store" | "menu" | "neighborhoods" | "couriers" | "payment";

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
    { id: "store", label: "Loja" },
    { id: "menu", label: "Cardápio" },
    { id: "neighborhoods", label: "Bairros" },
    { id: "couriers", label: "Entregadores" },
    { id: "payment", label: "Pagamento" },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
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

      {tab === "store" ? <StoreTab catalog={catalog} /> : null}
      {tab === "menu" ? <MenuTab catalog={catalog} /> : null}
      {tab === "neighborhoods" ? <NeighborhoodsTab catalog={catalog} /> : null}
      {tab === "couriers" ? <CouriersTab catalog={catalog} /> : null}
      {tab === "payment" ? <PaymentTab catalog={catalog} /> : null}
    </div>
  );
}

function StoreTab({ catalog }: { catalog: StoreCatalog }) {
  const [hours, setHours] = useState(catalog.store.hours);
  const [logoUrl, setLogoUrl] = useState(catalog.store.logo_url ?? "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setHours(catalog.store.hours);
    setLogoUrl(catalog.store.logo_url ?? "");
  }, [catalog.store.hours, catalog.store.logo_url]);

  function save(event: FormEvent) {
    event.preventDefault();
    patchStore(catalog.store.id, {
      hours: hours.trim() || "11:00–22:00",
      logo_url: logoUrl.trim() || null,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={save} className="bg-white p-4 rounded-xl border space-y-3">
      <label className="block text-xs font-bold">
        Horário de funcionamento
        <input
          value={hours}
          onChange={(event) => setHours(event.target.value)}
          placeholder="11:00–22:00"
          className="mt-1 w-full border rounded-lg p-2 text-sm"
        />
      </label>
      <ImagePicker
        label="Logo da loja"
        kind="logo"
        value={logoUrl}
        onChange={setLogoUrl}
      />
      <p className="text-[11px] text-gray-500">
        Aberto/fechado para pedidos é controlado no topo do painel da cozinha.
      </p>
      <SuccessNotice message={saved ? "Dados da loja salvos." : null} />
      <button className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg">
        Salvar
      </button>
    </form>
  );
}

function MenuTab({ catalog }: { catalog: StoreCatalog }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [categoryId, setCategoryId] = useState(catalog.categories[0]?.id ?? "");
  const [categoryName, setCategoryName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

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
      image_url: imageUrl.trim() || null,
      active: true,
    });
    setName("");
    setDescription("");
    setPrice("");
    setImageUrl("");
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
        <ImagePicker
          label="Foto do produto"
          value={imageUrl}
          onChange={setImageUrl}
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
        <section key={category.id} className="bg-white p-4 rounded-xl border space-y-2">
          <h2 className="font-bold">{category.name}</h2>
          {catalog.products
            .filter((product) => product.category_id === category.id)
            .map((product) => (
              <div key={product.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2 min-w-0">
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.image_url}
                        alt=""
                        className="size-8 rounded-md object-cover border"
                      />
                    ) : null}
                    {product.name} · {formatCurrency(product.price)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-xs font-bold"
                      onClick={() =>
                        setEditingId((current) => (current === product.id ? null : product.id))
                      }
                    >
                      {editingId === product.id ? "Fechar" : "Editar"}
                    </button>
                    <button
                      type="button"
                      className="text-red-600 text-xs font-bold"
                      onClick={() => removeProduct(product.id)}
                    >
                      Remover
                    </button>
                  </div>
                </div>
                {editingId === product.id ? <ProductEditor product={product} /> : null}
              </div>
            ))}
        </section>
      ))}
    </div>
  );
}

function ProductEditor({ product }: { product: CatalogProduct }) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState(String(product.price));
  const [imageUrl, setImageUrl] = useState(product.image_url ?? "");
  const [saved, setSaved] = useState(false);

  function save(event: FormEvent) {
    event.preventDefault();
    saveProduct({
      ...product,
      name: name.trim(),
      description: description.trim(),
      price: Number(price.replace(",", ".")) || 0,
      image_url: imageUrl.trim() || null,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-3 pt-2 border-t">
      <form onSubmit={save} className="grid gap-2 md:grid-cols-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="border rounded-lg p-2 text-sm"
        />
        <input
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          className="border rounded-lg p-2 text-sm"
        />
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="border rounded-lg p-2 text-sm md:col-span-2"
        />
        <ImagePicker
          label="Foto do produto"
          value={imageUrl}
          onChange={setImageUrl}
        />
        <button className="bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-lg">
          Atualizar produto
        </button>
      </form>
      <SuccessNotice message={saved ? "Produto atualizado." : null} />
      <OptionsEditor product={product} />
    </div>
  );
}

function OptionsEditor({ product }: { product: CatalogProduct }) {
  const [title, setTitle] = useState("");
  const [minChoices, setMinChoices] = useState("0");
  const [maxChoices, setMaxChoices] = useState("1");

  function addOption(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    saveProductOption(
      {
        id: crypto.randomUUID(),
        store_id: product.store_id,
        product_id: product.id,
        title: title.trim(),
        min_choices: Number(minChoices) || 0,
        max_choices: Number(maxChoices) || 1,
      },
      [],
    );
    setTitle("");
    setMinChoices("0");
    setMaxChoices("1");
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-black uppercase text-gray-500">Etapas e adicionais</h3>
      <form onSubmit={addOption} className="grid gap-2 md:grid-cols-4">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ex: Tamanho"
          className="border rounded-lg p-2 text-sm md:col-span-2"
        />
        <input
          value={minChoices}
          onChange={(event) => setMinChoices(event.target.value)}
          placeholder="Mín."
          className="border rounded-lg p-2 text-sm"
        />
        <input
          value={maxChoices}
          onChange={(event) => setMaxChoices(event.target.value)}
          placeholder="Máx."
          className="border rounded-lg p-2 text-sm"
        />
        <button className="md:col-span-4 bg-slate-100 text-xs font-bold px-3 py-2 rounded-lg">
          Adicionar etapa
        </button>
      </form>
      {product.options.map((option) => (
        <OptionRow key={option.id} option={option} />
      ))}
    </div>
  );
}

function OptionRow({ option }: { option: ProductOption & { items: OptionItem[] } }) {
  const [title, setTitle] = useState(option.title);
  const [minChoices, setMinChoices] = useState(String(option.min_choices));
  const [maxChoices, setMaxChoices] = useState(String(option.max_choices));
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");

  function saveMeta(event: FormEvent) {
    event.preventDefault();
    saveProductOption(
      {
        ...option,
        title: title.trim(),
        min_choices: Number(minChoices) || 0,
        max_choices: Number(maxChoices) || 1,
      },
      option.items,
    );
  }

  function addItem(event: FormEvent) {
    event.preventDefault();
    if (!itemName.trim()) return;
    saveProductOption(option, [
      ...option.items,
      {
        id: crypto.randomUUID(),
        option_id: option.id,
        name: itemName.trim(),
        price: Number(itemPrice.replace(",", ".")) || 0,
      },
    ]);
    setItemName("");
    setItemPrice("");
  }

  return (
    <div className="bg-slate-50 rounded-lg p-3 space-y-2">
      <form onSubmit={saveMeta} className="flex flex-wrap gap-2 items-center">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="border rounded-lg p-1.5 text-xs flex-1 min-w-32"
        />
        <input
          value={minChoices}
          onChange={(event) => setMinChoices(event.target.value)}
          className="border rounded-lg p-1.5 text-xs w-16"
        />
        <input
          value={maxChoices}
          onChange={(event) => setMaxChoices(event.target.value)}
          className="border rounded-lg p-1.5 text-xs w-16"
        />
        <button className="text-[11px] font-bold">Salvar etapa</button>
        <button
          type="button"
          className="text-[11px] font-bold text-red-600"
          onClick={() => removeProductOption(option.id)}
        >
          Remover etapa
        </button>
      </form>
      {option.items.map((item) => (
        <div key={item.id} className="flex justify-between text-xs pl-1">
          <span>
            {item.name}
            {item.price > 0 ? ` · +${formatCurrency(item.price)}` : " · grátis"}
          </span>
          <button
            type="button"
            className="text-red-600 font-bold"
            onClick={() =>
              saveProductOption(
                option,
                option.items.filter((entry) => entry.id !== item.id),
              )
            }
          >
            Remover
          </button>
        </div>
      ))}
      <form onSubmit={addItem} className="flex gap-2">
        <input
          value={itemName}
          onChange={(event) => setItemName(event.target.value)}
          placeholder="Opção (ex: Nutella)"
          className="flex-1 border rounded-lg p-1.5 text-xs"
        />
        <input
          value={itemPrice}
          onChange={(event) => setItemPrice(event.target.value)}
          placeholder="Preço"
          className="w-20 border rounded-lg p-1.5 text-xs"
        />
        <button className="text-[11px] font-bold">Add</button>
      </form>
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
      <form onSubmit={add} className="bg-white p-4 rounded-xl border flex gap-2 flex-wrap">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Bairro"
          className="flex-1 min-w-40 border rounded-lg p-2 text-sm"
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
  const [saved, setSaved] = useState(false);

  function save(event: FormEvent) {
    event.preventDefault();
    patchStore(catalog.store.id, { pix_key: pixKey.trim() });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
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
      <SuccessNotice message={saved ? "Chave PIX salva." : null} />
      <button className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg">
        Salvar chave PIX
      </button>
    </form>
  );
}
