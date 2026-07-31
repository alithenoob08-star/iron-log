"use client";

import { useActionState, useOptimistic, useRef } from "react";
import type { CoachFormState } from "@/app/(app)/coach/actions";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

const initialState: CoachFormState = { error: null };

export function CoachChat({
  action,
  initialMessages,
}: {
  action: (
    state: CoachFormState,
    formData: FormData
  ) => Promise<CoachFormState>;
  initialMessages: Message[];
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    initialMessages,
    (current: Message[], newMessage: Message) => [...current, newMessage]
  );
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    const text = String(formData.get("message") ?? "").trim();
    if (!text) return;
    addOptimisticMessage({
      id: `optimistic-${Date.now()}`,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    });
    formRef.current?.reset();
    await formAction(formData);
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex flex-1 flex-col gap-3">
        {optimisticMessages.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-fg-muted">
            Tell me your training goal, or ask me to look at your training —
            e.g. &quot;I want to build strength&quot; or &quot;what should I
            add to my routine?&quot;
          </p>
        )}
        {optimisticMessages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
              m.role === "user"
                ? "self-end bg-accent text-accent-fg"
                : "self-start bg-surface text-fg"
            }`}
          >
            <p className="whitespace-pre-wrap">{m.content}</p>
          </div>
        ))}
        {isPending && (
          <div className="self-start rounded-xl bg-surface px-4 py-3 text-sm text-fg-muted">
            Thinking&hellip;
          </div>
        )}
      </div>

      {state.error && (
        <p className="text-sm text-accent" role="alert">
          {state.error}
        </p>
      )}

      <form ref={formRef} action={handleSubmit} className="flex items-end gap-2">
        <textarea
          name="message"
          rows={1}
          placeholder="Ask your coach..."
          required
          className="flex-1 resize-none rounded-lg border border-border bg-surface-2 px-4 py-3 text-fg focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-accent px-4 py-3 font-display uppercase tracking-wide text-accent-fg transition hover:brightness-110 disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}
