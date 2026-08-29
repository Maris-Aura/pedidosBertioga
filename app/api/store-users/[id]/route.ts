import { NextRequest, NextResponse } from "next/server";
import { STORE_ADMINS_COOKIE } from "@/lib/auth/cookies";
import { masterCookieName, verifyMasterSession } from "@/lib/auth/master";
import {
  removeRemoteStoreAdmin,
  serializeStoreAdminsCookie,
  storeAdminsCookieOptions,
  toPublicStoreUser,
  updateRemoteStoreAdmin,
} from "@/lib/store-admins";

async function requireMaster(request: NextRequest) {
  return verifyMasterSession(request.cookies.get(masterCookieName())?.value);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await requireMaster(request))) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { email?: string; password?: string };
  if (body.password && body.password.trim().length < 6) {
    return NextResponse.json(
      { error: "A senha precisa ter pelo menos 6 caracteres." },
      { status: 400 },
    );
  }

  const result = await updateRemoteStoreAdmin(
    id,
    body,
    request.cookies.get(STORE_ADMINS_COOKIE)?.value,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  const response = NextResponse.json({
    ok: true,
    users: result.users.map(toPublicStoreUser),
  });
  response.cookies.set(
    STORE_ADMINS_COOKIE,
    await serializeStoreAdminsCookie(result.users),
    storeAdminsCookieOptions(request.nextUrl.host),
  );
  return response;
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await requireMaster(request))) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await removeRemoteStoreAdmin(
    id,
    request.cookies.get(STORE_ADMINS_COOKIE)?.value,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  const response = NextResponse.json({
    ok: true,
    users: result.users.map(toPublicStoreUser),
  });
  response.cookies.set(
    STORE_ADMINS_COOKIE,
    await serializeStoreAdminsCookie(result.users),
    storeAdminsCookieOptions(request.nextUrl.host),
  );
  return response;
}
