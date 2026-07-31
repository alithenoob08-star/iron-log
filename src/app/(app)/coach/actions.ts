"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { buildTrainingSummary } from "@/lib/coach/summary";
import { askCoach } from "@/lib/coach/gemini";

export type CoachFormState = { error: string | null };

export async function sendCoachMessageAction(
  _prev: CoachFormState,
  formData: FormData
): Promise<CoachFormState> {
  const message = String(formData.get("message") ?? "").trim();
  if (!message) return { error: "Type a message first." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  const { error: insertError } = await supabase.from("coach_messages").insert({
    user_id: user.id,
    role: "user",
    content: message,
  });
  if (insertError) return { error: insertError.message };

  const { data: historyRows } = await supabase
    .from("coach_messages")
    .select("role, content")
    .eq("user_id", user.id)
    .order("created_at");

  const history = (historyRows ?? []).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let reply: string;
  try {
    const summary = await buildTrainingSummary(supabase, user.id);
    reply = await askCoach(summary, history);
  } catch (err) {
    // Logged server-side (visible in Netlify's function logs) since the
    // user-facing message below is deliberately generic — the raw error
    // may include request/response details we don't want to show them.
    console.error("askCoach failed:", err);
    if (err instanceof Error && err.message.includes("GEMINI_API_KEY")) {
      reply =
        "The coach isn't configured yet — ask whoever runs this app to add a Gemini API key.";
    } else if (err instanceof ApiError && err.status >= 500) {
      reply =
        "Gemini is overloaded with requests right now — this isn't an app problem, just try again in a minute.";
    } else {
      reply = "Something went wrong reaching the coach. Try again in a moment.";
    }
  }

  const { error: replyError } = await supabase.from("coach_messages").insert({
    user_id: user.id,
    role: "assistant",
    content: reply,
  });
  if (replyError) return { error: replyError.message };

  revalidatePath("/coach");
  return { error: null };
}
