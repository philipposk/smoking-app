# Smoking → shared 6x7 Supabase Auth (branch `supabase-auth`)

Base: `audit/full-review` (identical to `main`, commit f1bb5a5, at time of branching) + `signup-source`.

## What changed
- Login is the shared 6x7 Supabase Auth; session cookie `sb-6x7-auth` on `.6x7.gr` (one login across 6x7 apps).
- `lib/auth/session.ts` `currentUser()` = Supabase user → `smoking_users` row by `auth_user_id`. All 13 call sites use it unchanged; roles (user/merchant/admin) still come from `smoking_users.role`.
- `/api/auth/login`: username or email → email lookup → `signInWithPassword`. Existing 6x7 accounts get a Smoking profile on first sign-in.
- `/api/auth/signup`: `supabase.auth.signUp` (metadata `signup_app=smoking`) + profile row (same id as the auth user). If email confirmation is on, the UI says "check your inbox".
- `/api/auth/callback` (new): confirmation link landing. `/api/auth/resend-verify` uses Supabase resend. `/api/auth/verify` kept only for old links.
- `middleware.ts`: age gate unchanged + session refresh + `public.app_access` tracking.
- Removed the temporary `app_access_external` tracking. `SESSION_SECRET` no longer needed after cutover.

## Database
- `docs/sql/supabase-auth-01-prepare.sql` — APPLIED 2026-10-20 (non-breaking, idempotent): backup schema `backup_smoking`, `smoking_users.auth_user_id`, shared-login accounts for the 9 users with bcrypt passwords (hash imported, same uuid; verified → confirmed), identities, app_access rows.
- `docs/sql/supabase-auth-02-cutover.sql` — NOT applied: re-run 01, link the passwordless profile to its existing 6x7 account (option A) or not (B), delete old sessions; later optional cleanup.

## Cutover checklist (needs approval)
1. Supabase Auth → URL config: allow `https://smoking.6x7.gr/api/auth/callback`.
2. Deploy this branch to production (needs `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — already used today).
3. Run 02-cutover.sql (re-runs 01 logic first).
4. Old `sb_session` cookies stop working; users sign in again with the same password.
Rollback: redeploy the previous build; nothing destructive happens before step 3's optional cleanup.
