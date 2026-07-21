-- Gym Tracker: initial schema
-- Auth model: Supabase Auth handles PIN hashing internally. Users sign in with a
-- synthetic email (slug@gym.local) + their 4-digit PIN as the password. The
-- "profiles" table is the public-facing user record keyed to auth.users.id.

create extension if not exists pgcrypto;

-- =========================================================================
-- PROFILES
-- =========================================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  username_slug text not null unique,
  unit_preference text not null default 'kg' check (unit_preference in ('kg', 'lb')),
  leaderboard_opt_in boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index profiles_display_name_lower_idx on public.profiles (lower(display_name));

alter table public.profiles enable row level security;

-- Any signed-in group member can see everyone's profile (small trusted group;
-- needed for leaderboard, shared routines, etc). No PIN/email is ever exposed here.
create policy "profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Public (pre-login) lookup so the login form can turn "display name typed"
-- into "synthetic email to authenticate with". Exposes nothing sensitive.
-- Deliberately security_invoker = false (the default): anon has no SELECT
-- policy on profiles, so this view must run with the owner's privileges to
-- peek through RLS for just these three harmless columns.
create view public.profile_lookup as
  select id, display_name, username_slug from public.profiles;

grant select on public.profile_lookup to anon, authenticated;

-- Auto-create a profile row when a new auth user signs up. display_name and
-- username_slug are passed in via supabase.auth.signUp({ options: { data } }).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, username_slug)
  values (
    new.id,
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'username_slug'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================================
-- EXERCISE LIBRARY (shared across the whole group)
-- =========================================================================

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_group text not null check (
    muscle_group in ('chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full_body', 'cardio', 'other')
  ),
  overload_note text not null default '',
  video_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.exercises enable row level security;

create policy "exercises are readable by authenticated users"
  on public.exercises for select
  to authenticated
  using (true);

-- Shared library: any signed-in group member can add/edit entries.
create policy "authenticated users can add exercises"
  on public.exercises for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "authenticated users can update exercises"
  on public.exercises for update
  to authenticated
  using (true)
  with check (true);

-- =========================================================================
-- ROUTINES
-- =========================================================================

create table public.routines (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  is_preset boolean not null default false,
  visibility text not null default 'private' check (visibility in ('private', 'shared')),
  -- for unclaimed presets: the display name whose signup should claim ownership
  claim_display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Presets are shared and start unowned; claimed automatically when a user
-- with a matching display_name signs up (see claim_preset_routines below).
alter table public.routines
  add constraint preset_requires_claim_name
  check (not is_preset or claim_display_name is not null);

create table public.routine_days (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  day_order int not null,
  name text not null,
  created_at timestamptz not null default now(),
  unique (routine_id, day_order)
);

create table public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_day_id uuid not null references public.routine_days(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  exercise_order int not null,
  target_sets int,
  target_reps text,
  target_weight numeric,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.routines enable row level security;
alter table public.routine_days enable row level security;
alter table public.routine_exercises enable row level security;

create policy "view shared or own routines"
  on public.routines for select
  to authenticated
  using (visibility = 'shared' or owner_id = auth.uid());

create policy "create own routines"
  on public.routines for insert
  to authenticated
  with check (owner_id = auth.uid() and is_preset = false);

create policy "update own routines"
  on public.routines for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "delete own non-preset routines"
  on public.routines for delete
  to authenticated
  using (owner_id = auth.uid() and is_preset = false);

create policy "view days of visible routines"
  on public.routine_days for select
  to authenticated
  using (
    exists (
      select 1 from public.routines r
      where r.id = routine_id and (r.visibility = 'shared' or r.owner_id = auth.uid())
    )
  );

create policy "manage days of own routines"
  on public.routine_days for all
  to authenticated
  using (exists (select 1 from public.routines r where r.id = routine_id and r.owner_id = auth.uid()))
  with check (exists (select 1 from public.routines r where r.id = routine_id and r.owner_id = auth.uid()));

create policy "view exercises of visible routine days"
  on public.routine_exercises for select
  to authenticated
  using (
    exists (
      select 1 from public.routine_days d
      join public.routines r on r.id = d.routine_id
      where d.id = routine_day_id and (r.visibility = 'shared' or r.owner_id = auth.uid())
    )
  );

create policy "manage exercises of own routine days"
  on public.routine_exercises for all
  to authenticated
  using (
    exists (
      select 1 from public.routine_days d
      join public.routines r on r.id = d.routine_id
      where d.id = routine_day_id and r.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.routine_days d
      join public.routines r on r.id = d.routine_id
      where d.id = routine_day_id and r.owner_id = auth.uid()
    )
  );

-- Claim unowned preset routines whose claim_display_name matches the new user.
create function public.claim_preset_routines()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.routines
  set owner_id = new.id, updated_at = now()
  where owner_id is null
    and is_preset = true
    and lower(claim_display_name) = lower(new.display_name);
  return new;
end;
$$;

create trigger on_profile_created_claim_routines
  after insert on public.profiles
  for each row execute procedure public.claim_preset_routines();

-- =========================================================================
-- WORKOUT SESSIONS + SET LOGS
-- =========================================================================

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  routine_id uuid references public.routines(id) on delete set null,
  routine_day_id uuid references public.routine_days(id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table public.set_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  set_order int not null,
  reps int not null,
  weight numeric not null,
  is_warmup boolean not null default false,
  completed_at timestamptz not null default now()
);

alter table public.workout_sessions enable row level security;
alter table public.set_logs enable row level security;

create policy "users manage their own workout sessions"
  on public.workout_sessions for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users manage their own set logs"
  on public.set_logs for all
  to authenticated
  using (exists (select 1 from public.workout_sessions s where s.id = session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.workout_sessions s where s.id = session_id and s.user_id = auth.uid()));

-- =========================================================================
-- BODY METRICS
-- =========================================================================

create table public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  recorded_at date not null default current_date,
  weight_kg numeric not null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  recorded_at date not null default current_date,
  measurement_type text not null check (
    measurement_type in ('waist', 'chest', 'hips', 'arm_left', 'arm_right', 'thigh_left', 'thigh_right', 'shoulders', 'neck', 'calf_left', 'calf_right')
  ),
  value_cm numeric not null,
  created_at timestamptz not null default now()
);

create table public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  taken_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.body_metrics enable row level security;
alter table public.body_measurements enable row level security;
alter table public.progress_photos enable row level security;

create policy "users manage their own body metrics"
  on public.body_metrics for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users manage their own body measurements"
  on public.body_measurements for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users manage their own progress photos"
  on public.progress_photos for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =========================================================================
-- STREAKS + PRs + LEADERBOARD (computed views, no stale caches)
-- =========================================================================

-- One row per user per calendar day they logged >=1 completed set.
create view public.v_workout_days with (security_invoker = true) as
  select distinct s.user_id, (sl.completed_at at time zone 'utc')::date as workout_date
  from public.workout_sessions s
  join public.set_logs sl on sl.session_id = s.id;

-- Current + longest streak per user (consecutive calendar days).
create function public.get_streak(target_user uuid)
returns table (current_streak int, longest_streak int, last_workout_date date)
language sql
stable
security invoker
as $$
  with days as (
    select workout_date
    from public.v_workout_days
    where user_id = target_user
    order by workout_date
  ),
  islands as (
    select
      workout_date,
      workout_date - (row_number() over (order by workout_date))::int as island_key
    from days
  ),
  streaks as (
    select min(workout_date) as start_date, max(workout_date) as end_date, count(*) as length
    from islands
    group by island_key
  )
  select
    coalesce((select length from streaks where end_date = (select max(workout_date) from days)
              and end_date >= current_date - 1), 0) as current_streak,
    coalesce((select max(length) from streaks), 0) as longest_streak,
    (select max(workout_date) from days) as last_workout_date;
$$;

-- Per-exercise personal records for a user: heaviest weight, best estimated 1RM
-- (Epley formula), and largest single-session volume.
create view public.v_exercise_prs with (security_invoker = true) as
  with sets as (
    select
      s.user_id,
      sl.exercise_id,
      sl.weight,
      sl.reps,
      sl.weight * (1 + sl.reps / 30.0) as est_1rm,
      sl.session_id,
      sl.completed_at
    from public.set_logs sl
    join public.workout_sessions s on s.id = sl.session_id
    where sl.is_warmup = false
  ),
  session_volume as (
    select user_id, exercise_id, session_id, sum(weight * reps) as volume, max(completed_at) as completed_at
    from sets
    group by user_id, exercise_id, session_id
  )
  select
    sets.user_id,
    sets.exercise_id,
    max(sets.weight) as max_weight,
    max(sets.est_1rm) as best_est_1rm,
    (select sv.volume from session_volume sv
      where sv.user_id = sets.user_id and sv.exercise_id = sets.exercise_id
      order by sv.volume desc limit 1) as max_session_volume
  from sets
  group by sets.user_id, sets.exercise_id;

-- Opt-in leaderboard: current streak + trailing-7-day volume for users who opted in.
-- Deliberately security_invoker = false (the default): it must read every
-- opted-in user's workout_sessions/set_logs to compute their stats, which
-- their own RLS would otherwise block for anyone but the querying user.
-- Exposure is instead gated by the view's own "leaderboard_opt_in = true"
-- filter, and only aggregate numbers are exposed, never raw set data.
create view public.v_leaderboard as
  select
    p.id as user_id,
    p.display_name,
    streak.current_streak,
    streak.longest_streak,
    coalesce(vol.weekly_volume, 0) as weekly_volume
  from public.profiles p
  cross join lateral public.get_streak(p.id) as streak
  left join lateral (
    select sum(sl.weight * sl.reps) as weekly_volume
    from public.set_logs sl
    join public.workout_sessions s on s.id = sl.session_id
    where s.user_id = p.id and sl.completed_at >= now() - interval '7 days'
  ) vol on true
  where p.leaderboard_opt_in = true;

grant select on public.v_leaderboard to authenticated;
grant select on public.v_exercise_prs to authenticated;
grant select on public.v_workout_days to authenticated;
grant execute on function public.get_streak(uuid) to authenticated;
