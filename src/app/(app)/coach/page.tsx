import { createClient } from "@/lib/supabase/server";
import { CoachChat } from "@/components/coach/coach-chat";
import { sendCoachMessageAction } from "./actions";

export default async function CoachPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: messages } = await supabase
    .from("coach_messages")
    .select("id, role, content, created_at")
    .eq("user_id", user.id)
    .order("created_at");

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-6">
      <div>
        <h1 className="font-display text-2xl">Coach</h1>
        <p className="text-sm text-fg-muted">
          Tell it your goals — it looks at your real training data and points
          out what to work on.
        </p>
      </div>
      <CoachChat action={sendCoachMessageAction} initialMessages={messages ?? []} />
    </main>
  );
}
