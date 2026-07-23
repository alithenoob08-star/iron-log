-- Volume (weight x reps) is being dropped as a tracked metric app-wide in
-- favor of simpler ones (max weight, workout counts, reps). Replace the
-- leaderboard's weekly_volume with a plain weekly workout count, and drop
-- the now-unused max_session_volume column from v_exercise_prs.

-- CREATE OR REPLACE VIEW can only append new trailing columns — it can
-- neither rename nor drop an existing one, so both views below need a
-- real drop + create instead.
drop view public.v_leaderboard;

create view public.v_leaderboard with (security_invoker = false) as
  select
    p.id as user_id,
    p.display_name,
    streak.current_streak,
    streak.longest_streak,
    coalesce(wk.weekly_workouts, 0) as weekly_workouts
  from public.profiles p
  cross join lateral public.get_streak(p.id) as streak
  left join lateral (
    select count(distinct s.id) as weekly_workouts
    from public.workout_sessions s
    where s.user_id = p.id
      and s.completed_at is not null
      and s.completed_at >= now() - interval '7 days'
  ) wk on true
  where p.leaderboard_opt_in = true;

drop view public.v_exercise_prs;

create view public.v_exercise_prs with (security_invoker = true) as
  with sets as (
    select
      s.user_id,
      sl.exercise_id,
      sl.weight,
      sl.reps,
      sl.weight * (1 + sl.reps / 30.0) as est_1rm
    from public.set_logs sl
    join public.workout_sessions s on s.id = sl.session_id
    where sl.is_warmup = false
  )
  select
    user_id,
    exercise_id,
    max(weight) as max_weight,
    max(est_1rm) as best_est_1rm
  from sets
  group by user_id, exercise_id;

grant select on public.v_leaderboard to authenticated;
grant select on public.v_exercise_prs to authenticated;
