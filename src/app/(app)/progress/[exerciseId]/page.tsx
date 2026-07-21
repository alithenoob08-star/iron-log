import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProgressCharts } from "@/components/progress/progress-charts";

function toDateKey(iso: string) {
  return iso.slice(0, 10);
}

export default async function ExerciseProgressPage({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const { exerciseId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: exercise } = await supabase
    .from("exercises")
    .select("id, name, overload_note")
    .eq("id", exerciseId)
    .maybeSingle();

  if (!exercise) notFound();

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, started_at")
    .eq("user_id", user.id);

  const sessionDateById = new Map(
    (sessions ?? []).map((s) => [s.id, toDateKey(s.started_at)])
  );
  const sessionIds = (sessions ?? []).map((s) => s.id);

  const { data: sets } =
    sessionIds.length > 0
      ? await supabase
          .from("set_logs")
          .select("session_id, weight, reps, is_warmup")
          .eq("exercise_id", exerciseId)
          .eq("is_warmup", false)
          .in("session_id", sessionIds)
      : { data: [] };

  const bySession = new Map<
    string,
    { date: string; topWeight: number; volume: number }
  >();

  for (const s of sets ?? []) {
    const date = sessionDateById.get(s.session_id);
    if (!date) continue;
    const entry = bySession.get(s.session_id) ?? {
      date,
      topWeight: 0,
      volume: 0,
    };
    entry.topWeight = Math.max(entry.topWeight, s.weight);
    entry.volume += s.weight * s.reps;
    bySession.set(s.session_id, entry);
  }

  const chartData = [...bySession.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({ date: e.date, weight: e.topWeight, volume: e.volume }));

  let maxWeight = 0;
  let bestEst1Rm = 0;
  for (const s of sets ?? []) {
    if (s.weight > maxWeight) maxWeight = s.weight;
    const est1Rm = s.weight * (1 + s.reps / 30);
    if (est1Rm > bestEst1Rm) bestEst1Rm = est1Rm;
  }
  const maxSessionVolume = chartData.reduce(
    (max, e) => Math.max(max, e.volume),
    0
  );

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6">
      <div>
        <h1 className="font-display text-2xl">{exercise.name}</h1>
        {exercise.overload_note && (
          <p className="mt-1 text-sm text-fg-muted">{exercise.overload_note}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <PrStat label="Max Weight" value={maxWeight} />
        <PrStat label="Est. 1RM" value={Math.round(bestEst1Rm)} />
        <PrStat label="Best Session Vol." value={maxSessionVolume} />
      </div>

      {chartData.length === 0 ? (
        <p className="text-sm text-fg-muted">
          No logged sets for this exercise yet.
        </p>
      ) : (
        <ProgressCharts data={chartData} />
      )}
    </main>
  );
}

function PrStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3 text-center">
      <p className="tabular font-display text-2xl text-accent">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-fg-muted">
        {label}
      </p>
    </div>
  );
}
