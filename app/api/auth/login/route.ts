import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createSession } from '@/lib/auth/session';
import { authLimit } from '@/lib/rate-limit';

const Body = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const blocked = authLimit.check(request, 'login');
  if (blocked) return blocked;

  let parsed;
  try {
    parsed = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const sb = supabaseAdmin();
  // Accept either username or email. Two separate eq queries avoid PostgREST
  // filter-string interpolation entirely.
  const identifier = parsed.username;
  const cols = 'id, username, email, role, avatar_url, bio, created_at, password_hash';
  const [{ data: byUser }, { data: byEmail }] = await Promise.all([
    sb.from('users').select(cols).eq('username', identifier).maybeSingle(),
    sb.from('users').select(cols).eq('email', identifier.toLowerCase()).maybeSingle(),
  ]);
  const user = byUser ?? byEmail;

  if (!user || !(await bcrypt.compare(parsed.password, (user as any).password_hash))) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  await createSession((user as any).id as string);

  const { password_hash: _drop, ...safe } = user as any;
  return NextResponse.json({ user: safe });
}
