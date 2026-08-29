const COOKIE_NAME = "pb_master_session";

function bytesToBase64Url(bytes: ArrayBuffer | Uint8Array) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  view.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function utf8ToBase64Url(value: string) {
  return bytesToBase64Url(new TextEncoder().encode(value));
}

function base64UrlToUtf8(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) {
    diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return diff === 0;
}

async function hmacSha256(secret: string, data: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return bytesToBase64Url(signature);
}

function authSecret() {
  return process.env.AUTH_SECRET || process.env.MASTER_PASSWORD || "";
}

export type MasterSession = {
  role: "master";
  email: string;
};

export function masterCredentials() {
  return {
    email: process.env.MASTER_EMAIL?.trim().toLowerCase() ?? "",
    password: process.env.MASTER_PASSWORD ?? "",
  };
}

export function isMasterCredentialConfigured() {
  const { email, password } = masterCredentials();
  return Boolean(email && password && authSecret());
}

export async function signMasterSession(session: MasterSession) {
  const secret = authSecret();
  if (!secret) throw new Error("AUTH_SECRET não configurado.");
  const body = utf8ToBase64Url(JSON.stringify(session));
  const signature = await hmacSha256(secret, body);
  return `${body}.${signature}`;
}

export async function verifyMasterSession(token: string | undefined): Promise<MasterSession | null> {
  if (!token) return null;
  const secret = authSecret();
  if (!secret) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = await hmacSha256(secret, body);
  if (!safeEqual(signature, expected)) return null;
  try {
    const session = JSON.parse(base64UrlToUtf8(body)) as MasterSession;
    if (session.role !== "master" || !session.email) return null;
    return session;
  } catch {
    return null;
  }
}

export function masterCookieName() {
  return COOKIE_NAME;
}

export function masterCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}
