"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type LogFormState = { error: string | null };

export async function startWorkoutAction(formData: FormData) {
  const routineId = String(formData.get("routineId") ?? "") || null;
  const routineDayId = String(formData.get("routineDayId") ?? "") || null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Reuse an already-started session for this same day/freeform slot rather
  // than creating a new one every time — otherwise a slow response or a
  // repeat tap on Start leaves orphaned empty sessions behind in History.
  let existingQuery = supabase
    .from("workout_sessions")
    .select("id")
    .eq("user_id", user.id)
    .is("completed_at", null)
    .order("started_at", { ascending: false })
    .limit(1);
  existingQuery = routineDayId
    ? existingQuery.eq("routine_day_id", routineDayId)
    : existingQuery.is("routine_day_id", null);
  const { data: existingSession } = await existingQuery.maybeSingle();

  if (existingSession) {
    redirect(`/log/${existingSession.id}`);
  }

  const { data: session, error } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: user.id,
      routine_id: routineId,
      routine_day_id: routineDayId,
    })
    .select("id")
    .single();

  if (error || !session) {
    redirect("/log");
  }

  redirect(`/log/${session.id}`);
}

export async function addSetLogAction(
  sessionId: string,
  _prev: LogFormState,
  formData: FormData
): Promise<LogFormState> {
  const exerciseId = String(formData.get("exerciseId") ?? "");
  const reps = Number(formData.get("reps"));
  const weight = Number(formData.get("weight"));
  const isWarmup = formData.get("isWarmup") === "on";

  if (!exerciseId) return { error: "Pick an exercise first." };
  if (!Number.isFinite(reps) || reps <= 0) {
    return { error: "Enter a valid rep count." };
  }
  if (!Number.isFinite(weight) || weight < 0) {
    return { error: "Enter a valid weight." };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("set_logs")
    .select("set_order")
    .eq("session_id", sessionId)
    .eq("exercise_id", exerciseId)
    .order("set_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.set_order ?? 0) + 1;

  const { error } = await supabase.from("set_logs").insert({
    session_id: sessionId,
    exercise_id: exerciseId,
    set_order: nextOrder,
    reps,
    weight,
    is_warmup: isWarmup,
  });

  if (error) return { error: error.message };

  revalidatePath(`/log/${sessionId}`);
  return { error: null };
}

export async function deleteSetLogAction(setId: string, sessionId: string) {
  const supabase = await createClient();
  await supabase.from("set_logs").delete().eq("id", setId);
  revalidatePath(`/log/${sessionId}`);
}

export async function finishWorkoutAction(sessionId: string) {
  const supabase = await createClient();
  await supabase
    .from("workout_sessions")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", sessionId);
  revalidatePath(`/log/${sessionId}`);
  revalidatePath("/calendar");
  revalidatePath("/");
}
