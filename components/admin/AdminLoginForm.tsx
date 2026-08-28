"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { demoLogin, getStoreBySlug } from "@/lib/demo-db";

export function AdminLoginForm({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const store = getStoreBySlug(storeSlug);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const session = demoLogin(email, password);
    if (!session || (session.role !== "admin" && session.role !== "master")) {
      setError("E-mail ou senha inválidos.");
      return;
    }
    if (session.role === "admin" && store && session.storeId !== store.id) {
      setError("Este usuário não pertence a esta loja.");
      return;
    }
    router.push(`/${storeSlug}/admin`);
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-md mx-auto mt-16 bg-white p-6 rounded-2xl border shadow-sm space-y-4"
    >
      <h1 className="text-xl font-black">Painel da Loja</h1>
      <p className="text-sm text-gray-500">
        {store?.name ?? storeSlug} · entre com o e-mail do atendente.
      </p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <label className="block text-xs font-bold">
        E-mail
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full border rounded-lg p-2 text-sm"
          required
        />
      </label>
      <label className="block text-xs font-bold">
        Senha
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 w-full border rounded-lg p-2 text-sm"
          required
        />
      </label>
      <button
        type="submit"
        className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl"
      >
        Entrar
      </button>
      <p className="text-[11px] text-gray-400">
        Demo: acai@loja.com / admin123 · burger@loja.com / admin123
      </p>
    </form>
  );
}
