"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MuscleGroup } from "@/lib/supabase/types";

export type ExerciseFormState = { error: string | null };

type ParsedExercise =
  | { ok: false; error: string }
  | {
      ok: true;
      name: string;
      muscleGroup: MuscleGroup;
      overloadNote: string;
      videoUrl: string | null;
    };

function parseExerciseForm(formData: FormData): ParsedExercise {
  const name = String(formData.get("name") ?? "").trim();
  const muscleGroup = String(formData.get("muscleGroup") ?? "") as MuscleGroup;
  const overloadNote = String(formData.get("overloadNote") ?? "").trim();
  const videoUrl = String(formData.get("videoUrl") ?? "").trim();

  if (name.length < 2) {
    return { ok: false, error: "Name must be at least 2 characters." };
  }

  return {
    ok: true,
    name,
    muscleGroup,
    overloadNote,
    videoUrl: videoUrl || null,
  };
}

export async function createExerciseAction(
  _prev: ExerciseFormState,
  formData: FormData
): Promise<ExerciseFormState> {
  const parsed = parseExerciseForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("exercises").insert({
    name: parsed.name,
    muscle_group: parsed.muscleGroup,
    overload_note: parsed.overloadNote,
    video_url: parsed.videoUrl,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/exercises");
  redirect("/exercises");
}

export async function updateExerciseAction(
  exerciseId: string,
  _prev: ExerciseFormState,
  formData: FormData
): Promise<ExerciseFormState> {
  const parsed = parseExerciseForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();

  const { error } = await supabase
    .from("exercises")
    .update({
      name: parsed.name,
      muscle_group: parsed.muscleGroup,
      overload_note: parsed.overloadNote,
      video_url: parsed.videoUrl,
    })
    .eq("id", exerciseId);

  if (error) return { error: error.message };

  revalidatePath("/exercises");
  redirect("/exercises/" + exerciseId);
}
