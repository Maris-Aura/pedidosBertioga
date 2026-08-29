function bytesToBase64Url(bytes: ArrayBuffer | Uint8Array) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  view.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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

function secret() {
  return process.env.AUTH_SECRET || process.env.MASTER_PASSWORD || "pedidos-bertioga";
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

export async function digestPassword(password: string) {
  return hmacSha256(secret(), password);
}

export async function passwordsMatch(password: string, digest: string) {
  const next = await digestPassword(password);
  if (next.length !== digest.length) return false;
  let diff = 0;
  for (let i = 0; i < next.length; i += 1) {
    diff |= next.charCodeAt(i) ^ digest.charCodeAt(i);
  }
  return diff === 0;
}

export async function signPayload(data: unknown) {
  const body = utf8ToBase64Url(JSON.stringify(data));
  const signature = await hmacSha256(secret(), body);
  return `${body}.${signature}`;
}

export async function verifyPayload<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = await hmacSha256(secret(), body);
  if (expected.length !== signature.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  if (diff !== 0) return null;
  try {
    return JSON.parse(base64UrlToUtf8(body)) as T;
  } catch {
    return null;
  }
}
