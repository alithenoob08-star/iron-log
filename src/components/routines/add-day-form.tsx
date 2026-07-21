"use client";

import { useActionState } from "react";
import { addRoutineDayAction, type RoutineFormState } from "@/app/(app)/routines/actions";

const initialState: RoutineFormState = { error: null };

export function AddDayForm({ routineId }: { routineId: string }) {
  const action = addRoutineDayAction.bind(null, routineId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex gap-2">
      <input
        name="dayName"
        type="text"
        required
        placeholder="Day name, e.g. Chest Day"
        className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-bold uppercase tracking-wide text-accent-fg hover:brightness-110 disabled:opacity-60"
      >
        Add Day
      </button>
      {state.error && (
        <span className="self-center text-sm text-accent">{state.error}</span>
      )}
    </form>
  );
}
