import { NextResponse } from "next/server";
import {
  isMasterCredentialConfigured,
  masterCookieName,
  masterCookieOptions,
  masterCredentials,
  signMasterSession,
} from "@/lib/auth/master";

export async function POST(request: Request) {
  if (!isMasterCredentialConfigured()) {
    return NextResponse.json(
      {
        error:
          "Credenciais master não configuradas. No Vercel, abra o projeto → Settings → Environment Variables e cadastre MASTER_EMAIL, MASTER_PASSWORD e AUTH_SECRET. Depois faça um Redeploy.",
      },
      { status: 500 },
    );
  }

  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const expected = masterCredentials();

  if (email !== expected.email || password !== expected.password) {
    return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
  }

  const token = await signMasterSession({ role: "master", email });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(masterCookieName(), token, masterCookieOptions());
  return response;
}
