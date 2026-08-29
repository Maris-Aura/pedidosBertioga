"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { demoLogin, getStoreBySlug } from "@/lib/demo-db";
import { FieldNotice } from "@/components/ui/Notice";
import { PasswordField } from "@/components/ui/PasswordField";

export function AdminLoginForm({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const store = getStoreBySlug(storeSlug);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      const response = await fetch("/api/auth/store-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          storeId: store?.id,
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (response.ok) {
        router.push(`/${storeSlug}/admin`);
        router.refresh();
        return;
      }

      if (response.status === 403) {
        setError(data.error || "Este usuário não pertence a esta loja.");
        return;
      }

      const session = demoLogin(email, password);
      if (!session || (session.role !== "admin" && session.role !== "master")) {
        setError(data.error || "E-mail ou senha inválidos.");
        return;
      }
      if (session.role === "admin" && store && session.storeId !== store.id) {
        setError("Este usuário não pertence a esta loja.");
        return;
      }
      router.push(`/${storeSlug}/admin`);
      router.refresh();
    } catch {
      const session = demoLogin(email, password);
      if (!session) {
        setError("E-mail ou senha inválidos.");
        setPending(false);
        return;
      }
      router.push(`/${storeSlug}/admin`);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-md mx-auto mt-16 bg-white p-6 rounded-2xl border space-y-4"
    >
      <h1 className="text-xl font-black">Painel da Loja</h1>
      <p className="text-sm text-gray-500">
        {store?.name ?? storeSlug} · entre com o e-mail do atendente.
      </p>
      <FieldNotice message={error || null} />
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
        <div className="mt-1">
          <PasswordField
            value={password}
            onChange={setPassword}
            reveal={showPassword}
            onRevealChange={setShowPassword}
            autoComplete="current-password"
            required
          />
        </div>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl disabled:opacity-60"
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
