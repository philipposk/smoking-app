-- NOT applied. Shared 6x7 table for apps with their own (non-Supabase-auth) users.
create table if not exists public.app_access_external (
  app text not null,
  external_id text not null,
  email text,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  last_event text,
  primary key (app, external_id)
);
alter table public.app_access_external enable row level security;
revoke all on public.app_access_external from anon, authenticated;  -- service role only
grant select on public.app_access_external to admin_ro;
create index if not exists app_access_external_email_idx on public.app_access_external(lower(email));
