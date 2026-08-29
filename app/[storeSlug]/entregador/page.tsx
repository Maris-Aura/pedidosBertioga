"use client";

import { FormEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getStoreCatalog } from "@/lib/demo-db";
import { digitsOnly } from "@/lib/format";

export default function CourierLoginPage() {
  const params = useParams<{ storeSlug: string }>();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const catalog = getStoreCatalog(params.storeSlug);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const match = catalog?.couriers.find(
      (courier) => digitsOnly(courier.phone) === digitsOnly(phone),
    );
    if (!match) {
      setError("Telefone não encontrado. Use o número cadastrado na loja.");
      return;
    }
    router.push(`/${params.storeSlug}/entregador/${match.id}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-md mx-auto mt-16 bg-white border rounded-2xl p-6 space-y-3"
    >
      <h1 className="text-xl font-black">Painel do motoboy</h1>
      <p className="text-sm text-gray-500">
        {catalog?.store.name ?? "Loja"} · entre com o telefone cadastrado.
      </p>
      <input
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        placeholder="Telefone"
        className="w-full border rounded-lg p-2 text-sm"
      />
      {error ? <p className="text-xs text-red-600 font-bold">{error}</p> : null}
      <button className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl">
        Entrar
      </button>
    </form>
  );
}
