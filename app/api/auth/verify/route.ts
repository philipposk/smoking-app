import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.redirect(new URL('/?verified=missing', request.url));
  }

  const sb = supabaseAdmin();
  const { data: user } = await sb
    .from('users')
    .select('id, email_verify_expires_at')
    .eq('email_verify_token', token)
    .maybeSingle();

  if (!user) {
    return NextResponse.redirect(new URL('/?verified=invalid', request.url));
  }
  if (new Date((user as any).email_verify_expires_at) < new Date()) {
    return NextResponse.redirect(new URL('/?verified=expired', request.url));
  }

  const { error } = await sb
    .from('users')
    .update({
      email_verified: true,
      email_verify_token: null,
      email_verify_expires_at: null,
    })
    .eq('id', (user as any).id);

  if (error) {
    return NextResponse.redirect(new URL('/?verified=error', request.url));
  }

  return NextResponse.redirect(new URL('/?verified=ok', request.url));
}
