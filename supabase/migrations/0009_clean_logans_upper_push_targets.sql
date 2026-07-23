-- Upper and Push day target_reps were accidentally seeded with Logan's actual
-- per-set historical performance (e.g. '9,9,10,8') instead of a prescribed
-- target range like the other days use (e.g. '8-10'). Replace them with
-- clean ranges derived from those same numbers.

update public.routine_exercises set target_reps = '8-10'
  where routine_day_id = '22222222-0000-4000-8000-000000000003'
    and exercise_id = '11111111-0000-4000-8000-00000000000b'; -- Upper: Bench Press

update public.routine_exercises set target_reps = '8-10'
  where routine_day_id = '22222222-0000-4000-8000-000000000003'
    and exercise_id = '11111111-0000-4000-8000-00000000000c'; -- Upper: Incline Bench Press

update public.routine_exercises set target_reps = '7-10'
  where routine_day_id = '22222222-0000-4000-8000-000000000005'
    and exercise_id = '11111111-0000-4000-8000-00000000000b'; -- Push: Bench Press

update public.routine_exercises set target_reps = '14-15'
  where routine_day_id = '22222222-0000-4000-8000-000000000005'
    and exercise_id = '11111111-0000-4000-8000-00000000000d'; -- Push: Tricep Pushdown

update public.routine_exercises set target_reps = '8-10'
  where routine_day_id = '22222222-0000-4000-8000-000000000005'
    and exercise_id = '11111111-0000-4000-8000-000000000011'; -- Push: Converging Shoulder Press

update public.routine_exercises set target_reps = '10-11'
  where routine_day_id = '22222222-0000-4000-8000-000000000005'
    and exercise_id = '11111111-0000-4000-8000-000000000012'; -- Push: Dip Chin
