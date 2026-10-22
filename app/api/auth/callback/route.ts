import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { ensureProfile } from '@/lib/auth/profile';

// Email-confirmation / magic-link landing: exchanges the code for a shared session.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.redirect(new URL('/?verified=missing', request.url));
  const { data, error } = await supabaseServer().auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(new URL('/?verified=invalid', request.url));
  await ensureProfile(data.user);
  return NextResponse.redirect(new URL('/?verified=ok', request.url));
}
