"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { displayToKg } from "@/lib/units";
import type { MeasurementType } from "@/lib/supabase/types";

export type BodyFormState = { error: string | null };

export async function logBodyweightAction(
  _prev: BodyFormState,
  formData: FormData
): Promise<BodyFormState> {
  const value = Number(formData.get("weight"));
  const unit = String(formData.get("unit") ?? "kg") as "kg" | "lb";
  const recordedAt = String(formData.get("recordedAt") ?? "") || undefined;

  if (!Number.isFinite(value) || value <= 0) {
    return { error: "Enter a valid weight." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("body_metrics").insert({
    user_id: user.id,
    weight_kg: displayToKg(value, unit),
    recorded_at: recordedAt,
  });

  if (error) return { error: error.message };

  revalidatePath("/body");
  return { error: null };
}

export async function deleteBodyweightAction(id: string) {
  const supabase = await createClient();
  await supabase.from("body_metrics").delete().eq("id", id);
  revalidatePath("/body");
}

export async function addMeasurementAction(
  _prev: BodyFormState,
  formData: FormData
): Promise<BodyFormState> {
  const measurementType = String(
    formData.get("measurementType") ?? ""
  ) as MeasurementType;
  const valueCm = Number(formData.get("valueCm"));
  const recordedAt = String(formData.get("recordedAt") ?? "") || undefined;

  if (!measurementType) return { error: "Pick a measurement." };
  if (!Number.isFinite(valueCm) || valueCm <= 0) {
    return { error: "Enter a valid measurement." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("body_measurements").insert({
    user_id: user.id,
    measurement_type: measurementType,
    value_cm: valueCm,
    recorded_at: recordedAt,
  });

  if (error) return { error: error.message };

  revalidatePath("/body");
  return { error: null };
}

export async function deleteMeasurementAction(id: string) {
  const supabase = await createClient();
  await supabase.from("body_measurements").delete().eq("id", id);
  revalidatePath("/body");
}

export async function uploadProgressPhotoAction(
  _prev: BodyFormState,
  formData: FormData
): Promise<BodyFormState> {
  const file = formData.get("photo") as File | null;
  const takenAt = String(formData.get("takenAt") ?? "") || undefined;
  const notes = String(formData.get("notes") ?? "").trim();

  if (!file || file.size === 0) return { error: "Pick a photo." };
  if (!file.type.startsWith("image/")) {
    return { error: "File must be an image." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${user.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("progress-photos")
    .upload(path, file, { contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const { error } = await supabase.from("progress_photos").insert({
    user_id: user.id,
    storage_path: path,
    taken_at: takenAt,
    notes: notes || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/body");
  return { error: null };
}

export async function deleteProgressPhotoAction(
  id: string,
  storagePath: string
) {
  const supabase = await createClient();
  await supabase.storage.from("progress-photos").remove([storagePath]);
  await supabase.from("progress_photos").delete().eq("id", id);
  revalidatePath("/body");
}
