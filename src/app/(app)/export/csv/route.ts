import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function csvEscape(value: string | number | boolean | null): string {
  const str = value === null ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, started_at, routine_days(name)")
    .eq("user_id", user.id)
    .order("started_at");

  const sessionIds = (sessions ?? []).map((s) => s.id);
  const { data: sets } =
    sessionIds.length > 0
      ? await supabase
          .from("set_logs")
          .select(
            "session_id, set_order, reps, weight, is_warmup, completed_at, exercises(name)"
          )
          .in("session_id", sessionIds)
          .order("completed_at")
      : { data: [] };

  const sessionById = new Map((sessions ?? []).map((s) => [s.id, s]));

  const header = [
    "date",
    "workout",
    "exercise",
    "set",
    "weight",
    "reps",
    "warmup",
  ];
  const rows = (sets ?? []).map((s) => {
    const session = sessionById.get(s.session_id);
    return [
      session?.started_at?.slice(0, 10) ?? "",
      session?.routine_days?.name ?? "Freeform Workout",
      s.exercises?.name ?? "",
      s.set_order,
      s.weight,
      s.reps,
      s.is_warmup ? "yes" : "no",
    ];
  });

  const csv = [header, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");

  const filename = `iron-log-export-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
