import { ExerciseForm } from "@/components/exercises/exercise-form";
import { createExerciseAction } from "../actions";

export default function NewExercisePage() {
  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6">
      <h1 className="font-display text-2xl">Add Exercise</h1>
      <ExerciseForm action={createExerciseAction} submitLabel="Add Exercise" />
    </main>
  );
}
