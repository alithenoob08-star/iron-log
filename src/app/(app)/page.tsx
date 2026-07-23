import { format, subDays } from "date-fns";
import { Flame, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NavLink } from "@/components/ui/nav-link";
import { getActiveSession } from "@/lib/active-session";
import { VolumeSparkline } from "@/components/home/volume-sparkline";

type RangeKey = "week" | "month" | "all";

const RANGE_LABELS: Record<RangeKey, string> = {
  week: "7 Days",
  month: "30 Days",
  all: "All Time",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rangeParam } = await searchParams;
  const range: RangeKey =
    rangeParam === "month" || rangeParam === "all" ? rangeParam : "week";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const rangeStart =
    range === "week"
      ? subDays(new Date(), 7)
      : range === "month"
        ? subDays(new Date(), 30)
        : null;

  let rangeQuery = supabase
    .from("workout_sessions")
    .select("id, started_at")
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .order("started_at");
  if (rangeStart) rangeQuery = rangeQuery.gte("started_at", rangeStart.toISOString());

  const [
    { data: profile },
    { data: streakRows },
    { data: weekStreakRows },
    activeSession,
    { data: rangeSessions },
    { data: topPrRows },
  ] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).single(),
    supabase.rpc("get_streak", { target_user: user.id }),
    supabase.rpc("get_weekly_streak", { target_user: user.id }),
    getActiveSession(supabase, user.id),
    rangeQuery,
    supabase
      .from("v_exercise_prs")
      .select("exercise_id, max_weight, best_est_1rm")
      .eq("user_id", user.id)
      .order("best_est_1rm", { ascending: false })
      .limit(1),
  ]);

  const streak = streakRows?.[0];
  const weekStreak = weekStreakRows?.[0];

  const sessionIds = (rangeSessions ?? []).map((s) => s.id);
  const { data: rangeSets } =
    sessionIds.length > 0
      ? await supabase
          .from("set_logs")
          .select("session_id, weight, reps")
          .in("session_id", sessionIds)
      : { data: [] };

  const volumeBySession = new Map<string, number>();
  for (const s of rangeSets ?? []) {
    volumeBySession.set(
      s.session_id,
      (volumeBySession.get(s.session_id) ?? 0) + s.weight * s.reps
    );
  }

  const sparklineData = (rangeSessions ?? []).map((s) => ({
    date: format(new Date(s.started_at), "MMM d"),
    volume: Math.round(volumeBySession.get(s.id) ?? 0),
  }));

  const workoutCount = rangeSessions?.length ?? 0;
  const totalVolume = sparklineData.reduce((sum, d) => sum + d.volume, 0);
  const totalSets = rangeSets?.length ?? 0;
  const avgVolume = workoutCount > 0 ? Math.round(totalVolume / workoutCount) : 0;

  let topPr: {
    exerciseId: string;
    name: string;
    weight: number;
    est1Rm: number;
  } | null = null;
  const topPrRow = topPrRows?.[0];
  if (topPrRow) {
    const { data: exercise } = await supabase
      .from("exercises")
      .select("name")
      .eq("id", topPrRow.exercise_id)
      .maybeSingle();
    topPr = {
      exerciseId: topPrRow.exercise_id,
      name: exercise?.name ?? "Exercise",
      weight: topPrRow.max_weight,
      est1Rm: Math.round(topPrRow.best_est_1rm),
    };
  }

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

      {activeSession && (
        <NavLink
          href={`/log/${activeSession.id}`}
          className="rounded-xl border-2 border-accent bg-accent/10 px-6 py-5 text-center transition hover:bg-accent/15"
        >
          <p className="text-xs uppercase tracking-widest text-accent">
            Workout in progress
          </p>
          <p className="font-display text-2xl">
            Continue {activeSession.routine_days?.name ?? "Freeform Workout"}
          </p>
        </NavLink>
      )}

      <NavLink
        href="/log"
        className="rounded-xl bg-accent px-6 py-5 text-center font-display text-2xl uppercase tracking-wide text-accent-fg transition hover:brightness-110"
      >
        Start Workout
      </NavLink>

      <div className="flex gap-2">
        {(Object.keys(RANGE_LABELS) as RangeKey[]).map((key) => (
          <NavLink
            key={key}
            href={`/?range=${key}`}
            className={`flex-1 rounded-lg border px-3 py-2 text-center text-xs font-bold uppercase tracking-wide ${
              range === key
                ? "border-accent bg-accent/15 text-accent"
                : "border-border text-fg-muted hover:border-accent hover:text-fg"
            }`}
          >
            {RANGE_LABELS[key]}
          </NavLink>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-xs uppercase tracking-widest text-fg-muted">
          Total Volume
        </p>
        <p className="tabular font-display text-3xl">
          {totalVolume.toLocaleString()}
        </p>
        <p className="mb-3 text-xs text-fg-muted">
          across {workoutCount} workout{workoutCount === 1 ? "" : "s"}
        </p>
        {sparklineData.length > 1 ? (
          <VolumeSparkline data={sparklineData} />
        ) : (
          <p className="text-sm text-fg-muted">
            Log a couple more workouts to see a trend.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="Day Streak"
          value={streak?.current_streak ?? 0}
          sub={`Best: ${streak?.longest_streak ?? 0}`}
        />
        <Stat
          label="Week Streak"
          value={weekStreak?.current_streak ?? 0}
          sub={`Best: ${weekStreak?.longest_streak ?? 0}`}
        />
        <Stat label="Total Sets" value={totalSets} sub={RANGE_LABELS[range]} />
        <Stat
          label="Avg Vol / Workout"
          value={avgVolume}
          sub={RANGE_LABELS[range]}
        />
      </div>

      {topPr && (
        <NavLink
          href={`/progress/${topPr.exerciseId}`}
          className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 hover:border-accent"
        >
          <div className="rounded-full bg-accent/15 p-2 text-accent">
            <Trophy size={20} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-fg-muted">
              Top Lift
            </p>
            <p className="font-display text-xl">{topPr.name}</p>
            <p className="tabular text-sm text-fg-muted">
              {topPr.weight} max &middot; Est. 1RM {topPr.est1Rm}
            </p>
          </div>
        </NavLink>
      )}

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

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 text-center">
      <p className="tabular font-display text-3xl text-accent">
        {value.toLocaleString()}
      </p>
      <p className="text-[11px] uppercase tracking-wide text-fg-muted">
        {label}
      </p>
      <p className="tabular mt-1 text-xs text-fg-muted">{sub}</p>
    </div>
  );
}
