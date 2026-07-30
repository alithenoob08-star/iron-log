import { notFound } from "next/navigation";
import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ExerciseForm } from "@/components/exercises/exercise-form";
import { updateExerciseAction } from "../actions";

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: exercise } = await supabase
    .from("exercises")
    .select("id, name, muscle_group, overload_note, video_url")
    .eq("id", id)
    .maybeSingle();

  if (!exercise) notFound();

  const boundAction = updateExerciseAction.bind(null, exercise.id);

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6">
      <h1 className="font-display text-2xl">{exercise.name}</h1>

      {exercise.video_url && (
        <Link
          href={exercise.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-4 font-display text-xl uppercase tracking-wide text-accent-fg transition hover:brightness-110"
        >
          <PlayCircle size={24} /> Watch Form Video
        </Link>
      )}

      <ExerciseForm
        action={boundAction}
        submitLabel="Save Changes"
        defaultValues={{
          name: exercise.name,
          muscleGroup: exercise.muscle_group,
          overloadNote: exercise.overload_note,
          videoUrl: exercise.video_url,
        }}
      />
    </main>
  );
}
