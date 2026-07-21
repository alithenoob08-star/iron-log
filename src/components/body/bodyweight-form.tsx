"use client";

import { useActionState } from "react";
import { logBodyweightAction, type BodyFormState } from "@/app/(app)/body/actions";

const initialState: BodyFormState = { error: null };

export function BodyweightForm({ unit }: { unit: "kg" | "lb" }) {
  const [state, formAction, isPending] = useActionState(
    logBodyweightAction,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="unit" value={unit} />
      <div>
        <label className="mb-1 block text-xs uppercase tracking-widest text-fg-muted">
          Weight ({unit})
        </label>
        <input
          name="weight"
          type="number"
          step="0.1"
          min={0}
          required
          className="tabular w-28 rounded-lg border border-border bg-surface-2 px-3 py-2 text-fg focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs uppercase tracking-widest text-fg-muted">
          Date
        </label>
        <input
          name="recordedAt"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="tabular rounded-lg border border-border bg-surface-2 px-3 py-2 text-fg focus:border-accent focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-bold uppercase tracking-wide text-accent-fg hover:brightness-110 disabled:opacity-60"
      >
        Log Weight
      </button>
      {state.error && <p className="w-full text-sm text-accent">{state.error}</p>}
    </form>
  );
}
