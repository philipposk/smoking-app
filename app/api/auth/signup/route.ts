import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createSession } from '@/lib/auth/session';
import { authLimit } from '@/lib/rate-limit';
import { sendEmail } from '@/lib/email';

const Body = z.object({
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_.-]+$/),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
});

export async function POST(request: NextRequest) {
  const blocked = authLimit.check(request, 'signup');
  if (blocked) return blocked;

  let parsed;
  try {
    parsed = Body.parse(await request.json());
  } catch (e: any) {
    return NextResponse.json({ error: 'Invalid input', details: e.errors }, { status: 400 });
  }

  const sb = supabaseAdmin();

  // Two separate eq queries avoid PostgREST filter-string interpolation
  // (the username regex above forbids `,()` but doing this cleanly removes
  //  the whole class of injection concern for future maintainers).
  const [{ data: byUser }, { data: byEmail }] = await Promise.all([
    sb.from('users').select('id').eq('username', parsed.username).maybeSingle(),
    sb.from('users').select('id').eq('email', parsed.email).maybeSingle(),
  ]);

  if (byUser || byEmail) {
    return NextResponse.json({ error: 'Username or email already taken' }, { status: 409 });
  }

  const password_hash = await bcrypt.hash(parsed.password, 12);
  const token = randomBytes(24).toString('base64url');
  const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  const { data: user, error } = await sb
    .from('users')
    .insert({
      username: parsed.username,
      email: parsed.email,
      password_hash,
      email_verify_token: token,
      email_verify_expires_at: tokenExpires.toISOString(),
    })
    .select('id, username, email, role, avatar_url, bio, created_at, email_verified')
    .single();

  if (error || !user) {
    return NextResponse.json({ error: error?.message ?? 'signup failed' }, { status: 500 });
  }

  // Send verification email (no-op + console log in dev if RESEND_API_KEY unset)
  const origin = request.headers.get('origin') ?? new URL(request.url).origin;
  const verifyUrl = `${origin}/api/auth/verify?token=${encodeURIComponent(token)}`;
  try {
    await sendEmail({
      to: parsed.email,
      subject: 'Confirm your Smoking account',
      html: `
        <p>Welcome, ${escapeHtml(parsed.username)}.</p>
        <p>Confirm your email by clicking the link below. It expires in 24 hours.</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p>If you didn't sign up, you can ignore this message.</p>`,
      text: `Welcome, ${parsed.username}.\nConfirm: ${verifyUrl}\n(expires in 24h)`,
    });
  } catch (e: any) {
    // Don't fail the signup if email send fails; user can re-request later.
    console.error('verify email send failed:', e.message);
  }

  await createSession((user as any).id as string);

  return NextResponse.json({ user });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}
