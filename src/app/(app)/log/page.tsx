import { createClient } from "@/lib/supabase/server";
import { getActiveSession } from "@/lib/active-session";
import { NavLink } from "@/components/ui/nav-link";
import { startWorkoutAction } from "./actions";

export default async function StartLogPage({
  searchParams,
}: {
  searchParams: Promise<{ routineId?: string; dayId?: string }>;
}) {
  const { routineId, dayId } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let dayName: string | null = null;
  let routineName: string | null = null;
  let plannedCount = 0;

  const [routineInfo, activeSession] = await Promise.all([
    routineId && dayId
      ? Promise.all([
          supabase.from("routines").select("name").eq("id", routineId).maybeSingle(),
          supabase.from("routine_days").select("name").eq("id", dayId).maybeSingle(),
          supabase
            .from("routine_exercises")
            .select("id", { count: "exact", head: true })
            .eq("routine_day_id", dayId),
        ])
      : null,
    user ? getActiveSession(supabase, user.id) : null,
  ]);

  if (routineInfo) {
    const [{ data: routine }, { data: day }, { count }] = routineInfo;
    routineName = routine?.name ?? null;
    dayName = day?.name ?? null;
    plannedCount = count ?? 0;
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6">
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

      <h1 className="font-display text-2xl">
        {dayName ? dayName : "Start Workout"}
      </h1>

      {routineName && (
        <p className="text-sm text-fg-muted">
          From <span className="text-fg">{routineName}</span> &middot;{" "}
          {plannedCount} planned exercise{plannedCount === 1 ? "" : "s"}
        </p>
      )}

      <form action={startWorkoutAction} className="flex flex-col gap-3">
        {routineId && <input type="hidden" name="routineId" value={routineId} />}
        {dayId && <input type="hidden" name="routineDayId" value={dayId} />}
        <button
          type="submit"
          className="rounded-xl bg-accent px-6 py-5 text-center font-display text-2xl uppercase tracking-wide text-accent-fg transition hover:brightness-110"
        >
          {dayName ? `Start ${dayName}` : "Start Freeform Workout"}
        </button>
      </form>

      {activeSession && (
        <p className="text-center text-xs text-fg-muted">
          Starting a new workout won&apos;t affect your in-progress one — you can
          finish it later from History.
        </p>
      )}

      {!routineId && (
        <NavLink
          href="/routines"
          className="text-center text-sm text-fg-muted hover:text-accent"
        >
          Or follow a routine instead
        </NavLink>
      )}
    </main>
  );
}
