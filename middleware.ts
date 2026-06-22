import { NextRequest, NextResponse } from 'next/server';

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

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PASSTHROUGH.some((p) => pathname === p || pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (req.cookies.get(COOKIE)?.value === '1') {
    return NextResponse.next();
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
