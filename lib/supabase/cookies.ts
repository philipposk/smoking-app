// Shared 6x7 session cookie: one login across *.6x7.gr apps (same Supabase project).
const isProd = process.env.NODE_ENV === 'production';

export const sharedCookieOptions = {
  name: 'sb-6x7-auth',
  ...(isProd ? { domain: '.6x7.gr' } : {}),
  sameSite: 'lax' as const,
  secure: isProd,
  path: '/',
};
