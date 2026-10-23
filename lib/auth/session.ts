import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabaseServer } from '@/lib/supabase/server';
import { TABLES } from '@/lib/supabase/tables';
import type { User } from '@/lib/supabase/types';

// Auth = shared 6x7 Supabase Auth (cookie sb-6x7-auth on .6x7.gr).
// The Smoking profile (username, role, avatar, bio) lives in smoking_users and is
// linked to the login account by smoking_users.auth_user_id. Profile ids are
// unchanged, so every table that references smoking_users(id) keeps working.

const PROFILE_COLS = 'id, username, email, role, avatar_url, bio, created_at, email_verified';

/** The signed-in Smoking profile, or null. Every route/page uses this. */
export async function currentUser(): Promise<User | null> {
  // No Supabase configured (local dev, CI): nobody can be signed in.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  const { data } = await supabaseServer().auth.getUser();
  const authUser = data.user;
  if (!authUser) return null;
  const { data: profile } = await supabaseAdmin()
    .from(TABLES.users)
    .select(PROFILE_COLS)
    .eq('auth_user_id', authUser.id)
    .maybeSingle();
  if (!profile) return null;
  const p = profile as unknown as User;
  // Supabase owns email confirmation now; keep the profile flag in step.
  if (!p.email_verified && authUser.email_confirmed_at) {
    p.email_verified = true;
    await supabaseAdmin().from(TABLES.users).update({ email_verified: true }).eq('id', p.id);
  }
  return p;
}

/** Signs out of the shared session (all *.6x7.gr apps share it). */
export async function destroySession(): Promise<void> {
  await supabaseServer().auth.signOut();
}

/** Resolve "username or email" to the login email (Supabase signs in by email). */
export async function loginEmailFor(identifier: string): Promise<string | null> {
  const id = identifier.trim();
  if (id.includes('@')) return id.toLowerCase();
  const { data } = await supabaseAdmin().from(TABLES.users).select('email').eq('username', id).maybeSingle();
  return (data as { email?: string } | null)?.email?.toLowerCase() ?? null;
}

export { PROFILE_COLS };

// Email-verification gate for write endpoints.
// If REQUIRE_EMAIL_VERIFIED is set OR a Resend key is configured (production
// signal), users must verify their email before they can post/claim/add.
// In dev w/o either, gate is open so signup → post still works end-to-end.
export function requireVerifiedEmail(): boolean {
  if (process.env.REQUIRE_EMAIL_VERIFIED === 'true') return true;
  if (process.env.REQUIRE_EMAIL_VERIFIED === 'false') return false;
  return !!process.env.RESEND_API_KEY;
}

export interface VerifyGateFail { status: 401 | 403; error: string; }

/**
 * Returns the user if they're allowed to write, or a {status,error} object
 * describing why they're blocked. Saves repeating the same 3-line check in
 * every write route.
 */
export async function requireWriter(): Promise<User | VerifyGateFail> {
  const u = await currentUser();
  if (!u) return { status: 401, error: 'Unauthorized' };
  if (requireVerifiedEmail() && !(u as any).email_verified) {
    return { status: 403, error: 'Confirm your email first. Check your inbox or request a new verification link.' };
  }
  return u;
}

/**
 * Shared admin gate. Returns the user plus a `deny` NextResponse that callers
 * return early when set. Mirrors the local helper in app/api/admin/flags so
 * other admin-only handlers (e.g. the merchant-claims list) reuse one source.
 */
export async function requireAdmin(): Promise<
  { user: User; deny: null } | { user: User | null; deny: { status: 401 | 403; error: string } }
> {
  const user = await currentUser();
  if (!user) return { user: null, deny: { status: 401, error: 'Unauthorized' } };
  if ((user as any).role !== 'admin') return { user, deny: { status: 403, error: 'Forbidden' } };
  return { user, deny: null };
}
