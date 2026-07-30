-- Ali's Plan: a 5-day Push/Pull/Legs/Upper/Lower split, shared with the
-- group, exercise names only (no prescribed sets/reps/weight). Reuses
-- existing exercise library entries where a close match already exists
-- (Reverse Pec Deck -> the existing "Face Pulls / Reverse Pec Deck",
-- SLDL -> the existing "Stiff-Leg Deadlift") rather than creating
-- near-duplicates.

-- New exercises not already in the library.
insert into public.exercises (id, name, muscle_group, overload_note) values
  ('33333333-0000-4000-8000-000000000001', 'Shoulder Press (Machine/Dumbbell)', 'shoulders',
    'Target 6-12 reps. Once you can confidently hit 6+ reps at a heavier weight, move up — or if you exceed 12 reps at your current weight, add weight next session.'),
  ('33333333-0000-4000-8000-000000000002', 'Hip Adductor (Outer Thigh)', 'legs',
    'Target 6-12 reps. Once you can confidently hit 6+ reps at a heavier weight, move up — or if you exceed 12 reps at your current weight, add weight next session.'),
  ('33333333-0000-4000-8000-000000000003', 'Abdominal Crunches', 'core',
    'Target 6-12 reps. Once you can confidently hit 6+ reps at a heavier weight, move up — or if you exceed 12 reps at your current weight, add weight next session.');

-- Apply the same 6-12 rep progression guidance to the existing exercises
-- used in Ali's Plan (all had an empty overload_note before this).
update public.exercises
set overload_note = 'Target 6-12 reps. Once you can confidently hit 6+ reps at a heavier weight, move up — or if you exceed 12 reps at your current weight, add weight next session.'
where id in (
  '11111111-0000-4000-8000-00000000000b', -- Bench Press
  '11111111-0000-4000-8000-00000000000e', -- Lateral Raises
  '3ec49e60-d9c4-476c-99f5-4a1d3c5d819d',  -- JM Press
  '11111111-0000-4000-8000-00000000000c', -- Incline Bench Press
  '11111111-0000-4000-8000-00000000000d', -- Tricep Pushdown
  '91622cbe-2ee8-4a82-a057-6647dab6a9b6',  -- Seated Row
  '11111111-0000-4000-8000-000000000006', -- Lat Pulldown
  '11111111-0000-4000-8000-000000000009', -- Bicep Curls
  '11111111-0000-4000-8000-00000000000a', -- Hammer Curls
  '11111111-0000-4000-8000-000000000008', -- Face Pulls / Reverse Pec Deck
  '11111111-0000-4000-8000-000000000002', -- Calf Raise
  '11111111-0000-4000-8000-000000000004', -- Leg Extensions
  '11111111-0000-4000-8000-000000000001', -- Leg Press
  '11111111-0000-4000-8000-000000000005', -- Leg Curl
  '7729ff17-b1a4-44ca-be99-ca59387712b5'   -- Stiff-Leg Deadlift
);

-- The routine itself, owned by Ali and shared with the group.
insert into public.routines (id, owner_id, name, description, is_preset, visibility) values
  ('44444444-0000-4000-8000-000000000001',
   (select id from public.profiles where display_name = 'Ali'),
   'Ali''s Plan', '5-day split: push, pull, legs, upper, lower.', false, 'shared');

insert into public.routine_days (id, routine_id, day_order, name) values
  ('55555555-0000-4000-8000-000000000001', '44444444-0000-4000-8000-000000000001', 1, 'Push'),
  ('55555555-0000-4000-8000-000000000002', '44444444-0000-4000-8000-000000000001', 2, 'Pull'),
  ('55555555-0000-4000-8000-000000000003', '44444444-0000-4000-8000-000000000001', 3, 'Legs'),
  ('55555555-0000-4000-8000-000000000004', '44444444-0000-4000-8000-000000000001', 4, 'Upper'),
  ('55555555-0000-4000-8000-000000000005', '44444444-0000-4000-8000-000000000001', 5, 'Lower');

-- Push
insert into public.routine_exercises (routine_day_id, exercise_id, exercise_order) values
  ('55555555-0000-4000-8000-000000000001', '11111111-0000-4000-8000-00000000000b', 1), -- Bench Press
  ('55555555-0000-4000-8000-000000000001', '11111111-0000-4000-8000-00000000000e', 2), -- Lateral Raises
  ('55555555-0000-4000-8000-000000000001', '3ec49e60-d9c4-476c-99f5-4a1d3c5d819d', 3),  -- JM Press
  ('55555555-0000-4000-8000-000000000001', '11111111-0000-4000-8000-00000000000c', 4), -- Incline Bench Press
  ('55555555-0000-4000-8000-000000000001', '33333333-0000-4000-8000-000000000001', 5), -- Shoulder Press (Machine/Dumbbell)
  ('55555555-0000-4000-8000-000000000001', '11111111-0000-4000-8000-00000000000d', 6); -- Tricep Pushdown

-- Pull
insert into public.routine_exercises (routine_day_id, exercise_id, exercise_order) values
  ('55555555-0000-4000-8000-000000000002', '91622cbe-2ee8-4a82-a057-6647dab6a9b6', 1), -- Seated Row
  ('55555555-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000006', 2), -- Lat Pulldown
  ('55555555-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000009', 3), -- Bicep Curls
  ('55555555-0000-4000-8000-000000000002', '11111111-0000-4000-8000-00000000000a', 4), -- Hammer Curls
  ('55555555-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000008', 5); -- Reverse Pec Deck

-- Legs
insert into public.routine_exercises (routine_day_id, exercise_id, exercise_order) values
  ('55555555-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000002', 1), -- Calf Raise
  ('55555555-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000004', 2), -- Leg Extensions
  ('55555555-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000001', 3), -- Leg Press
  ('55555555-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000005', 4), -- Leg Curl
  ('55555555-0000-4000-8000-000000000003', '33333333-0000-4000-8000-000000000002', 5); -- Hip Adductor (Outer Thigh)

-- Upper
insert into public.routine_exercises (routine_day_id, exercise_id, exercise_order) values
  ('55555555-0000-4000-8000-000000000004', '11111111-0000-4000-8000-00000000000b', 1), -- Bench Press
  ('55555555-0000-4000-8000-000000000004', '11111111-0000-4000-8000-000000000008', 2), -- Reverse Pec Deck
  ('55555555-0000-4000-8000-000000000004', '11111111-0000-4000-8000-000000000006', 3), -- Lat Pulldown
  ('55555555-0000-4000-8000-000000000004', '33333333-0000-4000-8000-000000000001', 4), -- Shoulder Press (Machine/Dumbbell)
  ('55555555-0000-4000-8000-000000000004', '11111111-0000-4000-8000-000000000009', 5), -- Bicep Curls
  ('55555555-0000-4000-8000-000000000004', '33333333-0000-4000-8000-000000000003', 6); -- Abdominal Crunches

-- Lower
insert into public.routine_exercises (routine_day_id, exercise_id, exercise_order) values
  ('55555555-0000-4000-8000-000000000005', '11111111-0000-4000-8000-000000000004', 1), -- Leg Extensions
  ('55555555-0000-4000-8000-000000000005', '11111111-0000-4000-8000-000000000001', 2), -- Leg Press
  ('55555555-0000-4000-8000-000000000005', '11111111-0000-4000-8000-000000000005', 3), -- Leg Curl
  ('55555555-0000-4000-8000-000000000005', '7729ff17-b1a4-44ca-be99-ca59387712b5', 4),  -- SLDL
  ('55555555-0000-4000-8000-000000000005', '33333333-0000-4000-8000-000000000002', 5); -- Hip Adductor (Outer Thigh)
