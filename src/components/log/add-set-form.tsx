"use client";

import { useActionState } from "react";
import { addSetLogAction, type LogFormState } from "@/app/(app)/log/actions";

const initialState: LogFormState = { error: null };

export function AddSetForm({
  sessionId,
  exerciseId,
  exerciseOptions,
  lastWeight,
  lastReps,
}: {
  sessionId: string;
  exerciseId?: string;
  exerciseOptions?: { id: string; name: string }[];
  lastWeight?: number;
  lastReps?: number;
}) {
  const action = addSetLogAction.bind(null, sessionId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      {exerciseId ? (
        <input type="hidden" name="exerciseId" value={exerciseId} />
      ) : (
        <select
          name="exerciseId"
          required
          defaultValue=""
          className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
        >
          <option value="" disabled>
            Pick an exercise
          </option>
          {(exerciseOptions ?? []).map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
      )}

      <input
        name="weight"
        type="number"
        step="0.5"
        min={0}
        required
        defaultValue={lastWeight}
        placeholder="Weight"
        className="tabular w-24 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
      />
      <input
        name="reps"
        type="number"
        min={1}
        required
        defaultValue={lastReps}
        placeholder="Reps"
        className="tabular w-20 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
      />
      <label className="flex items-center gap-1.5 text-xs text-fg-muted">
        <input type="checkbox" name="isWarmup" className="accent-accent" />
        Warmup
      </label>

      {state.error && <p className="w-full text-sm text-accent">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-bold uppercase tracking-wide text-accent-fg hover:brightness-110 disabled:opacity-60"
      >
        Log Set
      </button>
    </form>
  );
}
