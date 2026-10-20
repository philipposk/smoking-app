import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth/session';
import { supabaseServer } from '@/lib/supabase/server';
import { authLimit } from '@/lib/rate-limit';

// Resend the Supabase confirmation email for the signed-in user. No-op if verified.
export async function POST(request: NextRequest) {
  const blocked = await authLimit.check(request, 'resend-verify');
  if (blocked) return blocked;

  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if ((user as any).email_verified) return NextResponse.json({ ok: true, alreadyVerified: true });

  const origin = request.headers.get('origin') ?? new URL(request.url).origin;
  const { error } = await supabaseServer().auth.resend({
    type: 'signup',
    email: user.email,
    options: { emailRedirectTo: `${origin}/api/auth/callback` },
  });
  if (error) console.error('resend-verify failed:', error.message);
  return NextResponse.json({ ok: true });
}
