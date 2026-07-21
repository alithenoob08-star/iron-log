import { notFound, redirect } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RoutineForm } from "@/components/routines/routine-form";
import { AddDayForm } from "@/components/routines/add-day-form";
import { AddExerciseToDayForm } from "@/components/routines/add-exercise-to-day-form";
import {
  updateRoutineAction,
  deleteRoutineAction,
  deleteRoutineDayAction,
  deleteRoutineExerciseAction,
} from "../../actions";

export default async function EditRoutinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: routine } = await supabase
    .from("routines")
    .select("id, name, description, is_preset, visibility, owner_id")
    .eq("id", id)
    .maybeSingle();

  if (!routine) notFound();
  if (routine.owner_id !== user?.id) redirect(`/routines/${id}`);

  const { data: days } = await supabase
    .from("routine_days")
    .select("id, name, day_order")
    .eq("routine_id", id)
    .order("day_order");

  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, name")
    .order("name");

  const dayExercises = await Promise.all(
    (days ?? []).map(async (day) => {
      const { data } = await supabase
        .from("routine_exercises")
        .select(
          "id, target_sets, target_reps, target_weight, notes, exercises(name)"
        )
        .eq("routine_day_id", day.id)
        .order("exercise_order");
      return { day, exercises: data ?? [] };
    })
  );

  const updateAction = updateRoutineAction.bind(null, routine.id);
  const deleteAction = deleteRoutineAction.bind(null, routine.id);

  return (
    <main className="flex flex-1 flex-col gap-8 px-4 py-6">
      <div>
        <h1 className="font-display mb-4 text-2xl">Edit Routine</h1>
        <RoutineForm
          action={updateAction}
          submitLabel="Save Details"
          defaultValues={{
            name: routine.name,
            description: routine.description,
            visibility: routine.visibility,
          }}
          showVisibility
        />
        {!routine.is_preset && (
          <form action={deleteAction} className="mt-4">
            <button
              type="submit"
              className="text-sm text-fg-muted hover:text-accent"
            >
              Delete this routine
            </button>
          </form>
        )}
      </div>

      <div>
        <h2 className="font-display mb-3 text-lg">Days</h2>
        <div className="space-y-4">
          {dayExercises.map(({ day, exercises: dayEx }) => {
            const deleteDayAction = deleteRoutineDayAction.bind(
              null,
              day.id,
              routine.id
            );
            return (
              <div
                key={day.id}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-base">{day.name}</h3>
                  <form action={deleteDayAction}>
                    <button
                      type="submit"
                      aria-label="Delete day"
                      className="text-fg-muted hover:text-accent"
                    >
                      <Trash2 size={16} />
                    </button>
                  </form>
                </div>

                {dayEx.length > 0 && (
                  <ul className="mb-3 space-y-2">
                    {dayEx.map((re) => {
                      const deleteExAction = deleteRoutineExerciseAction.bind(
                        null,
                        re.id,
                        routine.id
                      );
                      return (
                        <li
                          key={re.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span>{re.exercises?.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="tabular text-fg-muted">
                              {re.target_sets ?? "-"} x {re.target_reps ?? "-"}
                              {re.target_weight ? ` @ ${re.target_weight}` : ""}
                            </span>
                            <form action={deleteExAction}>
                              <button
                                type="submit"
                                aria-label="Remove exercise"
                                className="text-fg-muted hover:text-accent"
                              >
                                <Trash2 size={14} />
                              </button>
                            </form>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                <AddExerciseToDayForm
                  dayId={day.id}
                  routineId={routine.id}
                  exercises={exercises ?? []}
                />
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <AddDayForm routineId={routine.id} />
        </div>
      </div>
    </main>
  );
}
