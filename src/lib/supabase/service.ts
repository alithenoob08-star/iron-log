import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// Service-role client - bypasses RLS entirely, so this must NEVER be
// imported into anything that runs in the browser (no "use client" file,
// no client component). It exists for exactly one thing: the LifeOS sync
// route, which needs to read one specific member's completed workouts on
// LifeOS's behalf, not as that member's own authenticated session (there
// is no browser session when LifeOS calls this server-to-server).
// SUPABASE_SERVICE_ROLE_KEY is a server-only env var (Vercel dashboard),
// never NEXT_PUBLIC_-prefixed, never committed, never exposed to a client
// bundle.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase service client is not configured");
  }
  return createSupabaseClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
