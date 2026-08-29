"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createStoreAdmin,
  removeStoreAdmin,
  updateStoreAdmin,
} from "@/lib/demo-db";
import type { Store, StoreUser } from "@/lib/types";
import { FieldNotice, SuccessNotice } from "@/components/ui/Notice";
import { PasswordField } from "@/components/ui/PasswordField";
import { Eye, EyeOff } from "lucide-react";

function mergeUsers(local: StoreUser[], remote: StoreUser[]) {
  const byEmail = new Map<string, StoreUser>();
  for (const user of [...remote, ...local]) {
    if (user.role !== "admin") continue;
    const current = byEmail.get(user.email);
    byEmail.set(user.email, {
      ...current,
      ...user,
      password: user.password || current?.password,
    });
  }
  return [...byEmail.values()];
}

export function MasterStoreUsers({
  stores,
  users,
}: {
  stores: Store[];
  users: StoreUser[];
}) {
  const [storeId, setStoreId] = useState(stores[0]?.id ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<StoreUser[]>([]);

  const storeName = stores.find((store) => store.id === storeId)?.name ?? "a loja";
  const allUsers = useMemo(
    () => mergeUsers(users, remoteUsers),
    [remoteUsers, users],
  );
  const storeUsers = useMemo(
    () => allUsers.filter((user) => user.store_id === storeId),
    [allUsers, storeId],
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/store-users", { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) return;
        const data = (await response.json()) as { users?: StoreUser[] };
        if (!cancelled) setRemoteUsers(data.users ?? []);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2500);
  }

  function askCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("A senha e a confirmação não são iguais.");
      return;
    }
    setPending(true);
  }

  async function confirmCreate() {
    setSaving(true);
    try {
      const response = await fetch("/api/store-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ storeId, email, password }),
      });
      const data = (await response.json()) as {
        error?: string;
        users?: StoreUser[];
      };

      const local = createStoreAdmin(storeId, email, password);
      if (!response.ok && !local.ok) {
        setError(data.error || local.error);
        return;
      }

      if (data.users) setRemoteUsers(data.users);
      setEmail("");
      setPassword("");
      setConfirm("");
      setShowPassword(false);
      setShowConfirm(false);
      setPending(false);
      flash("Usuário cadastrado. Já pode entrar no painel da loja.");
    } catch {
      const local = createStoreAdmin(storeId, email, password);
      if (!local.ok) {
        setError(local.error);
        return;
      }
      setEmail("");
      setPassword("");
      setConfirm("");
      setPending(false);
      flash("Usuário cadastrado neste aparelho.");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(user: StoreUser, nextPassword: string) {
    if (nextPassword.length < 6) {
      setError("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    const response = await fetch(`/api/store-users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ password: nextPassword }),
    }).catch(() => null);
    const local = updateStoreAdmin(user.id, { password: nextPassword });
    if (response?.ok) {
      const data = (await response.json()) as { users?: StoreUser[] };
      if (data.users) setRemoteUsers(data.users);
    }
    if (!response?.ok && !local.ok) {
      setError(local.error);
      return;
    }
    flash("Senha atualizada.");
  }

  async function removeUser(userId: string) {
    const response = await fetch(`/api/store-users/${userId}`, {
      method: "DELETE",
      credentials: "include",
    }).catch(() => null);
    const local = removeStoreAdmin(userId);
    setConfirmRemoveId(null);
    if (response?.ok) {
      const data = (await response.json()) as { users?: StoreUser[] };
      if (data.users) setRemoteUsers(data.users);
    }
    if (!response?.ok && !local.ok) {
      setError(local.error);
      return;
    }
    flash("Usuário removido.");
  }

  return (
    <section className="bg-white p-5 rounded-xl border space-y-4">
      <div>
        <h2 className="font-bold">Usuários de cada loja</h2>
        <p className="text-xs text-gray-500 mt-1">
          Cadastre o atendente aqui e use o mesmo e-mail e senha em /acai/admin ou
          /burger/admin.
        </p>
      </div>

      <label className="block text-xs font-bold">
        Loja
        <select
          value={storeId}
          onChange={(event) => {
            setStoreId(event.target.value);
            setPending(false);
            setConfirmRemoveId(null);
            setError(null);
          }}
          className="mt-1 w-full border rounded-lg p-2 text-sm font-normal"
        >
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
      </label>

      <div className="space-y-2">
        {storeUsers.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum usuário nesta loja.</p>
        ) : (
          storeUsers.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              reveal={Boolean(visiblePasswords[user.id])}
              onReveal={(reveal) =>
                setVisiblePasswords((current) => ({ ...current, [user.id]: reveal }))
              }
              confirmingRemove={confirmRemoveId === user.id}
              onAskRemove={() => setConfirmRemoveId(user.id)}
              onCancelRemove={() => setConfirmRemoveId(null)}
              onRemove={() => {
                void removeUser(user.id);
              }}
              onChangePassword={(next) => {
                void changePassword(user, next);
              }}
            />
          ))
        )}
      </div>

      <form onSubmit={askCreate} className="grid gap-3 md:grid-cols-2 pt-3 border-t">
        <h3 className="font-bold text-sm md:col-span-2">Cadastrar usuário</h3>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="E-mail"
          className="border rounded-lg p-2 text-sm md:col-span-2"
          required
        />
        <PasswordField
          value={password}
          onChange={setPassword}
          placeholder="Senha"
          required
          reveal={showPassword}
          onRevealChange={setShowPassword}
        />
        <PasswordField
          value={confirm}
          onChange={setConfirm}
          placeholder="Confirmar senha"
          required
          reveal={showConfirm}
          onRevealChange={setShowConfirm}
        />
        <button className="md:col-span-2 bg-slate-900 text-white font-bold py-2 rounded-lg">
          Cadastrar usuário
        </button>
      </form>

      <FieldNotice message={error} />
      <SuccessNotice message={notice} />

      {pending ? (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-3">
            <h3 className="font-black text-lg">Confirmar cadastro</h3>
            <p className="text-sm text-gray-600">
              Criar este usuário em <strong>{storeName}</strong>?
            </p>
            <div className="text-sm bg-slate-50 border rounded-lg p-3 space-y-1">
              <div>
                <span className="text-xs text-gray-500">E-mail</span>
                <div className="font-bold">{email}</div>
              </div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs text-gray-500">Senha</span>
                  <div className="font-mono">{showPassword ? password : "••••••••"}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="text-xs font-bold inline-flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  {showPassword ? "Ocultar" : "Ver senha"}
                </button>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPending(false)}
                disabled={saving}
                className="w-1/2 bg-gray-100 font-bold py-2.5 rounded-xl text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  void confirmCreate();
                }}
                disabled={saving}
                className="w-1/2 bg-slate-900 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Confirmar cadastro"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function UserRow({
  user,
  reveal,
  onReveal,
  confirmingRemove,
  onAskRemove,
  onCancelRemove,
  onRemove,
  onChangePassword,
}: {
  user: StoreUser;
  reveal: boolean;
  onReveal: (reveal: boolean) => void;
  confirmingRemove: boolean;
  onAskRemove: () => void;
  onCancelRemove: () => void;
  onRemove: () => void;
  onChangePassword: (password: string) => void;
}) {
  const [nextPassword, setNextPassword] = useState("");
  const [showNext, setShowNext] = useState(false);
  const passwordLabel = user.password || "salva no servidor";

  return (
    <div className="border rounded-xl p-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-bold text-sm">{user.email}</div>
          <div className="text-xs text-gray-500 flex items-center gap-2">
            Senha:{" "}
            <span className="font-mono">{reveal ? passwordLabel : "••••••••"}</span>
            <button
              type="button"
              onClick={() => onReveal(!reveal)}
              className="inline-flex items-center gap-1 font-bold text-slate-700"
            >
              {reveal ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              {reveal ? "Ocultar" : "Ver senha"}
            </button>
          </div>
        </div>
        {confirmingRemove ? (
          <div className="flex gap-2">
            <button type="button" onClick={onCancelRemove} className="text-xs font-bold">
              Cancelar
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="text-xs font-bold text-white bg-red-600 px-2.5 py-1 rounded-lg"
            >
              Confirmar exclusão
            </button>
          </div>
        ) : (
          <button type="button" onClick={onAskRemove} className="text-xs font-bold text-red-600">
            Remover
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-40">
          <PasswordField
            value={nextPassword}
            onChange={setNextPassword}
            placeholder="Nova senha"
            reveal={showNext}
            onRevealChange={setShowNext}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            onChangePassword(nextPassword);
            setNextPassword("");
            setShowNext(false);
          }}
          className="text-xs font-bold bg-slate-100 px-3 rounded-lg"
        >
          Trocar senha
        </button>
      </div>
    </div>
  );
}
