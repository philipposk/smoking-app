-- Prefix Smoking tables for the shared 6x7 Supabase project (samos_*, topia_*, etc.).
-- Idempotent: only renames when unprefixed tables exist.

do $$
begin
  if to_regclass('public.users') is not null and to_regclass('public.smoking_users') is null then
    alter table public.users rename to smoking_users;
  end if;
  if to_regclass('public.sessions') is not null and to_regclass('public.smoking_sessions') is null then
    alter table public.sessions rename to smoking_sessions;
  end if;
  if to_regclass('public.places') is not null and to_regclass('public.smoking_places') is null then
    alter table public.places rename to smoking_places;
  end if;
  if to_regclass('public.reviews') is not null and to_regclass('public.smoking_reviews') is null then
    alter table public.reviews rename to smoking_reviews;
  end if;
  if to_regclass('public.favorites') is not null and to_regclass('public.smoking_favorites') is null then
    alter table public.favorites rename to smoking_favorites;
  end if;
  if to_regclass('public.merchant_claims') is not null and to_regclass('public.smoking_merchant_claims') is null then
    alter table public.merchant_claims rename to smoking_merchant_claims;
  end if;
  if to_regclass('public.forum_posts') is not null and to_regclass('public.smoking_forum_posts') is null then
    alter table public.forum_posts rename to smoking_forum_posts;
  end if;
  if to_regclass('public.forum_replies') is not null and to_regclass('public.smoking_forum_replies') is null then
    alter table public.forum_replies rename to smoking_forum_replies;
  end if;
  if to_regclass('public.flags') is not null and to_regclass('public.smoking_flags') is null then
    alter table public.flags rename to smoking_flags;
  end if;
end $$;

-- Stats RPC (was place_stats on public.places).
create or replace function public.smoking_place_stats()
returns table (places bigint, cities bigint, countries bigint)
language sql
stable
as $$
  select
    count(*)::bigint                              as places,
    count(distinct nullif(city, ''))::bigint      as cities,
    count(distinct nullif(country, ''))::bigint   as countries
  from public.smoking_places
  where verified = true;
$$;

-- Dedicated storage bucket (don't use the generic `public` bucket).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'smoking',
  'smoking',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update set
  public             = true,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
