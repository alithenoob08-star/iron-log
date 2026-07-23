import { subDays } from "date-fns";
import { Flame, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NavLink } from "@/components/ui/nav-link";
import { getActiveSession } from "@/lib/active-session";

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

  const [
    { data: profile },
    { data: streakRows },
    { data: weekStreakRows },
    activeSession,
    { data: allSessions },
    { data: topPrRows },
  ] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).single(),
    supabase.rpc("get_streak", { target_user: user.id }),
    supabase.rpc("get_weekly_streak", { target_user: user.id }),
    getActiveSession(supabase, user.id),
    supabase
      .from("workout_sessions")
      .select("id, started_at")
      .eq("user_id", user.id)
      .not("completed_at", "is", null)
      .order("started_at"),
    supabase
      .from("v_exercise_prs")
      .select("exercise_id, max_weight, best_est_1rm")
      .eq("user_id", user.id)
      .order("best_est_1rm", { ascending: false })
      .limit(1),
  ]);

  const streak = streakRows?.[0];
  const weekStreak = weekStreakRows?.[0];

  const sessionIds = (allSessions ?? []).map((s) => s.id);
  const { data: allSets } =
    sessionIds.length > 0
      ? await supabase
          .from("set_logs")
          .select("session_id, exercise_id, weight")
          .eq("is_warmup", false)
          .in("session_id", sessionIds)
      : { data: [] };

  const sessionDateById = new Map(
    (allSessions ?? []).map((s) => [s.id, s.started_at])
  );

  // Range-scoped stats (Total Sets / Workouts tabs above).
  const rangeSessionIds = new Set(
    (allSessions ?? [])
      .filter((s) => !rangeStart || new Date(s.started_at) >= rangeStart)
      .map((s) => s.id)
  );
  const workoutCount = rangeSessionIds.size;
  const totalSets = (allSets ?? []).filter((s) =>
    rangeSessionIds.has(s.session_id)
  ).length;

  // Most improved (lifetime, not range-scoped): for each exercise, compare
  // the heaviest weight from the very first session it was logged in
  // against the current all-time max.
  const sortedSets = [...(allSets ?? [])].sort((a, b) => {
    const da = sessionDateById.get(a.session_id) ?? "";
    const db = sessionDateById.get(b.session_id) ?? "";
    return da.localeCompare(db);
  });

  const byExercise = new Map<
    string,
    { firstWeight: number; firstDate: string; maxWeight: number }
  >();
  for (const s of sortedSets) {
    const date = sessionDateById.get(s.session_id);
    if (!date) continue;
    const agg = byExercise.get(s.exercise_id);
    if (!agg) {
      byExercise.set(s.exercise_id, {
        firstWeight: s.weight,
        firstDate: date,
        maxWeight: s.weight,
      });
      continue;
    }
    if (date === agg.firstDate) agg.firstWeight = Math.max(agg.firstWeight, s.weight);
    if (s.weight > agg.maxWeight) agg.maxWeight = s.weight;
  }

  const improvedEntries = [...byExercise.entries()]
    .map(([exerciseId, agg]) => ({
      exerciseId,
      firstWeight: agg.firstWeight,
      maxWeight: agg.maxWeight,
      improvement: agg.maxWeight - agg.firstWeight,
    }))
    .filter((e) => e.improvement > 0)
    .sort((a, b) => b.improvement - a.improvement)
    .slice(0, 5);

  let mostImproved: {
    exerciseId: string;
    name: string;
    firstWeight: number;
    maxWeight: number;
    improvement: number;
  }[] = [];
  if (improvedEntries.length > 0) {
    const { data: exercises } = await supabase
      .from("exercises")
      .select("id, name")
      .in(
        "id",
        improvedEntries.map((e) => e.exerciseId)
      );
    const nameById = new Map((exercises ?? []).map((e) => [e.id, e.name]));
    mostImproved = improvedEntries.map((e) => ({
      ...e,
      name: nameById.get(e.exerciseId) ?? "Exercise",
    }));
  }

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
        <Stat label="Workouts" value={workoutCount} sub={RANGE_LABELS[range]} />
        <Stat label="Total Sets" value={totalSets} sub={RANGE_LABELS[range]} />
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="mb-3 text-xs uppercase tracking-widest text-fg-muted">
          Most Improved
        </p>
        {mostImproved.length === 0 ? (
          <p className="text-sm text-fg-muted">
            Log a few more sessions to see which lifts are moving up.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {mostImproved.map((e) => (
              <li key={e.exerciseId}>
                <NavLink
                  href={`/progress/${e.exerciseId}`}
                  className="flex items-center justify-between py-2 hover:text-accent"
                >
                  <span>{e.name}</span>
                  <span className="tabular flex items-center gap-2 text-sm">
                    <span className="text-fg-muted">
                      {e.firstWeight} &rarr; {e.maxWeight}
                    </span>
                    <span className="font-bold text-success">
                      +{e.improvement}
                    </span>
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        )}
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
