import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ProgressOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: prs } = await supabase
    .from("v_exercise_prs")
    .select("exercise_id, max_weight, best_est_1rm")
    .eq("user_id", user.id);

  const exerciseIds = (prs ?? []).map((p) => p.exercise_id);

  const { data: exercises } =
    exerciseIds.length > 0
      ? await supabase
          .from("exercises")
          .select("id, name, muscle_group")
          .in("id", exerciseIds)
      : { data: [] };

  const nameById = new Map((exercises ?? []).map((e) => [e.id, e]));
  const rows = (prs ?? [])
    .map((p) => ({ ...p, exercise: nameById.get(p.exercise_id) }))
    .filter((r) => r.exercise)
    .sort((a, b) => a.exercise!.name.localeCompare(b.exercise!.name));

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6">
      <h1 className="font-display text-2xl">Progress</h1>

      {rows.length === 0 ? (
        <p className="text-sm text-fg-muted">
          Log a few sets and your progress will show up here.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {rows.map((r) => (
            <li key={r.exercise_id}>
              <Link
                href={`/progress/${r.exercise_id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-surface-2"
              >
                <span>{r.exercise!.name}</span>
                <span className="tabular text-sm text-fg-muted">
                  PR: {r.max_weight}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
