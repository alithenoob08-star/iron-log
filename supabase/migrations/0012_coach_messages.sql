-- Chat history for the AI training coach. Each user only ever sees their
-- own conversation; the AI is given a fresh summary of the user's own
-- training data on every turn (computed server-side, not stored here).

create table public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.coach_messages enable row level security;

create policy "users manage their own coach messages"
  on public.coach_messages for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
