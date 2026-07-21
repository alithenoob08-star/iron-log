"use client";

import { useActionState, useRef } from "react";
import {
  uploadProgressPhotoAction,
  type BodyFormState,
} from "@/app/(app)/body/actions";

const initialState: BodyFormState = { error: null };

export function PhotoUploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    async (prev: BodyFormState, formData: FormData) => {
      const result = await uploadProgressPhotoAction(prev, formData);
      if (!result.error) formRef.current?.reset();
      return result;
    },
    initialState
  );

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <input
        name="photo"
        type="file"
        accept="image/*"
        required
        className="block w-full text-sm text-fg-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:text-fg"
      />
      <div className="flex flex-wrap items-end gap-2">
        <input
          name="takenAt"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="tabular rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
        />
        <input
          name="notes"
          type="text"
          placeholder="Notes (optional)"
          className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-bold uppercase tracking-wide text-accent-fg hover:brightness-110 disabled:opacity-60"
        >
          {isPending ? "Uploading..." : "Upload"}
        </button>
      </div>
      {state.error && <p className="text-sm text-accent">{state.error}</p>}
    </form>
  );
}
