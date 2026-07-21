-- profile_lookup was created security_invoker=true, so anon (pre-login)
-- queries silently returned zero rows: anon has no SELECT policy on
-- profiles, and an invoker-security view enforces the caller's RLS on the
-- underlying table row-by-row. Switch it back to the default
-- (security_invoker = false) so the view runs with the owner's privileges,
-- controlled instead by the explicit grant to anon/authenticated below.
alter view public.profile_lookup set (security_invoker = false);
