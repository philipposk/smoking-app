import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { LOCALES, LANG_COOKIE } from '@/i18n/locales';

const Body = z.object({ locale: z.enum(LOCALES) });

export async function POST(request: NextRequest) {
  let parsed;
  try {
    parsed = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true, locale: parsed.locale });
  res.cookies.set(LANG_COOKIE, parsed.locale, {
    maxAge: 365 * 24 * 60 * 60,
    path: '/',
    sameSite: 'lax',
  });
  return res;
}
