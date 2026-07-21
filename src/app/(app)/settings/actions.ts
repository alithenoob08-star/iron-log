"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SettingsFormState = { error: string | null };

export async function updateSettingsAction(
  _prev: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const unitPreference = String(formData.get("unitPreference") ?? "kg") as
    | "kg"
    | "lb";
  const leaderboardOptIn = formData.get("leaderboardOptIn") === "on";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({
      unit_preference: unitPreference,
      leaderboard_opt_in: leaderboardOptIn,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/leaderboard");
  revalidatePath("/body");
  return { error: null };
}
