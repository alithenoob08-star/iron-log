-- Adds "height" as a trackable measurement type alongside the existing
-- circumference measurements.
alter table public.body_measurements
  drop constraint body_measurements_measurement_type_check;

alter table public.body_measurements
  add constraint body_measurements_measurement_type_check
  check (measurement_type in (
    'waist', 'chest', 'hips', 'arm_left', 'arm_right', 'thigh_left',
    'thigh_right', 'shoulders', 'neck', 'calf_left', 'calf_right', 'height'
  ));
