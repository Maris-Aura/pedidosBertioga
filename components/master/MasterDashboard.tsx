"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createStoreAdmin,
  getAllStores,
  setStoreActive,
  subscribeDemoDb,
  upsertStore,
} from "@/lib/demo-db";
import { SITE_NAME } from "@/lib/site";
import type { Store } from "@/lib/types";
import { StoreMark } from "@/components/ui/StoreMark";
import { SuccessNotice } from "@/components/ui/Notice";

export function MasterDashboard() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [color, setColor] = useState("#f59e0b");
  const [pixKey, setPixKey] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [hours, setHours] = useState("11:00–22:00");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [targetStoreId, setTargetStoreId] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      const list = getAllStores();
      setStores(list);
      if (!targetStoreId && list[0]) setTargetStoreId(list[0].id);
    };
    load();
    return subscribeDemoDb(load);
  }, [targetStoreId]);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2500);
  }

  function createStore(event: FormEvent) {
    event.preventDefault();
    upsertStore({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      primary_color: color,
      pix_key: pixKey.trim(),
      hours: hours.trim() || "11:00–22:00",
      logo_url: logoUrl.trim() || null,
      active: true,
      accepting_orders: true,
    });
    setName("");
    setSlug("");
    setPixKey("");
    setLogoUrl("");
    flash("Loja criada.");
  }

  function createAdmin(event: FormEvent) {
    event.preventDefault();
    if (!targetStoreId) return;
    createStoreAdmin(targetStoreId, adminEmail.trim(), adminPassword);
    setAdminEmail("");
    setAdminPassword("");
    flash("Conta da loja criada.");
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black">Painel Master</h1>
          <p className="text-sm text-gray-500">
            Gerencie as lojas de {SITE_NAME} (pedidosbertioga.com.br).
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/master/login");
            router.refresh();
          }}
          className="text-xs bg-white border font-bold px-3 py-2 rounded-lg"
        >
          Sair
        </button>
      </div>

      <SuccessNotice message={notice} />

      <form onSubmit={createStore} className="bg-white p-5 rounded-xl border grid gap-3 md:grid-cols-2">
        <h2 className="font-bold md:col-span-2">Cadastrar nova loja</h2>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nome da loja"
          className="border rounded-lg p-2 text-sm"
          required
        />
        <input
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          placeholder="Slug da URL (ex: acai)"
          className="border rounded-lg p-2 text-sm"
          required
        />
        <input
          value={pixKey}
          onChange={(event) => setPixKey(event.target.value)}
          placeholder="Chave PIX"
          className="border rounded-lg p-2 text-sm"
        />
        <input
          value={hours}
          onChange={(event) => setHours(event.target.value)}
          placeholder="Horário (ex: 11:00–22:00)"
          className="border rounded-lg p-2 text-sm"
        />
        <input
          value={logoUrl}
          onChange={(event) => setLogoUrl(event.target.value)}
          placeholder="URL do logo"
          className="border rounded-lg p-2 text-sm md:col-span-2"
        />
        <label className="text-xs font-bold flex items-center gap-2">
          Cor principal
          <input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
        </label>
        <button className="md:col-span-2 bg-slate-900 text-white font-bold py-2 rounded-lg">
          Criar loja
        </button>
      </form>

      <form onSubmit={createAdmin} className="bg-white p-5 rounded-xl border grid gap-3 md:grid-cols-2">
        <h2 className="font-bold md:col-span-2">Criar conta de administrador da loja</h2>
        <select
          value={targetStoreId}
          onChange={(event) => setTargetStoreId(event.target.value)}
          className="border rounded-lg p-2 text-sm"
        >
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
        <input
          type="email"
          value={adminEmail}
          onChange={(event) => setAdminEmail(event.target.value)}
          placeholder="E-mail"
          className="border rounded-lg p-2 text-sm"
          required
        />
        <input
          type="password"
          value={adminPassword}
          onChange={(event) => setAdminPassword(event.target.value)}
          placeholder="Senha"
          className="border rounded-lg p-2 text-sm"
          required
        />
        <button className="bg-slate-900 text-white font-bold py-2 rounded-lg">Criar usuário</button>
      </form>

      <section className="space-y-2">
        {stores.map((store) => (
          <div
            key={store.id}
            className="bg-white p-4 rounded-xl border flex justify-between items-center gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <StoreMark store={store} size={40} />
              <div className="min-w-0">
                <div className="font-bold">{store.name}</div>
                <div className="text-xs text-gray-500">
                  /{store.slug} · {store.hours} · PIX: {store.pix_key || "não cadastrada"}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStoreActive(store.id, !store.active)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full shrink-0 ${
                store.active
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {store.active ? "Ativa · suspender" : "Suspensa · ativar"}
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
