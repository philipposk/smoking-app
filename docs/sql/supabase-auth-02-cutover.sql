-- Smoking → shared 6x7 Supabase Auth, PHASE 2 (CUTOVER). NOT applied. Needs approval.
-- Run right after deploying the supabase-auth branch to production.

-- a) Re-run phase 1 first (01-prepare.sql) to migrate anyone who signed up since.

-- b) Overlapping account: one Smoking profile has no password and its email already
--    has a shared-login account (signed in elsewhere in 6x7). Choice for the owner:
--    OPTION A (recommended): link the profile to that existing account, so the person
--    signs in to Smoking with their existing 6x7 login and keeps their reviews etc.
update public.smoking_users s set auth_user_id = u.id
from auth.users u
where s.auth_user_id is null and s.password_hash is null and lower(u.email) = lower(s.email);
--    OPTION B: leave it unlinked (profile stays orphaned; the person gets a fresh profile).

-- c) Old sessions are useless after cutover (new code reads the sb-6x7-auth cookie).
delete from public.smoking_sessions;

-- d) Later, once stable (optional cleanup; backups exist in backup_smoking):
-- alter table public.smoking_users drop column password_hash, drop column email_verify_token, drop column email_verify_expires_at;
-- drop table public.smoking_sessions;

-- ROLLBACK (if cutover is reverted to the old code): old code still works as long as
-- password_hash/sessions columns were not dropped; just redeploy the previous build.
