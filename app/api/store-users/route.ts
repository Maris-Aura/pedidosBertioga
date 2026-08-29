import { NextRequest, NextResponse } from "next/server";
import { STORE_ADMINS_COOKIE } from "@/lib/auth/cookies";
import { masterCookieName, verifyMasterSession } from "@/lib/auth/master";
import {
  createRemoteStoreAdmin,
  listStoreAdmins,
  serializeStoreAdminsCookie,
  storeAdminsCookieOptions,
  toPublicStoreUser,
} from "@/lib/store-admins";

async function requireMaster(request: NextRequest) {
  return verifyMasterSession(request.cookies.get(masterCookieName())?.value);
}

function withAdminsCookie(
  response: NextResponse,
  token: string,
  host: string,
) {
  response.cookies.set(STORE_ADMINS_COOKIE, token, storeAdminsCookieOptions(host));
  return response;
}

export async function GET(request: NextRequest) {
  if (!(await requireMaster(request))) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const storeId = request.nextUrl.searchParams.get("storeId") ?? undefined;
  const listed = await listStoreAdmins(
    storeId,
    request.cookies.get(STORE_ADMINS_COOKIE)?.value,
  );

  return NextResponse.json({
    users: listed.users.map(toPublicStoreUser),
    remote: listed.remote,
  });
}

export async function POST(request: NextRequest) {
  if (!(await requireMaster(request))) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = (await request.json()) as {
    storeId?: string;
    email?: string;
    password?: string;
  };

  if (!body.storeId || !body.email?.trim() || !body.password?.trim()) {
    return NextResponse.json({ error: "Preencha e-mail e senha." }, { status: 400 });
  }
  if (body.password.trim().length < 6) {
    return NextResponse.json(
      { error: "A senha precisa ter pelo menos 6 caracteres." },
      { status: 400 },
    );
  }

  const result = await createRemoteStoreAdmin(
    {
      storeId: body.storeId,
      email: body.email,
      password: body.password,
    },
    request.cookies.get(STORE_ADMINS_COOKIE)?.value,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  const response = NextResponse.json({
    ok: true,
    user: toPublicStoreUser(result.user),
    users: result.users.map(toPublicStoreUser),
    remote: result.remote,
    warning: "warning" in result ? result.warning : undefined,
  });
  return withAdminsCookie(
    response,
    await serializeStoreAdminsCookie(result.users),
    request.nextUrl.host,
  );
}
