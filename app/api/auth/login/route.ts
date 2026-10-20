import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { loginEmailFor } from '@/lib/auth/session';
import { ensureProfile } from '@/lib/auth/profile';
import { authLimit } from '@/lib/rate-limit';

const Body = z.object({
  username: z.string().trim().min(1), // username or email
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const blocked = await authLimit.check(request, 'login');
  if (blocked) return blocked;

  let parsed;
  try {
    parsed = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const email = await loginEmailFor(parsed.username);
  if (!email) return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });

  // Shared 6x7 login: sets the sb-6x7-auth cookie (valid on every *.6x7.gr app).
  const { data, error } = await supabaseServer().auth.signInWithPassword({ email, password: parsed.password });
  if (error || !data.user) {
    const unconfirmed = /confirm/i.test(error?.message ?? '');
    return NextResponse.json(
      { error: unconfirmed ? 'Confirm your email first. Check your inbox.' : 'Invalid username or password' },
      { status: unconfirmed ? 403 : 401 },
    );
  }

  const user = await ensureProfile(data.user);
  if (!user) return NextResponse.json({ error: 'Could not load your profile' }, { status: 500 });
  return NextResponse.json({ user });
}
