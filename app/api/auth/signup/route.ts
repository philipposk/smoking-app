import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabaseServer } from '@/lib/supabase/server';
import { ensureProfile } from '@/lib/auth/profile';
import { authLimit } from '@/lib/rate-limit';
import { TABLES } from '@/lib/supabase/tables';

const Body = z.object({
  username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_.-]+$/),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
});

export async function POST(request: NextRequest) {
  const blocked = await authLimit.check(request, 'signup');
  if (blocked) return blocked;

  let parsed;
  try {
    parsed = Body.parse(await request.json());
  } catch (e: any) {
    return NextResponse.json({ error: 'Invalid input', details: e.errors }, { status: 400 });
  }

  const sb = supabaseAdmin();
  const [{ data: byUser }, { data: byEmail }] = await Promise.all([
    sb.from(TABLES.users).select('id').eq('username', parsed.username).maybeSingle(),
    sb.from(TABLES.users).select('id').eq('email', parsed.email).maybeSingle(),
  ]);
  if (byUser || byEmail) {
    return NextResponse.json({ error: 'Username or email already taken' }, { status: 409 });
  }

  const origin = request.headers.get('origin') ?? new URL(request.url).origin;
  const { data, error } = await supabaseServer().auth.signUp({
    email: parsed.email,
    password: parsed.password,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback`,
      data: { signup_app: 'smoking', username: parsed.username },
    },
  });
  if (error || !data.user) {
    return NextResponse.json({ error: error?.message ?? 'signup failed' }, { status: 400 });
  }
  // Supabase hides "already registered" by returning a user with no identities.
  if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return NextResponse.json(
      { error: 'This email already has a 6x7 account. Sign in with it instead.' },
      { status: 409 },
    );
  }

  const user = await ensureProfile(data.user, parsed.username);
  if (!user) return NextResponse.json({ error: 'signup failed' }, { status: 500 });

  // No session yet = Supabase sent a confirmation email (project setting).
  return NextResponse.json({ user, needsConfirmation: !data.session });
}
