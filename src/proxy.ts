import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Server-to-server integration routes authenticate themselves (a static
// shared secret checked inside the route, e.g. api/lifeos-sync/route.ts)
// rather than a logged-in user's browser session - there is no session to
// check for a call that never came from a browser. This is the ONLY
// exemption from session-gating; every other route (including every other
// /api/* route, like export/csv, which genuinely does need a signed-in
// user) still goes through updateSession() below unchanged.
const SELF_AUTHENTICATING_PATHS = ["/api/lifeos-sync"];

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (SELF_AUTHENTICATING_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|serwist/|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
