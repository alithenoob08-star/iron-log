-- v_leaderboard was created security_invoker=true, so it could only ever
-- compute the querying user's own streak/volume: RLS on workout_sessions
-- and set_logs blocks reads of other users' rows even when they've opted
-- into the leaderboard. Switch to the default (security_invoker = false)
-- so the view can read across users; exposure stays gated by the view's
-- own "leaderboard_opt_in = true" filter and its aggregate-only columns.
alter view public.v_leaderboard set (security_invoker = false);
