import { NextRequest, NextResponse } from "next/server";
import { STORE_ADMINS_COOKIE, STORE_SESSION_COOKIE } from "@/lib/auth/cookies";
import { authenticateStoreAdmin, storeSessionCookieOptions } from "@/lib/store-admins";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
    storeId?: string;
  };
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password?.trim() ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
  }

  const session = await authenticateStoreAdmin(
    email,
    password,
    request.cookies.get(STORE_ADMINS_COOKIE)?.value,
  );

  if (!session) {
    return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
  }

  if (body.storeId && session.storeId !== body.storeId) {
    return NextResponse.json(
      { error: "Este usuário não pertence a esta loja." },
      { status: 403 },
    );
  }

  const host = request.nextUrl.host;
  const response = NextResponse.json({ ok: true, session });
  response.cookies.set(
    STORE_SESSION_COOKIE,
    JSON.stringify(session),
    storeSessionCookieOptions(host),
  );
  return response;
}
