import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export async function getActiveSession(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  const { data } = await supabase
    .from("workout_sessions")
    .select("id, started_at, routine_days(name)")
    .eq("user_id", userId)
    .is("completed_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}
