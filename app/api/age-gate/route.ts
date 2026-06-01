import { NextRequest, NextResponse } from 'next/server';

const COOKIE = 'age_ok';
const ONE_YEAR = 365 * 24 * 60 * 60;
// Allowlist of redirect targets to prevent open-redirect abuse via ?next=.
function safeNext(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/';
  return next;
}

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const next = safeNext((form?.get('next') as string) ?? null);

  // Use the actual Host header so the redirect stays on the same origin the
  // browser used (127.0.0.1 vs localhost). Next.js dev normalises request.url
  // to "localhost" regardless of the Host header, which would split the cookie
  // origin from the redirect target.
  const host = request.headers.get('host') ?? 'localhost';
  const proto = request.url.startsWith('https:') ? 'https' : 'http';
  const res = NextResponse.redirect(new URL(next, `${proto}://${host}`), { status: 303 });
  res.cookies.set(COOKIE, '1', {
    maxAge: ONE_YEAR,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
