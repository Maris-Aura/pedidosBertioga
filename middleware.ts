import { NextResponse, type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { masterCookieName, verifyMasterSession } from "@/lib/auth/master";

function isProtectedAdmin(pathname: string) {
  return /^\/[^/]+\/admin(?:\/.*)?$/.test(pathname) && !pathname.includes("/admin/login");
}

function isProtectedMaster(pathname: string) {
  return pathname.startsWith("/master") && pathname !== "/master/login";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = await updateSupabaseSession(request);

  if (!isProtectedAdmin(pathname) && !isProtectedMaster(pathname)) {
    return response;
  }

  if (isSupabaseConfigured()) {
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

  const raw = request.cookies.get("pb_session")?.value;
  let session: { role?: string; storeId?: string | null } | null = null;
  if (raw) {
    try {
      session = JSON.parse(decodeURIComponent(raw));
    } catch {
      session = null;
    }
  }

  if (isProtectedAdmin(pathname)) {
    const storeSlug = pathname.split("/")[1];
    if (masterSession) return response;
    if (session?.role !== "admin") {
      return NextResponse.redirect(new URL(`/${storeSlug}/admin/login`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
