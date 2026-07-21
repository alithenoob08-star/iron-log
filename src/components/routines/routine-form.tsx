"use client";

import { useActionState } from "react";
import type { RoutineFormState } from "@/app/(app)/routines/actions";

const initialState: RoutineFormState = { error: null };

export function RoutineForm({
  action,
  submitLabel,
  defaultValues,
  showVisibility,
}: {
  action: (
    state: RoutineFormState,
    formData: FormData
  ) => Promise<RoutineFormState>;
  submitLabel: string;
  defaultValues?: {
    name: string;
    description: string | null;
    visibility?: "private" | "shared";
  };
  showVisibility?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label
          htmlFor="name"
          className="mb-2 block text-xs uppercase tracking-widest text-fg-muted"
        >
          Routine Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultValues?.name}
          placeholder="Push Pull Legs"
          className="w-full rounded-lg border border-border bg-surface-2 px-4 py-3 text-fg focus:border-accent focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-2 block text-xs uppercase tracking-widest text-fg-muted"
        >
          Description (optional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={defaultValues?.description ?? ""}
          className="w-full resize-none rounded-lg border border-border bg-surface-2 px-4 py-3 text-fg focus:border-accent focus:outline-none"
        />
      </div>

      {showVisibility && (
        <div>
          <label
            htmlFor="visibility"
            className="mb-2 block text-xs uppercase tracking-widest text-fg-muted"
          >
            Visibility
          </label>
          <select
            id="visibility"
            name="visibility"
            defaultValue={defaultValues?.visibility ?? "private"}
            className="w-full rounded-lg border border-border bg-surface-2 px-4 py-3 text-fg focus:border-accent focus:outline-none"
          >
            <option value="private">Private — only me</option>
            <option value="shared">Shared — whole group</option>
          </select>
        </div>
      )}

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
