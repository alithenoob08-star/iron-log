"use client";

import { useActionState } from "react";
import {
  updateSettingsAction,
  type SettingsFormState,
} from "@/app/(app)/settings/actions";

const initialState: SettingsFormState = { error: null };

export function SettingsForm({
  unitPreference,
  leaderboardOptIn,
}: {
  unitPreference: "kg" | "lb";
  leaderboardOptIn: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    updateSettingsAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label className="mb-2 block text-xs uppercase tracking-widest text-fg-muted">
          Weight Unit
        </label>
        <select
          name="unitPreference"
          defaultValue={unitPreference}
          className="w-full rounded-lg border border-border bg-surface-2 px-4 py-3 text-fg focus:border-accent focus:outline-none"
        >
          <option value="kg">Kilograms (kg)</option>
          <option value="lb">Pounds (lb)</option>
        </select>
      </div>

      <label className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-4 py-3">
        <span>
          <span className="block">Join the leaderboard</span>
          <span className="block text-sm text-fg-muted">
            Share your streak and weekly workouts with the group
          </span>
        </span>
        <input
          type="checkbox"
          name="leaderboardOptIn"
          defaultChecked={leaderboardOptIn}
          className="h-5 w-5 accent-accent"
        />
      </label>

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
        {isPending ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}
