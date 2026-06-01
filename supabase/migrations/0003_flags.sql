-- Moderation flags. Anyone can flag content; admins review.

create table if not exists public.flags (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('place','review','forum_post','forum_reply','user')),
  target_id uuid not null,
  reason text,
  detail text,
  reporter_user_id uuid references public.users(id) on delete set null,
  status text not null default 'open' check (status in ('open','reviewed','dismissed','actioned')),
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists flags_target_idx on public.flags(target_type, target_id);
create index if not exists flags_status_idx on public.flags(status);

alter table public.flags enable row level security;
-- No public select; admins use service-role via /admin routes.
