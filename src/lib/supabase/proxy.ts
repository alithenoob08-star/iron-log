import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Auth pages: redirect away from these if already logged in.
const AUTH_PATHS = ["/login", "/signup"];
// Always accessible, logged in or not (e.g. the offline fallback the
// service worker serves when navigation fails with no network).
const PUBLIC_PATHS = [...AUTH_PATHS, "/offline"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // The proxy runs in a constrained edge runtime where the auth check to
  // Supabase can transiently fail (network hiccup, cold start) even for a
  // genuinely logged-in user. Treating that as "logged out" was bouncing
  // people out of active flows at random. So: only act on a *definitive*
  // answer from Supabase here; on error, just pass the request through and
  // let the real enforcement happen server-side in (app)/layout.tsx, which
  // runs in the regular Node runtime and isn't subject to this flakiness.
  let user = null;
  let checkFailed = false;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    checkFailed = true;
  }

  if (checkFailed) {
    response.headers.set("x-debug-proxy", "error-passthrough");
    return response;
  }

  const pathname = request.nextUrl.pathname;
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("src", "proxy");
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirectResponse.cookies.set(c));
    return redirectResponse;
  }

  if (user && isAuthPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  response.headers.set("x-debug-proxy", user ? "pass-user" : "pass-public");
  return response;
}
