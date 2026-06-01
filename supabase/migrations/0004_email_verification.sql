-- Email verification fields on users.
-- Verification is optional (token may be null), but unverified accounts can be
-- given reduced privileges in code (e.g. cannot post in the forum).

alter table public.users
  add column if not exists email_verified boolean not null default false,
  add column if not exists email_verify_token text,
  add column if not exists email_verify_expires_at timestamptz;

create index if not exists users_email_verify_token_idx
  on public.users (email_verify_token);
