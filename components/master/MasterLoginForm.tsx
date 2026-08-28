"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { demoLogin } from "@/lib/demo-db";

export function MasterLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const session = demoLogin(email, password);
    if (session?.role !== "master") {
      setError("Acesso restrito à dona da plataforma.");
      return;
    }
    router.push("/master");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-md mx-auto mt-16 bg-white p-6 rounded-2xl border shadow-sm space-y-4"
    >
      <h1 className="text-xl font-black">Painel Master</h1>
      <p className="text-sm text-gray-500">Gestão das lojas da plataforma.</p>
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
      <button type="submit" className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl">
        Entrar
      </button>
      <p className="text-[11px] text-gray-400">Demo: master@pedidosbertioga.com / master123</p>
    </form>
  );
}
