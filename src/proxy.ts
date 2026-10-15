import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const guarded = ["/dashboard", "/admin", "/account"];

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    });
    await supabase.auth.getUser();
  }

  const { pathname } = request.nextUrl;
  const needsSession = guarded.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (!needsSession) return supabaseResponse;

  const hasSession = request.cookies.getAll().some((cookie) => cookie.name.includes("auth-token"));
  if (hasSession) return supabaseResponse;

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  const redirect = NextResponse.redirect(url);
  supabaseResponse.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
