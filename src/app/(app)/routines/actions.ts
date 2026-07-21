"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type RoutineFormState = { error: string | null };

export async function createRoutineAction(
  _prev: RoutineFormState,
  formData: FormData
): Promise<RoutineFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (name.length < 2) {
    return { error: "Name must be at least 2 characters." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: routine, error } = await supabase
    .from("routines")
    .insert({ owner_id: user.id, name, description: description || null })
    .select("id")
    .single();

  if (error || !routine) return { error: error?.message ?? "Failed to create routine." };

  revalidatePath("/routines");
  redirect(`/routines/${routine.id}/edit`);
}

export async function updateRoutineAction(
  routineId: string,
  _prev: RoutineFormState,
  formData: FormData
): Promise<RoutineFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const visibility = String(formData.get("visibility") ?? "private") as
    | "private"
    | "shared";

  if (name.length < 2) {
    return { error: "Name must be at least 2 characters." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("routines")
    .update({ name, description: description || null, visibility })
    .eq("id", routineId);

  if (error) return { error: error.message };

  revalidatePath("/routines");
  revalidatePath(`/routines/${routineId}`);
  revalidatePath(`/routines/${routineId}/edit`);
  return { error: null };
}

export async function deleteRoutineAction(routineId: string) {
  const supabase = await createClient();
  await supabase.from("routines").delete().eq("id", routineId);
  revalidatePath("/routines");
  redirect("/routines");
}

export async function addRoutineDayAction(
  routineId: string,
  _prev: RoutineFormState,
  formData: FormData
): Promise<RoutineFormState> {
  const name = String(formData.get("dayName") ?? "").trim();
  if (name.length < 1) return { error: "Day name is required." };

  const supabase = await createClient();
  const { data: existingDays } = await supabase
    .from("routine_days")
    .select("day_order")
    .eq("routine_id", routineId)
    .order("day_order", { ascending: false })
    .limit(1);

  const nextOrder = (existingDays?.[0]?.day_order ?? 0) + 1;

  const { error } = await supabase
    .from("routine_days")
    .insert({ routine_id: routineId, name, day_order: nextOrder });

  if (error) return { error: error.message };

  revalidatePath(`/routines/${routineId}/edit`);
  return { error: null };
}

export async function deleteRoutineDayAction(
  dayId: string,
  routineId: string
) {
  const supabase = await createClient();
  await supabase.from("routine_days").delete().eq("id", dayId);
  revalidatePath(`/routines/${routineId}/edit`);
}

export async function addRoutineExerciseAction(
  dayId: string,
  routineId: string,
  _prev: RoutineFormState,
  formData: FormData
): Promise<RoutineFormState> {
  const exerciseId = String(formData.get("exerciseId") ?? "");
  const targetSets = formData.get("targetSets");
  const targetReps = String(formData.get("targetReps") ?? "").trim();
  const targetWeight = formData.get("targetWeight");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!exerciseId) return { error: "Pick an exercise." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("routine_exercises")
    .select("exercise_order")
    .eq("routine_day_id", dayId)
    .order("exercise_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.exercise_order ?? 0) + 1;

  const { error } = await supabase.from("routine_exercises").insert({
    routine_day_id: dayId,
    exercise_id: exerciseId,
    exercise_order: nextOrder,
    target_sets: targetSets ? Number(targetSets) : null,
    target_reps: targetReps || null,
    target_weight: targetWeight ? Number(targetWeight) : null,
    notes: notes || null,
  });

  if (error) return { error: error.message };

  revalidatePath(`/routines/${routineId}/edit`);
  return { error: null };
}

export async function deleteRoutineExerciseAction(
  routineExerciseId: string,
  routineId: string
) {
  const supabase = await createClient();
  await supabase.from("routine_exercises").delete().eq("id", routineExerciseId);
  revalidatePath(`/routines/${routineId}/edit`);
}
