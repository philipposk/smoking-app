-- Reviewer caught: email_verify_token had a plain index, not UNIQUE.
-- Hardens the /api/auth/verify lookup so .maybeSingle() can't ever silently
-- match a wrong user if two tokens collide (cryptographically negligible at
-- 24 random bytes, but the constraint costs nothing).
--
-- The index is partial (WHERE token IS NOT NULL) so the constraint doesn't
-- forbid multiple users from having NULL tokens (most users, post-verification).

drop index if exists users_email_verify_token_idx;

create unique index if not exists users_email_verify_token_uniq
  on public.users (email_verify_token)
  where email_verify_token is not null;
