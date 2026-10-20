-- Smoking → shared 6x7 Supabase Auth, PHASE 1 (non-breaking; old auth keeps working).
-- Idempotent: safe to re-run right before cutover to pick up users who signed up meanwhile.
-- Project: 6x7. Contains no secrets or emails.

-- 1) Backup of affected rows (private schema, not exposed via the API).
create schema if not exists backup_smoking;
revoke all on schema backup_smoking from public, anon, authenticated;
create table if not exists backup_smoking.smoking_users_20261020 as table public.smoking_users;
create table if not exists backup_smoking.smoking_sessions_20261020 as table public.smoking_sessions;
revoke all on all tables in schema backup_smoking from public, anon, authenticated;

-- 2) Mapping column: which shared-login account a Smoking profile belongs to.
--    Old code ignores it. New code looks profiles up by it, so other tables'
--    foreign keys (reviews, favorites, forum, claims, places) never change.
alter table public.smoking_users add column if not exists auth_user_id uuid;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'smoking_users_auth_user_id_fkey') then
    alter table public.smoking_users
      add constraint smoking_users_auth_user_id_fkey foreign key (auth_user_id) references auth.users(id) on delete set null;
  end if;
end $$;
create unique index if not exists smoking_users_auth_user_id_key on public.smoking_users(auth_user_id);

-- 3) Shared-login accounts for Smoking users that have a bcrypt password and no
--    existing account with that email. Same uuid as the Smoking profile.
--    The bcrypt hash ($2a$/$2b$) is copied as-is, so passwords keep working.
--    Verified Smoking emails are marked confirmed; unverified stay unconfirmed.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, reauthentication_token, phone_change, phone_change_token
)
select '00000000-0000-0000-0000-000000000000', s.id, 'authenticated', 'authenticated', lower(s.email), s.password_hash,
       case when s.email_verified then now() end,
       '{"provider":"email","providers":["email"]}'::jsonb,
       jsonb_build_object('signup_app', 'smoking', 'username', s.username, 'migrated_from', 'smoking_users'),
       s.created_at, now(), '', '', '', '', '', '', '', ''
from public.smoking_users s
where s.password_hash like '$2_$%'
  and not exists (select 1 from auth.users u where lower(u.email) = lower(s.email))
  and not exists (select 1 from auth.users u where u.id = s.id);

insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id::text, u.id,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', u.email_confirmed_at is not null, 'phone_verified', false),
       'email', null, now(), now()
from auth.users u
join public.smoking_users s on s.id = u.id
where u.raw_user_meta_data->>'migrated_from' = 'smoking_users'
  and not exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email');

-- 4) Link the migrated profiles to their new accounts.
update public.smoking_users s set auth_user_id = s.id
where s.auth_user_id is null
  and exists (select 1 from auth.users u where u.id = s.id and u.raw_user_meta_data->>'migrated_from' = 'smoking_users');

-- 5) Record origin in the shared usage table.
insert into public.app_access (user_id, app, first_seen, last_seen)
select s.auth_user_id, 'smoking', s.created_at, now()
from public.smoking_users s where s.auth_user_id is not null
on conflict (user_id, app) do nothing;

-- NOT in phase 1 (held, see supabase-auth-02-cutover.sql):
--  * the passwordless profile whose email already has a shared-login account (left untouched)
--  * deleting smoking_sessions, dropping password/verify-token columns
