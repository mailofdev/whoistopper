import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const guarded = ["/dashboard", "/admin", "/account"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsSession = guarded.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (!needsSession) return NextResponse.next();
  const cookies = request.cookies.getAll();
  const hasSession = cookies.some((cookie) => cookie.name === "wit_session" || cookie.name.includes("auth-token"));
  if (hasSession) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/account/:path*"],
};
