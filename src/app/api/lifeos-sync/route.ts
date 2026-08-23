import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// Read-only integration endpoint for LifeOS (a separate personal
// dashboard, alithenoob08-star/ali-dashboard) to pull one specific
// member's own completed workouts - never the whole group's data, never
// anything but what's needed to update a weekly gym count.
//
// Auth: a static shared-secret bearer token (LIFEOS_SYNC_SECRET, a
// server-only env var set in this project's Vercel dashboard - never
// committed, never sent to any browser). This is a server-to-server call
// from LifeOS's own backend, never from a LifeOS browser tab, so there is
// no user session/cookie to check here - the secret IS the
// authentication. The service-role client bypasses RLS deliberately (the
// whole point is reading one member's data on another system's behalf),
// which is exactly why this must stay a server-only route with a
// server-only secret, never a client-callable one.
//
// ?user=<display_name> selects whose workouts to return (default "Ali").
// Only ever returns COMPLETED sessions (completed_at is not null) - an
// abandoned/in-progress session was never a real workout. Deliberately
// does not backfill full history: LifeOS's own manually-logged fitness
// entries have no way to be safely matched against Iron Log's records
// (no shared id), so importing all-time history risks double-counting a
// session the member already logged by hand before this integration
// existed. ?since=<ISO date> lets the caller bound the window; LifeOS
// itself decides how far back is safe to ask for.
export async function GET(req: NextRequest) {
  const secret = process.env.LIFEOS_SYNC_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "sync is not configured" }, { status: 500 });
  }
  const auth = req.headers.get("authorization") || "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const displayName = (searchParams.get("user") || "Ali").trim();
  const since = searchParams.get("since"); // ISO date string, optional

  const supabase = createServiceClient();

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, display_name")
    .ilike("display_name", displayName)
    .maybeSingle();

  if (profileErr) {
    return NextResponse.json({ error: "lookup failed" }, { status: 500 });
  }
  if (!profile) {
    return NextResponse.json({ error: "unknown user" }, { status: 404 });
  }

  let query = supabase
    .from("workout_sessions")
    .select("id, started_at, completed_at, notes, routine_day_id, routine_days(name)")
    .eq("user_id", profile.id)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(200);

  if (since) query = query.gte("completed_at", since);

  const { data: sessions, error: sessionsErr } = await query;
  if (sessionsErr) {
    return NextResponse.json({ error: "query failed" }, { status: 500 });
  }

  const sessionIds = (sessions ?? []).map((s) => s.id);
  const { data: sets } =
    sessionIds.length > 0
      ? await supabase
          .from("set_logs")
          .select("session_id, exercise_id, is_warmup")
          .in("session_id", sessionIds)
      : { data: [] as { session_id: string; exercise_id: string; is_warmup: boolean }[] };

  const statsBySession = new Map<string, { setCount: number; exerciseIds: Set<string> }>();
  (sets ?? []).forEach((s) => {
    const stat = statsBySession.get(s.session_id) || { setCount: 0, exerciseIds: new Set<string>() };
    stat.setCount += 1;
    stat.exerciseIds.add(s.exercise_id);
    statsBySession.set(s.session_id, stat);
  });

  const workouts = (sessions ?? []).map((s) => {
    const stat = statsBySession.get(s.id);
    const startedAt = s.started_at as string;
    const completedAt = s.completed_at as string;
    const durationMin = Math.max(
      0,
      Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 60000)
    );
    const routineDay = s.routine_days as unknown as { name: string } | null;
    return {
      ironLogWorkoutId: s.id,
      startedAt,
      completedAt,
      durationMin,
      exerciseCount: stat ? stat.exerciseIds.size : 0,
      setCount: stat ? stat.setCount : 0,
      name: routineDay?.name || "Freeform Workout",
      type: "gym" as const,
    };
  });

  return NextResponse.json({ ok: true, user: profile.display_name, workouts });
}
