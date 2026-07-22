"use client";

import { useActionState } from "react";
import { addMeasurementAction, type BodyFormState } from "@/app/(app)/body/actions";

const initialState: BodyFormState = { error: null };

const MEASUREMENT_TYPES: { value: string; label: string }[] = [
  { value: "height", label: "Height" },
  { value: "waist", label: "Waist" },
  { value: "chest", label: "Chest" },
  { value: "hips", label: "Hips" },
  { value: "arm_left", label: "Arm (L)" },
  { value: "arm_right", label: "Arm (R)" },
  { value: "thigh_left", label: "Thigh (L)" },
  { value: "thigh_right", label: "Thigh (R)" },
  { value: "shoulders", label: "Shoulders" },
  { value: "neck", label: "Neck" },
  { value: "calf_left", label: "Calf (L)" },
  { value: "calf_right", label: "Calf (R)" },
];

export function MeasurementForm() {
  const [state, formAction, isPending] = useActionState(
    addMeasurementAction,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div>
        <label className="mb-1 block text-xs uppercase tracking-widest text-fg-muted">
          Measurement
        </label>
        <select
          name="measurementType"
          required
          defaultValue=""
          className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
        >
          <option value="" disabled>
            Select
          </option>
          {MEASUREMENT_TYPES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs uppercase tracking-widest text-fg-muted">
          Value (cm)
        </label>
        <input
          name="valueCm"
          type="number"
          step="0.1"
          min={0}
          required
          className="tabular w-24 rounded-lg border border-border bg-surface-2 px-3 py-2 text-fg focus:border-accent focus:outline-none"
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
        Add
      </button>
      {state.error && <p className="w-full text-sm text-accent">{state.error}</p>}
    </form>
  );
}
