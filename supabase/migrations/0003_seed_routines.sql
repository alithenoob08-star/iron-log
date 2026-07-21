-- Preset routines. owner_id is left null; ownership is auto-claimed when a
-- user signs up with a matching display_name (see claim_preset_routines()).

insert into public.routines (name, description, is_preset, visibility, claim_display_name)
values
  ('Lewis''s Plan', '3-day split: chest, back, legs.', true, 'shared', 'Lewis'),
  ('Logan''s Plan', 'Placeholder — to be filled in.', true, 'shared', 'Logan');

insert into public.routine_days (routine_id, day_order, name)
select id, 1, 'Chest Day' from public.routines where name = 'Lewis''s Plan'
union all
select id, 2, 'Back Day' from public.routines where name = 'Lewis''s Plan'
union all
select id, 3, 'Leg Day' from public.routines where name = 'Lewis''s Plan';

-- Logan's Plan intentionally has no days yet.
