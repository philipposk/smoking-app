-- 0008: Create + harden the 'public' storage bucket used by /api/upload.
-- The upload route hands out signed PUT URLs, so size/MIME can't be enforced in
-- app code — the client could PUT anything. Enforce it at the storage layer so
-- oversized or non-image uploads are rejected by Supabase regardless of client.
-- Also removes the manual "create the bucket first" setup step.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'public',
  'public',
  true,
  5242880, -- 5 MB, matches the client-side cap in ImageUploader
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update set
  public             = true,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
