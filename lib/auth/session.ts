import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { User } from '@/lib/supabase/types';

const COOKIE_NAME = 'sb_session';
const SESSION_DAYS = 30;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error('SESSION_SECRET must be set (32+ chars). See SETUP_SUPABASE.md.');
  }
  return s;
}

function sign(value: string): string {
  return createHmac('sha256', secret()).update(value).digest('base64url');
}

function pack(sessionId: string): string {
  return `${sessionId}.${sign(sessionId)}`;
}

function unpack(token: string): string | null {
  const dot = token.lastIndexOf('.');
  if (dot < 0) return null;
  const sessionId = token.slice(0, dot);
  const givenSig = token.slice(dot + 1);
  const expectedSig = sign(sessionId);
  const a = Buffer.from(givenSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? sessionId : null;
}

export async function createSession(userId: string): Promise<void> {
  const sb = supabaseAdmin();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  const { data, error } = await sb
    .from('sessions')
    .insert({ user_id: userId, expires_at: expiresAt.toISOString() })
    .select('id')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'session insert failed');

  cookies().set(COOKIE_NAME, pack(data.id as string), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (raw) {
    const sessionId = unpack(raw);
    if (sessionId) {
      await supabaseAdmin().from('sessions').delete().eq('id', sessionId);
    }
  }
  cookies().delete(COOKIE_NAME);
}

export async function currentUser(): Promise<User | null> {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const sessionId = unpack(raw);
  if (!sessionId) return null;

  const sb = supabaseAdmin();
  const { data: session } = await sb
    .from('sessions')
    .select('user_id, expires_at')
    .eq('id', sessionId)
    .maybeSingle();

  if (!session) return null;
  if (new Date(session.expires_at as string) < new Date()) {
    await sb.from('sessions').delete().eq('id', sessionId);
    return null;
  }

  const { data: user } = await sb
    .from('users')
    .select('id, username, email, role, avatar_url, bio, created_at, email_verified')
    .eq('id', session.user_id)
    .maybeSingle();

  return (user as unknown as User) ?? null;
}

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
