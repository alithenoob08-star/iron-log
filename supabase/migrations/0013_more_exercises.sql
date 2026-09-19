-- New exercises: Chest Press, Tricep Pulldown, Cable Lateral Raise, plus
-- Leon's own named variants of Overhead Tricep Extension and Bicep Curls
-- (kept distinct from the existing generic "Bicep Curls").
insert into public.exercises (id, name, muscle_group) values
  ('66666666-0000-4000-8000-000000000001', 'Chest Press', 'chest'),
  ('66666666-0000-4000-8000-000000000002', 'Tricep Pulldown', 'arms'),
  ('66666666-0000-4000-8000-000000000004', 'Cable Lateral Raise', 'shoulders'),
  ('66666666-0000-4000-8000-000000000005', 'Leon''s Overhead Tricep Extension', 'arms'),
  ('66666666-0000-4000-8000-000000000006', 'Leon''s Bicep Curls', 'arms');

-- Rename the combined "Machine/Dumbbell" shoulder press to just "Machine" --
-- the dumbbell option already has its own dedicated entry
-- ("Dumbbell Shoulder Press"), so this stops the two overlapping.
update public.exercises
set name = 'Shoulder Press (Machine)'
where id = '33333333-0000-4000-8000-000000000001';

-- Split "Face Pulls / Reverse Pec Deck" into two exercises. The existing
-- row keeps its id (so Lewis's Plan and Logan's Plan, which already
-- reference it, keep working unchanged) and becomes just "Face Pulls";
-- "Reverse Pec Deck" becomes a new, separate exercise.
update public.exercises
set name = 'Face Pulls'
where id = '11111111-0000-4000-8000-000000000008';

insert into public.exercises (id, name, muscle_group) values
  ('66666666-0000-4000-8000-000000000003', 'Reverse Pec Deck', 'back');

-- Ali's Plan asked for "Reverse Pec Deck" specifically (Pull day and
-- Upper day) when it was created against the old combined exercise —
-- repoint just those two rows at the new dedicated exercise. The
-- routine_day_id filter keeps this scoped to Ali's Plan only, so Lewis's
-- and Logan's own references to the (now renamed) Face Pulls are untouched.
update public.routine_exercises
set exercise_id = '66666666-0000-4000-8000-000000000003'
where exercise_id = '11111111-0000-4000-8000-000000000008'
  and routine_day_id in (
    '55555555-0000-4000-8000-000000000002', -- Ali's Plan: Pull
    '55555555-0000-4000-8000-000000000004'  -- Ali's Plan: Upper
  );
