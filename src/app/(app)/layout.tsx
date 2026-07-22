import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "../(auth)/actions";
import { BottomNav } from "@/components/nav/bottom-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The proxy only redirects on a *confirmed* logged-out state (see
  // src/lib/supabase/proxy.ts) so a transient edge-runtime hiccup there
  // doesn't bounce active users out at random. This is the real
  // enforcement point, running in the regular Node runtime.
  if (!user) redirect("/login?src=applayout");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <Link href="/" className="font-display text-lg text-accent">
          Iron Log
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-fg-muted">
            {profile?.display_name}
          </span>
          <Link
            href="/settings"
            aria-label="Settings"
            className="text-fg-muted hover:text-accent"
          >
            <Settings size={18} />
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              aria-label="Log out"
              className="text-fg-muted hover:text-accent"
            >
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
      <BottomNav />
    </div>
  );
}
