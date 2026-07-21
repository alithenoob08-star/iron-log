-- Progress photos bucket. Private; each user can only read/write objects
-- under a folder prefixed with their own user id, e.g. "<user_id>/2026-07-20.jpg".

insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

create policy "users manage their own progress photo objects"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);
