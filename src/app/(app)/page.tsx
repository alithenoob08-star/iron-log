import { Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NavLink } from "@/components/ui/nav-link";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user!.id)
    .single();

  const { data: streakRows } = await supabase.rpc("get_streak", {
    target_user: user!.id,
  });
  const streak = streakRows?.[0];

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-fg-muted">
            Welcome back
          </p>
          <h1 className="font-display text-4xl text-accent">
            {profile?.display_name ?? "Lifter"}
          </h1>
        </div>
        {streak && streak.current_streak > 0 && (
          <div className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-accent">
            <Flame size={16} />
            <span className="tabular text-sm font-bold">
              {streak.current_streak}
            </span>
          </div>
        )}
      </div>

      <NavLink
        href="/log"
        className="rounded-xl bg-accent px-6 py-5 text-center font-display text-2xl uppercase tracking-wide text-accent-fg transition hover:brightness-110"
      >
        Start Workout
      </NavLink>

      <div className="grid grid-cols-2 gap-3">
        <NavLink
          href="/routines"
          className="rounded-xl border border-border bg-surface p-4 hover:border-accent"
        >
          <p className="font-display text-lg">Routines</p>
          <p className="text-sm text-fg-muted">Plans &amp; splits</p>
        </NavLink>
        <NavLink
          href="/progress"
          className="rounded-xl border border-border bg-surface p-4 hover:border-accent"
        >
          <p className="font-display text-lg">Progress</p>
          <p className="text-sm text-fg-muted">Charts &amp; PRs</p>
        </NavLink>
        <NavLink
          href="/calendar"
          className="rounded-xl border border-border bg-surface p-4 hover:border-accent"
        >
          <p className="font-display text-lg">History</p>
          <p className="text-sm text-fg-muted">Past workouts</p>
        </NavLink>
        <NavLink
          href="/exercises"
          className="rounded-xl border border-border bg-surface p-4 hover:border-accent"
        >
          <p className="font-display text-lg">Exercises</p>
          <p className="text-sm text-fg-muted">The library</p>
        </NavLink>
        <NavLink
          href="/body"
          className="rounded-xl border border-border bg-surface p-4 hover:border-accent"
        >
          <p className="font-display text-lg">Body</p>
          <p className="text-sm text-fg-muted">Weight, measurements, photos</p>
        </NavLink>
        <NavLink
          href="/leaderboard"
          className="rounded-xl border border-border bg-surface p-4 hover:border-accent"
        >
          <p className="font-display text-lg">Leaderboard</p>
          <p className="text-sm text-fg-muted">Opt-in group stats</p>
        </NavLink>
      </div>
    </main>
  );
}
