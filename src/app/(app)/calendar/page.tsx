import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  parse,
  startOfMonth,
} from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { NavLink } from "@/components/ui/nav-link";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const monthDate = month ? parse(month, "yyyy-MM", new Date()) : new Date();
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const prevMonth = format(addMonths(monthStart, -1), "yyyy-MM");
  const nextMonth = format(addMonths(monthStart, 1), "yyyy-MM");

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, started_at, completed_at, routine_days(name)")
    .eq("user_id", user.id)
    .gte("started_at", monthStart.toISOString())
    .lte("started_at", monthEnd.toISOString())
    .order("started_at");

  const sessionIds = (sessions ?? []).map((s) => s.id);
  const { data: sets } =
    sessionIds.length > 0
      ? await supabase
          .from("set_logs")
          .select("session_id, exercise_id, weight, reps")
          .in("session_id", sessionIds)
      : { data: [] };

  const statsBySession = new Map<
    string,
    { exerciseCount: number; volume: number }
  >();
  for (const s of sets ?? []) {
    const stat = statsBySession.get(s.session_id) ?? {
      exerciseCount: 0,
      volume: 0,
    };
    stat.volume += s.weight * s.reps;
    statsBySession.set(s.session_id, stat);
  }
  for (const [sessionId, stat] of statsBySession) {
    stat.exerciseCount = new Set(
      (sets ?? [])
        .filter((s) => s.session_id === sessionId)
        .map((s) => s.exercise_id)
    ).size;
  }

  // Drop sessions that were started (e.g. a double tap on Start, or a slow
  // response) but never actually got a set logged and were never finished —
  // these are dead rows, not real history.
  const visibleSessions = (sessions ?? []).filter(
    (s) => s.completed_at || (statsBySession.get(s.id)?.exerciseCount ?? 0) > 0
  );

  const sessionsByDate = new Map<string, typeof visibleSessions>();
  for (const s of visibleSessions) {
    // Bucket by local calendar date (matches how the grid cells and the
    // list below both render dates) rather than the raw UTC date prefix,
    // which can land on the wrong day near midnight.
    const key = format(new Date(s.started_at), "yyyy-MM-dd");
    const list = sessionsByDate.get(key) ?? [];
    list.push(s);
    sessionsByDate.set(key, list);
  }

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const leadingBlanks = getDay(monthStart);

  const [{ data: dayStreakRows }, { data: weekStreakRows }] =
    await Promise.all([
      supabase.rpc("get_streak", { target_user: user.id }),
      supabase.rpc("get_weekly_streak", { target_user: user.id }),
    ]);
  const dayStreak = dayStreakRows?.[0];
  const weekStreak = weekStreakRows?.[0];

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">History</h1>
        <a
          href="/export/csv"
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-fg-muted hover:border-accent hover:text-fg"
        >
          Export CSV
        </a>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StreakStat
          label="Day Streak"
          current={dayStreak?.current_streak ?? 0}
          longest={dayStreak?.longest_streak ?? 0}
        />
        <StreakStat
          label="Week Streak"
          current={weekStreak?.current_streak ?? 0}
          longest={weekStreak?.longest_streak ?? 0}
        />
      </div>

      <div className="flex items-center justify-between">
        <NavLink
          href={`/calendar?month=${prevMonth}`}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-fg-muted hover:border-accent hover:text-fg"
        >
          &larr;
        </NavLink>
        <h2 className="font-display text-xl">{format(monthDate, "MMMM yyyy")}</h2>
        <NavLink
          href={`/calendar?month=${nextMonth}`}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-fg-muted hover:border-accent hover:text-fg"
        >
          &rarr;
        </NavLink>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs uppercase tracking-wide text-fg-muted">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayLabel = format(day, "d");
          const daySessions = sessionsByDate.get(key);
          const primary = daySessions?.[0];

          if (!primary) {
            return (
              <div
                key={key}
                className="tabular flex aspect-square items-center justify-center rounded-lg border border-border text-sm text-fg-muted"
              >
                {dayLabel}
              </div>
            );
          }

          const label = primary.routine_days?.name ?? "Workout";

          return (
            <NavLink
              key={key}
              href={`/log/${primary.id}`}
              className="tabular flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border border-accent bg-accent/15 p-0.5 text-sm text-accent"
            >
              <span>{dayLabel}</span>
              <span className="w-full truncate px-0.5 text-center text-[8px] uppercase leading-none tracking-wide">
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-widest text-fg-muted">
          Workouts This Month
        </h2>
        {visibleSessions.length === 0 ? (
          <p className="text-sm text-fg-muted">No workouts logged this month.</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
            {visibleSessions.map((s) => {
              const stat = statsBySession.get(s.id) ?? {
                exerciseCount: 0,
                volume: 0,
              };
              return (
                <li key={s.id}>
                  <NavLink
                    href={`/log/${s.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-surface-2"
                  >
                    <div>
                      <p className="flex items-center gap-2">
                        {s.routine_days?.name ?? "Freeform Workout"}
                        {!s.completed_at && (
                          <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-accent">
                            In progress
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-fg-muted">
                        {format(new Date(s.started_at), "EEE, MMM d")}
                      </p>
                    </div>
                    <div className="tabular text-right text-sm text-fg-muted">
                      <p>{stat.exerciseCount} exercises</p>
                      <p>{stat.volume} vol.</p>
                    </div>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

function StreakStat({
  label,
  current,
  longest,
}: {
  label: string;
  current: number;
  longest: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 text-center">
      <p className="tabular font-display text-3xl text-accent">{current}</p>
      <p className="text-[11px] uppercase tracking-wide text-fg-muted">
        {label}
      </p>
      <p className="tabular mt-1 text-xs text-fg-muted">Best: {longest}</p>
    </div>
  );
}
