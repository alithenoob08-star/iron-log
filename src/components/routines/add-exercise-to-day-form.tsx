"use client";

import { useActionState } from "react";
import {
  addRoutineExerciseAction,
  type RoutineFormState,
} from "@/app/(app)/routines/actions";

const initialState: RoutineFormState = { error: null };

export function AddExerciseToDayForm({
  dayId,
  routineId,
  exercises,
}: {
  dayId: string;
  routineId: string;
  exercises: { id: string; name: string }[];
}) {
  const action = addRoutineExerciseAction.bind(null, dayId, routineId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-2 rounded-lg bg-surface-2 p-3">
      <select
        name="exerciseId"
        required
        defaultValue=""
        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
      >
        <option value="" disabled>
          Pick an exercise
        </option>
        {exercises.map((ex) => (
          <option key={ex.id} value={ex.id}>
            {ex.name}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-3 gap-2">
        <input
          name="targetSets"
          type="number"
          min={1}
          placeholder="Sets"
          className="rounded-lg border border-border bg-bg px-3 py-2 text-sm tabular text-fg focus:border-accent focus:outline-none"
        />
        <input
          name="targetReps"
          type="text"
          placeholder="Reps"
          className="rounded-lg border border-border bg-bg px-3 py-2 text-sm tabular text-fg focus:border-accent focus:outline-none"
        />
        <input
          name="targetWeight"
          type="number"
          step="0.5"
          placeholder="Weight"
          className="rounded-lg border border-border bg-bg px-3 py-2 text-sm tabular text-fg focus:border-accent focus:outline-none"
        />
      </div>
      <input
        name="notes"
        type="text"
        placeholder="Notes (optional)"
        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
      />
      {state.error && <p className="text-sm text-accent">{state.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg border border-border py-2 text-sm uppercase tracking-wide text-fg-muted hover:border-accent hover:text-fg disabled:opacity-60"
      >
        Add Exercise
      </button>
    </form>
  );
}
