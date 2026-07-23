import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { MUSCLE_GROUPS } from "@/lib/constants";
import type { MuscleGroup } from "@/lib/supabase/types";
import { NavLink } from "@/components/ui/nav-link";

export default async function ExercisesPage() {
  const supabase = await createClient();
  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, name, muscle_group, video_url")
    .order("name");

  const grouped = new Map<MuscleGroup, typeof exercises>();
  for (const group of MUSCLE_GROUPS) grouped.set(group.value, []);
  for (const exercise of exercises ?? []) {
    grouped.get(exercise.muscle_group)?.push(exercise);
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl">Exercise Library</h1>
        <NavLink
          href="/exercises/new"
          className="flex items-center gap-1 rounded-lg bg-accent px-3 py-2 text-sm font-bold uppercase tracking-wide text-accent-fg hover:brightness-110"
        >
          <Plus size={16} /> Add
        </NavLink>
      </div>

      {(exercises?.length ?? 0) === 0 && (
        <p className="text-sm text-fg-muted">
          No exercises yet. Add the first one for the group.
        </p>
      )}

      {MUSCLE_GROUPS.map((group) => {
        const items = grouped.get(group.value) ?? [];
        if (items.length === 0) return null;
        return (
          <section key={group.value}>
            <h2 className="mb-2 text-xs uppercase tracking-widest text-fg-muted">
              {group.label}
            </h2>
            <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
              {items.map((ex) => (
                <li key={ex.id}>
                  <NavLink
                    href={`/exercises/${ex.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-surface-2"
                  >
                    <span>{ex.name}</span>
                    {!ex.video_url && (
                      <span className="text-xs text-fg-muted">
                        No video yet
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
