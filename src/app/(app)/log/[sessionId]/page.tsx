import { notFound, redirect } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RestTimer } from "@/components/log/rest-timer";
import { AddSetForm } from "@/components/log/add-set-form";
import { finishWorkoutAction, deleteSetLogAction } from "../actions";

export default async function ActiveSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: session } = await supabase
    .from("workout_sessions")
    .select("id, user_id, routine_day_id, started_at, completed_at")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) notFound();
  if (session.user_id !== user?.id) redirect("/log");

  const [{ data: day }, { data: setLogs }, { data: allExercises }] =
    await Promise.all([
      session.routine_day_id
        ? supabase
            .from("routine_days")
            .select("name")
            .eq("id", session.routine_day_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("set_logs")
        .select("id, exercise_id, set_order, reps, weight, is_warmup, completed_at, exercises(name)")
        .eq("session_id", sessionId)
        .order("set_order"),
      supabase.from("exercises").select("id, name").order("name"),
    ]);

  const plannedExercises = session.routine_day_id
    ? (
        await supabase
          .from("routine_exercises")
          .select(
            "id, exercise_id, target_sets, target_reps, target_weight, exercises(name)"
          )
          .eq("routine_day_id", session.routine_day_id)
          .order("exercise_order")
      ).data ?? []
    : [];

  const logsByExercise = new Map<string, typeof setLogs>();
  for (const log of setLogs ?? []) {
    const list = logsByExercise.get(log.exercise_id) ?? [];
    list.push(log);
    logsByExercise.set(log.exercise_id, list);
  }

  const plannedIds = new Set(plannedExercises.map((p) => p.exercise_id));
  const extraExerciseIds = [...logsByExercise.keys()].filter(
    (id) => !plannedIds.has(id)
  );

  const lastSetAt =
    (setLogs ?? []).reduce<string | null>((latest, log) => {
      if (!latest || log.completed_at > latest) return log.completed_at;
      return latest;
    }, null) ?? null;

  const isComplete = !!session.completed_at;
  const finishAction = finishWorkoutAction.bind(null, sessionId);

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">{day?.name ?? "Freeform Workout"}</h1>
        {!isComplete && (
          <form action={finishAction}>
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-bold uppercase tracking-wide text-accent-fg hover:brightness-110"
            >
              Finish
            </button>
          </form>
        )}
      </div>

      {isComplete && (
        <p className="rounded-lg border border-success/40 bg-success/10 px-4 py-2 text-sm text-success">
          Workout complete.
        </p>
      )}

      {!isComplete && <RestTimer lastSetAt={lastSetAt} />}

      {plannedExercises.map((pe) => (
        <ExerciseCard
          key={pe.id}
          exerciseId={pe.exercise_id}
          name={pe.exercises?.name ?? "Exercise"}
          target={
            pe.target_sets || pe.target_reps || pe.target_weight
              ? `${pe.target_sets ?? "-"} x ${pe.target_reps ?? "-"}${
                  pe.target_weight ? ` @ ${pe.target_weight}` : ""
                }`
              : null
          }
          sets={logsByExercise.get(pe.exercise_id) ?? []}
          sessionId={sessionId}
          isComplete={isComplete}
        />
      ))}

      {extraExerciseIds.map((exId) => {
        const sets = logsByExercise.get(exId) ?? [];
        return (
          <ExerciseCard
            key={exId}
            exerciseId={exId}
            name={sets[0]?.exercises?.name ?? "Exercise"}
            target={null}
            sets={sets}
            sessionId={sessionId}
            isComplete={isComplete}
          />
        );
      })}

      {!isComplete && (
        <section className="rounded-xl border border-dashed border-border p-4">
          <h2 className="mb-3 text-xs uppercase tracking-widest text-fg-muted">
            Log A Different Exercise
          </h2>
          <AddSetForm
            sessionId={sessionId}
            exerciseOptions={allExercises ?? []}
          />
        </section>
      )}
    </main>
  );
}

function ExerciseCard({
  exerciseId,
  name,
  target,
  sets,
  sessionId,
  isComplete,
}: {
  exerciseId: string;
  name: string;
  target: string | null;
  sets: {
    id: string;
    set_order: number;
    reps: number;
    weight: number;
    is_warmup: boolean;
  }[];
  sessionId: string;
  isComplete: boolean;
}) {
  const lastSet = sets[sets.length - 1];

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-lg">{name}</h2>
        {target && <span className="tabular text-sm text-fg-muted">{target}</span>}
      </div>

      {sets.length > 0 && (
        <ul className="mb-3 space-y-1">
          {sets.map((s) => {
            const deleteAction = deleteSetLogAction.bind(null, s.id, sessionId);
            return (
              <li
                key={s.id}
                className="tabular flex items-center justify-between text-sm"
              >
                <span className="text-fg-muted">Set {s.set_order}</span>
                <span>
                  {s.weight} x {s.reps}
                  {s.is_warmup && (
                    <span className="ml-2 text-xs text-fg-muted">warmup</span>
                  )}
                </span>
                {!isComplete && (
                  <form action={deleteAction}>
                    <button
                      type="submit"
                      aria-label="Delete set"
                      className="text-fg-muted hover:text-accent"
                    >
                      <Trash2 size={14} />
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!isComplete && (
        <AddSetForm
          sessionId={sessionId}
          exerciseId={exerciseId}
          lastWeight={lastSet?.weight}
          lastReps={lastSet?.reps}
        />
      )}
    </section>
  );
}
