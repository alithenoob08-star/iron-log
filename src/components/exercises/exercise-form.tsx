"use client";

import { useActionState } from "react";
import { MUSCLE_GROUPS } from "@/lib/constants";
import type { MuscleGroup } from "@/lib/supabase/types";
import type { ExerciseFormState } from "@/app/(app)/exercises/actions";

const initialState: ExerciseFormState = { error: null };

export function ExerciseForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (
    state: ExerciseFormState,
    formData: FormData
  ) => Promise<ExerciseFormState>;
  defaultValues?: {
    name: string;
    muscleGroup: MuscleGroup;
    overloadNote: string;
    videoUrl: string | null;
  };
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-xs uppercase tracking-widest text-fg-muted"
        >
          Exercise Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultValues?.name}
          placeholder="Barbell Bench Press"
          className="w-full rounded-lg border border-border bg-surface-2 px-4 py-3 text-fg focus:border-accent focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="muscleGroup"
          className="mb-2 block text-xs uppercase tracking-widest text-fg-muted"
        >
          Muscle Group
        </label>
        <select
          id="muscleGroup"
          name="muscleGroup"
          required
          defaultValue={defaultValues?.muscleGroup ?? ""}
          className="w-full rounded-lg border border-border bg-surface-2 px-4 py-3 text-fg focus:border-accent focus:outline-none"
        >
          <option value="" disabled>
            Select a muscle group
          </option>
          {MUSCLE_GROUPS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="overloadNote"
          className="mb-2 block text-xs uppercase tracking-widest text-fg-muted"
        >
          How To Know To Increase Weight
        </label>
        <textarea
          id="overloadNote"
          name="overloadNote"
          rows={3}
          defaultValue={defaultValues?.overloadNote}
          placeholder="e.g. Once you hit 3x10 with clean form, add 5 lbs."
          className="w-full resize-none rounded-lg border border-border bg-surface-2 px-4 py-3 text-fg focus:border-accent focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="videoUrl"
          className="mb-2 block text-xs uppercase tracking-widest text-fg-muted"
        >
          Form Video URL (optional)
        </label>
        <input
          id="videoUrl"
          name="videoUrl"
          type="url"
          defaultValue={defaultValues?.videoUrl ?? ""}
          placeholder="https://..."
          className="w-full rounded-lg border border-border bg-surface-2 px-4 py-3 text-fg focus:border-accent focus:outline-none"
        />
      </div>

      {state.error && (
        <p className="text-sm text-accent" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-accent py-3 font-display text-lg uppercase tracking-wide text-accent-fg transition hover:brightness-110 disabled:opacity-60"
      >
        {isPending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
