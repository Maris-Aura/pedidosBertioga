import { NextResponse } from "next/server";
import { masterCookieName } from "@/lib/auth/master";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(masterCookieName(), "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return response;
}
