import { NextResponse } from "next/server";
import { masterCookieName } from "@/lib/auth/master";
import { STORE_SESSION_COOKIE } from "@/lib/auth/cookies";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  const clear = { httpOnly: true, path: "/", maxAge: 0 };
  response.cookies.set(masterCookieName(), "", clear);
  response.cookies.set(STORE_SESSION_COOKIE, "", clear);
  return response;
}
