import { NextResponse, type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";
import { masterCookieName, verifyMasterSession } from "@/lib/auth/master";
import { STORE_SESSION_COOKIE } from "@/lib/auth/cookies";

function isProtectedAdmin(pathname: string) {
  return /^\/[^/]+\/admin(?:\/.*)?$/.test(pathname) && !pathname.includes("/admin/login");
}

function isProtectedMaster(pathname: string) {
  return pathname.startsWith("/master") && pathname !== "/master/login";
}

function parseStoreSession(raw: string | undefined) {
  if (!raw) return null;
  for (const value of [raw, decodeURIComponent(raw)]) {
    try {
      return JSON.parse(value) as { role?: string; storeId?: string | null };
    } catch {
      continue;
    }
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = await updateSupabaseSession(request);

  if (!isProtectedAdmin(pathname) && !isProtectedMaster(pathname)) {
    return response;
  }

  const masterSession = await verifyMasterSession(
    request.cookies.get(masterCookieName())?.value,
  );

  if (isProtectedMaster(pathname)) {
    if (!masterSession) {
      return NextResponse.redirect(new URL("/master/login", request.url));
    }
    return response;
  }

  if (isProtectedAdmin(pathname)) {
    if (masterSession) return response;
    const session = parseStoreSession(request.cookies.get(STORE_SESSION_COOKIE)?.value);
    if (session?.role !== "admin") {
      const storeSlug = pathname.split("/")[1];
      return NextResponse.redirect(new URL(`/${storeSlug}/admin/login`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
