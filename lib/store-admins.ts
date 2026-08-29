import { createClient } from "@supabase/supabase-js";
import { digestPassword, passwordsMatch, signPayload, verifyPayload } from "@/lib/auth/passwords";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type StoredStoreAdmin = {
  id: string;
  store_id: string;
  email: string;
  password_digest: string;
};

export type StoreAdminSession = {
  email: string;
  role: "admin";
  storeId: string;
};

const SEED_ADMINS = [
  { id: "user-acai", store_id: "store-acai", email: "acai@loja.com", password: "admin123" },
  { id: "user-burger", store_id: "store-burger", email: "burger@loja.com", password: "admin123" },
];

type GlobalStore = typeof globalThis & { __pbStoreAdmins?: StoredStoreAdmin[] };

function memoryStore() {
  const globalStore = globalThis as GlobalStore;
  if (!globalStore.__pbStoreAdmins) globalStore.__pbStoreAdmins = [];
  return globalStore.__pbStoreAdmins;
}

function supabaseAdmin() {
  if (!isSupabaseConfigured()) return null;
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function mergeUsers(...lists: StoredStoreAdmin[][]) {
  const byEmail = new Map<string, StoredStoreAdmin>();
  for (const list of lists) {
    for (const user of list) {
      byEmail.set(user.email, user);
    }
  }
  return [...byEmail.values()];
}

function cookieOptions(host?: string) {
  const options: {
    httpOnly: boolean;
    sameSite: "lax";
    secure: boolean;
    path: string;
    maxAge: number;
    domain?: string;
  } = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
  if (host?.endsWith("pedidosbertioga.com.br")) {
    options.domain = ".pedidosbertioga.com.br";
  }
  return options;
}

export function storeAdminsCookieOptions(host?: string) {
  return cookieOptions(host);
}

export function storeSessionCookieOptions(host?: string) {
  return { ...cookieOptions(host), maxAge: 60 * 60 * 24 * 7 };
}

export async function parseStoreAdminsCookie(token: string | undefined) {
  const users = await verifyPayload<StoredStoreAdmin[]>(token);
  return Array.isArray(users) ? users : [];
}

export async function serializeStoreAdminsCookie(users: StoredStoreAdmin[]) {
  return signPayload(users);
}

async function listRemoteStoreAdmins() {
  const client = supabaseAdmin();
  if (!client) return { users: [] as StoredStoreAdmin[], remote: false };
  const { data, error } = await client
    .from("store_admins")
    .select("id, store_id, email, password_digest");
  if (error) return { users: [] as StoredStoreAdmin[], remote: false, error: error.message };
  return { users: (data ?? []) as StoredStoreAdmin[], remote: true };
}

export async function collectStoreAdmins(cookieToken?: string) {
  const cookieUsers = await parseStoreAdminsCookie(cookieToken);
  const remote = await listRemoteStoreAdmins();
  const users = mergeUsers(memoryStore(), cookieUsers, remote.users);
  memoryStore().splice(0, memoryStore().length, ...users);
  return { users, remote: remote.remote, error: remote.error };
}

export async function listStoreAdmins(storeId?: string, cookieToken?: string) {
  const collected = await collectStoreAdmins(cookieToken);
  return {
    ...collected,
    users: storeId
      ? collected.users.filter((user) => user.store_id === storeId)
      : collected.users,
  };
}

export async function createRemoteStoreAdmin(
  input: { storeId: string; email: string; password: string },
  cookieToken?: string,
) {
  const email = input.email.trim().toLowerCase();
  const collected = await collectStoreAdmins(cookieToken);
  if (collected.users.some((user) => user.email === email)) {
    return { ok: false as const, error: "Este e-mail já está cadastrado." };
  }

  const row: StoredStoreAdmin = {
    id: `user-${crypto.randomUUID()}`,
    store_id: input.storeId,
    email,
    password_digest: await digestPassword(input.password),
  };

  memoryStore().push(row);

  const client = supabaseAdmin();
  if (client) {
    const { error } = await client.from("store_admins").insert(row);
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      return {
        ok: true as const,
        user: row,
        users: mergeUsers(collected.users, [row]),
        remote: false,
        warning: error.message,
      };
    }
  }

  return {
    ok: true as const,
    user: row,
    users: mergeUsers(collected.users, [row]),
    remote: collected.remote,
  };
}

export async function updateRemoteStoreAdmin(
  id: string,
  patch: { email?: string; password?: string },
  cookieToken?: string,
) {
  const collected = await collectStoreAdmins(cookieToken);
  const user = collected.users.find((item) => item.id === id);
  if (!user) return { ok: false as const, error: "Usuário não encontrado." };

  if (patch.email) {
    const email = patch.email.trim().toLowerCase();
    if (collected.users.some((item) => item.id !== id && item.email === email)) {
      return { ok: false as const, error: "Este e-mail já está cadastrado." };
    }
    user.email = email;
  }
  if (patch.password) user.password_digest = await digestPassword(patch.password);

  const client = supabaseAdmin();
  if (client) {
    await client
      .from("store_admins")
      .update({
        email: user.email,
        password_digest: user.password_digest,
      })
      .eq("id", id);
  }

  return { ok: true as const, users: collected.users };
}

export async function removeRemoteStoreAdmin(id: string, cookieToken?: string) {
  const collected = await collectStoreAdmins(cookieToken);
  const users = collected.users.filter((item) => item.id !== id);
  if (users.length === collected.users.length) {
    return { ok: false as const, error: "Usuário não encontrado." };
  }
  memoryStore().splice(0, memoryStore().length, ...users);

  const client = supabaseAdmin();
  if (client) await client.from("store_admins").delete().eq("id", id);

  return { ok: true as const, users };
}

export async function authenticateStoreAdmin(
  email: string,
  password: string,
  cookieToken?: string,
): Promise<StoreAdminSession | null> {
  const normalized = email.trim().toLowerCase();
  const pass = password.trim();

  const seed = SEED_ADMINS.find((item) => item.email === normalized && item.password === pass);
  if (seed) {
    return { email: seed.email, role: "admin", storeId: seed.store_id };
  }

  const { users } = await collectStoreAdmins(cookieToken);
  for (const user of users) {
    if (user.email !== normalized) continue;
    if (await passwordsMatch(pass, user.password_digest)) {
      return { email: user.email, role: "admin", storeId: user.store_id };
    }
  }

  return null;
}

export function toPublicStoreUser(user: StoredStoreAdmin) {
  return {
    id: user.id,
    user_id: user.id,
    store_id: user.store_id,
    role: "admin" as const,
    email: user.email,
  };
}
