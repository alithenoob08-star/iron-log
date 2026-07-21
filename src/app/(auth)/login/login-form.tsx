"use client";

import { useActionState } from "react";
import { loginAction, type AuthFormState } from "../actions";
import { PinInput } from "@/components/auth/pin-input";

const initialState: AuthFormState = { error: null };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label
          htmlFor="displayName"
          className="mb-2 block text-xs uppercase tracking-widest text-fg-muted"
        >
          Name
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="username"
          required
          className="w-full rounded-lg border border-border bg-surface-2 px-4 py-3 text-fg focus:border-accent focus:outline-none"
          placeholder="Lewis"
        />
      </div>

      <PinInput name="pin" label="4-Digit PIN" autoFocus={false} />

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
        {isPending ? "Logging In..." : "Log In"}
      </button>
    </form>
  );
}
