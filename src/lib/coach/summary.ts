import { subDays } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { MUSCLE_GROUPS } from "@/lib/constants";

export async function buildTrainingSummary(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<string> {
  const thirtyDaysAgo = subDays(new Date(), 30);

  const [
    { data: sessions },
    { data: prRows },
    { data: streakRows },
    { data: weekStreakRows },
  ] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("id, started_at")
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .gte("started_at", thirtyDaysAgo.toISOString()),
    supabase
      .from("v_exercise_prs")
      .select("exercise_id, max_weight, best_est_1rm")
      .eq("user_id", userId),
    supabase.rpc("get_streak", { target_user: userId }),
    supabase.rpc("get_weekly_streak", { target_user: userId }),
  ]);

  const sessionIds = (sessions ?? []).map((s) => s.id);
  const { data: sets } =
    sessionIds.length > 0
      ? await supabase
          .from("set_logs")
          .select("session_id, exercise_id, reps")
          .eq("is_warmup", false)
          .in("session_id", sessionIds)
      : { data: [] };

  const exerciseIds = [
    ...new Set([
      ...(sets ?? []).map((s) => s.exercise_id),
      ...(prRows ?? []).map((p) => p.exercise_id),
    ]),
  ];
  const { data: exercises } =
    exerciseIds.length > 0
      ? await supabase
          .from("exercises")
          .select("id, name, muscle_group")
          .in("id", exerciseIds)
      : { data: [] };
  const exerciseById = new Map((exercises ?? []).map((e) => [e.id, e]));

  const setsByGroup = new Map<string, { sets: number; sessions: Set<string> }>();
  for (const group of MUSCLE_GROUPS) setsByGroup.set(group.value, { sets: 0, sessions: new Set() });

  let repSum = 0;
  let repCount = 0;
  for (const s of sets ?? []) {
    const group = exerciseById.get(s.exercise_id)?.muscle_group ?? "other";
    const stat = setsByGroup.get(group) ?? { sets: 0, sessions: new Set<string>() };
    stat.sets += 1;
    stat.sessions.add(s.session_id);
    setsByGroup.set(group, stat);
    repSum += s.reps;
    repCount += 1;
  }

  const streak = streakRows?.[0];
  const weekStreak = weekStreakRows?.[0];

  const lines: string[] = [];
  lines.push(`Workouts completed in the last 30 days: ${sessions?.length ?? 0}`);
  lines.push(
    `Current day streak: ${streak?.current_streak ?? 0} (best ${streak?.longest_streak ?? 0})`
  );
  lines.push(
    `Current week streak: ${weekStreak?.current_streak ?? 0} (best ${weekStreak?.longest_streak ?? 0})`
  );
  if (repCount > 0) {
    lines.push(
      `Average reps per working set in the last 30 days: ${(repSum / repCount).toFixed(1)}`
    );
  }

  lines.push("");
  lines.push("Sets logged per muscle group in the last 30 days:");
  for (const group of MUSCLE_GROUPS) {
    const stat = setsByGroup.get(group.value)!;
    lines.push(
      `- ${group.label}: ${stat.sets} sets across ${stat.sessions.size} session${stat.sessions.size === 1 ? "" : "s"}`
    );
  }

  lines.push("");
  lines.push("Personal records (all-time):");
  if (!prRows || prRows.length === 0) {
    lines.push("- None logged yet.");
  } else {
    const sortedPrs = [...prRows].sort((a, b) => b.best_est_1rm - a.best_est_1rm);
    for (const pr of sortedPrs) {
      const name = exerciseById.get(pr.exercise_id)?.name ?? "Exercise";
      lines.push(`- ${name}: ${pr.max_weight} max weight, est. 1RM ${Math.round(pr.best_est_1rm)}`);
    }
  }

  return lines.join("\n");
}
