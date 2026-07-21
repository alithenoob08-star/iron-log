-- Consecutive-week streak, mirroring get_streak's day-based gaps-and-islands
-- approach but bucketed by ISO week start.
create function public.get_weekly_streak(target_user uuid)
returns table (current_streak int, longest_streak int, last_workout_week date)
language sql
stable
security invoker
as $$
  with weeks as (
    select distinct date_trunc('week', workout_date)::date as week_start
    from public.v_workout_days
    where user_id = target_user
  ),
  islands as (
    select
      week_start,
      week_start - ((row_number() over (order by week_start))::int * 7) as island_key
    from weeks
  ),
  streaks as (
    select min(week_start) as start_week, max(week_start) as end_week, count(*) as length
    from islands
    group by island_key
  )
  select
    coalesce((select length from streaks where end_week = (select max(week_start) from weeks)
              and end_week >= date_trunc('week', current_date)::date - 7), 0) as current_streak,
    coalesce((select max(length) from streaks), 0) as longest_streak,
    (select max(week_start) from weeks) as last_workout_week;
$$;

grant execute on function public.get_weekly_streak(uuid) to authenticated;
