import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function RoutineDetailPage({
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

  const { data: days } = await supabase
    .from("routine_days")
    .select("id, name, day_order")
    .eq("routine_id", id)
    .order("day_order");

  const dayExercises = await Promise.all(
    (days ?? []).map(async (day) => {
      const { data } = await supabase
        .from("routine_exercises")
        .select(
          "id, target_sets, target_reps, target_weight, notes, exercises(name, muscle_group)"
        )
        .eq("routine_day_id", day.id)
        .order("exercise_order");
      return { day, exercises: data ?? [] };
    })
  );

  const isOwner = routine.owner_id === user?.id;

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl">{routine.name}</h1>
          {routine.description && (
            <p className="text-sm text-fg-muted">{routine.description}</p>
          )}
        </div>
        {isOwner && (
          <Link
            href={`/routines/${routine.id}/edit`}
            className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-fg-muted hover:border-accent hover:text-fg"
          >
            <Pencil size={14} /> Edit
          </Link>
        )}
      </div>

      {dayExercises.length === 0 && (
        <p className="text-sm text-fg-muted">
          No days added yet.
          {isOwner && " Head to Edit to build this routine out."}
        </p>
      )}

      {dayExercises.map(({ day, exercises }) => (
        <section
          key={day.id}
          className="rounded-xl border border-border bg-surface p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg">{day.name}</h2>
            <Link
              href={`/log?routineId=${routine.id}&dayId=${day.id}`}
              className="flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-accent-fg hover:brightness-110"
            >
              <Play size={12} /> Start
            </Link>
          </div>

          {exercises.length === 0 ? (
            <p className="text-sm text-fg-muted">
              No exercises added to this day yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {exercises.map((re) => (
                <li
                  key={re.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{re.exercises?.name}</span>
                  <span className="tabular text-fg-muted">
                    {re.target_sets ?? "-"} x {re.target_reps ?? "-"}
                    {re.target_weight ? ` @ ${re.target_weight}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </main>
  );
}
