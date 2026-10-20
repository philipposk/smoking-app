import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { sharedCookieOptions } from './lib/supabase/cookies';
import { trackAppAccess } from './lib/app-access';

// Server-side age-gate enforcement. The client modal in
// app/components/AgeGate.tsx is the primary UX, but a determined user could
// remove it from the DOM and use the app. Middleware blocks unauthenticated
// page navigations at the edge, before any HTML renders.
//
// Note: real legal-grade age verification needs an ID upload step. This is the
// industry-standard "I confirm I am of age" gate (Coca-Cola, Diageo, etc.).
// It raises the bar but is not unbypassable — anyone can set the cookie via
// DevTools. Document that limit in privacy/terms if you ship to a strict
// regulator's jurisdiction.

const COOKIE = 'age_ok';
const GATE_PATH = '/age-gate';

// Paths that don't need the gate at all (legal pages, API, static assets).
const PASSTHROUGH = [
  GATE_PATH,
  '/privacy',
  '/terms',
  // Individual place listing pages are public so shared links unfurl (OG tags)
  // and search engines can index them. The interactive app (/, /map, …) stays
  // gated. A single listing showing one location + reviews is low-risk content.
  '/place/',
  '/sitemap.xml',
  '/robots.txt',
  '/api/',
  '/_next/',
  '/manifest.json',
  '/icon.svg',
  '/favicon',
  '/sw.js',
  '/workbox-',
];

// Refreshes the shared 6x7 session cookie and records Smoking usage in
// public.app_access. Only runs when a session cookie is present.
async function refreshSession(req: NextRequest, res: NextResponse): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const name = sharedCookieOptions.name;
  if (!url || !key || !req.cookies.getAll().some((c) => c.name === name || c.name.startsWith(`${name}.`))) return res;
  let response = res;
  const supabase = createServerClient(url, key, {
    cookieOptions: sharedCookieOptions,
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(list) {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        const isRedirect = response.status >= 300 && response.status < 400;
        if (!isRedirect) response = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const result = (await Promise.race([
    supabase.auth.getUser(),
    new Promise((resolve) => setTimeout(resolve, 5000)),
  ])) as { data?: { user?: { id: string } | null } } | undefined;
  await trackAppAccess(supabase, result?.data?.user, req, response, 'smoking');
  return response;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith('/api/');

  if (PASSTHROUGH.some((p) => pathname === p || pathname.startsWith(p))) {
    // API routes read the session themselves; skip the refresh round-trip there.
    return isApi ? NextResponse.next() : refreshSession(req, NextResponse.next({ request: req }));
  }

  if (req.cookies.get(COOKIE)?.value === '1') {
    return refreshSession(req, NextResponse.next({ request: req }));
  }

  const url = req.nextUrl.clone();
  url.pathname = GATE_PATH;
  // Preserve the requested URL so the gate can bounce back after confirmation
  url.searchParams.set('next', pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  // Match everything except framework assets. The PASSTHROUGH list above
  // handles fine-grained allow-listing.
  matcher: ['/((?!_next/|favicon|icon.svg|manifest.json).*)'],
};
