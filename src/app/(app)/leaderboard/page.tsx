import Link from "next/link";
import { Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("leaderboard_opt_in")
    .eq("id", user.id)
    .single();

  const { data: rows } = await supabase
    .from("v_leaderboard")
    .select("user_id, display_name, current_streak, weekly_volume")
    .order("current_streak", { ascending: false });

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6">
      <h1 className="font-display text-2xl">Leaderboard</h1>

      {!profile?.leaderboard_opt_in && (
        <p className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-fg-muted">
          You&apos;re not on the board yet.{" "}
          <Link href="/settings" className="text-accent hover:underline">
            Opt in from Settings
          </Link>{" "}
          to share your streak and weekly volume.
        </p>
      )}

      {(rows?.length ?? 0) === 0 ? (
        <p className="text-sm text-fg-muted">No one has opted in yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {(rows ?? []).map((r, i) => (
            <li
              key={r.user_id}
              className={`flex items-center justify-between px-4 py-3 ${
                r.user_id === user.id ? "bg-surface-2" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="tabular w-5 text-fg-muted">{i + 1}</span>
                <span>{r.display_name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="tabular flex items-center gap-1 text-sm text-accent">
                  <Flame size={14} />
                  {r.current_streak}
                </span>
                <span className="tabular text-sm text-fg-muted">
                  {r.weekly_volume} vol/wk
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
