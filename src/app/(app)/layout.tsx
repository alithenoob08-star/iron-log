import Link from "next/link";
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

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single()
    : { data: null };

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
