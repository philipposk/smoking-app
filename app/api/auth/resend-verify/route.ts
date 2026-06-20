import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { currentUser } from '@/lib/auth/session';
import { authLimit } from '@/lib/rate-limit';
import { sendEmail } from '@/lib/email';

// Resend the email-verification link for the signed-in user.
// Rate-limited via authLimit (10/min/IP). No-op if already verified.
export async function POST(request: NextRequest) {
  const blocked = await authLimit.check(request, 'resend-verify');
  if (blocked) return blocked;

  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if ((user as any).email_verified) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }

  const sb = supabaseAdmin();
  const token = randomBytes(24).toString('base64url');
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const { error } = await sb
    .from('users')
    .update({
      email_verify_token: token,
      email_verify_expires_at: expires.toISOString(),
    })
    .eq('id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const origin = request.headers.get('origin') ?? new URL(request.url).origin;
  const verifyUrl = `${origin}/api/auth/verify?token=${encodeURIComponent(token)}`;
  try {
    await sendEmail({
      to: user.email,
      subject: 'Confirm your Smoking account',
      html: `
        <p>You requested a new verification link.</p>
        <p>It expires in 24 hours:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
      text: `Confirm: ${verifyUrl}\n(expires in 24h)`,
    });
  } catch (e: any) {
    // Don't leak send-failure detail; user should still see "sent" UI to avoid
    // enumeration. Server log is the trail.
    console.error('resend-verify email send failed:', e.message);
  }

  return NextResponse.json({ ok: true });
}
