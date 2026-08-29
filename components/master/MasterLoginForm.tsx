"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function MasterLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/master-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error || "Não foi possível entrar.");
        return;
      }
      router.push("/master");
      router.refresh();
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-md mx-auto mt-16 bg-white p-6 rounded-2xl border shadow-sm space-y-4"
    >
      <h1 className="text-xl font-black">Painel Master</h1>
      <p className="text-sm text-gray-500">Gestão das lojas da plataforma.</p>
      {error ? <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p> : null}
      <label className="block text-xs font-bold">
        E-mail
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 w-full border rounded-lg p-2 text-sm"
          autoComplete="username"
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
          autoComplete="current-password"
          required
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl disabled:opacity-60"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
