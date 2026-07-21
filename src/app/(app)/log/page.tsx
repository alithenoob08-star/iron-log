import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { startWorkoutAction } from "./actions";

export default async function StartLogPage({
  searchParams,
}: {
  searchParams: Promise<{ routineId?: string; dayId?: string }>;
}) {
  const { routineId, dayId } = await searchParams;
  const supabase = await createClient();

  let dayName: string | null = null;
  let routineName: string | null = null;
  let plannedCount = 0;

  if (routineId && dayId) {
    const [{ data: routine }, { data: day }, { count }] = await Promise.all([
      supabase.from("routines").select("name").eq("id", routineId).maybeSingle(),
      supabase.from("routine_days").select("name").eq("id", dayId).maybeSingle(),
      supabase
        .from("routine_exercises")
        .select("id", { count: "exact", head: true })
        .eq("routine_day_id", dayId),
    ]);
    routineName = routine?.name ?? null;
    dayName = day?.name ?? null;
    plannedCount = count ?? 0;
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6">
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
          className="rounded-xl bg-accent px-6 py-5 text-center font-display text-xl font-bold uppercase tracking-wide text-accent-fg transition hover:brightness-110"
        >
          {dayName ? `Start ${dayName}` : "Start Freeform Workout"}
        </button>
      </form>

      {!routineId && (
        <Link
          href="/routines"
          className="text-center text-sm text-fg-muted hover:text-accent"
        >
          Or follow a routine instead
        </Link>
      )}
    </main>
  );
}
