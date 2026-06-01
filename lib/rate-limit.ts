import { NextRequest, NextResponse } from 'next/server';

// In-memory sliding-window rate limiter. Per-process: fine for a single
// Vercel function instance / single Node server. If you scale horizontally,
// swap the Map for Upstash Redis (drop-in: same `check` signature).
//
//   const limit = makeLimit({ windowMs: 60_000, max: 10 });
//   const blocked = limit.check(req, 'signup');
//   if (blocked) return blocked;

type Bucket = { count: number; resetAt: number };

interface Opts {
  windowMs: number; // size of the window
  max: number;      // max hits per window per (ip + key)
}

export function clientIp(req: NextRequest): string {
  // On Vercel, prefer x-vercel-forwarded-for — set by Vercel's edge and
  // unspoofable from the client. Fall back to x-forwarded-for / x-real-ip only
  // when we're NOT on Vercel (local dev, self-hosted Node).
  const onVercel = !!process.env.VERCEL;
  if (onVercel) {
    const v = req.headers.get('x-vercel-forwarded-for');
    if (v) return v.split(',')[0]!.trim();
  } else {
    const xff = req.headers.get('x-forwarded-for');
    if (xff) return xff.split(',')[0]!.trim();
    const real = req.headers.get('x-real-ip');
    if (real) return real;
  }
  return 'unknown';
}

export function makeLimit({ windowMs, max }: Opts) {
  const buckets = new Map<string, Bucket>();

  // Periodic cleanup so the Map doesn't grow forever in long-lived processes.
  // setInterval is unref'd so it doesn't keep the event loop alive.
  if (typeof setInterval !== 'undefined') {
    const iv = setInterval(() => {
      const now = Date.now();
      for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
    }, Math.max(windowMs, 60_000));
    if (typeof iv === 'object' && iv && 'unref' in iv) (iv as any).unref();
  }

  return {
    /** Returns a NextResponse if the request should be blocked, else null. */
    check(req: NextRequest, key: string): NextResponse | null {
      const id = `${clientIp(req)}:${key}`;
      const now = Date.now();
      let b = buckets.get(id);
      if (!b || b.resetAt < now) {
        b = { count: 0, resetAt: now + windowMs };
        buckets.set(id, b);
      }
      b.count++;
      if (b.count > max) {
        const retryAfter = Math.max(1, Math.ceil((b.resetAt - now) / 1000));
        return NextResponse.json(
          { error: 'Too many requests. Slow down.' },
          { status: 429, headers: { 'Retry-After': String(retryAfter) } },
        );
      }
      return null;
    },
  };
}

// Pre-built limiters used across routes. Tweak numbers here in one place.
export const authLimit  = makeLimit({ windowMs: 60_000, max: 10 });   // signup/login
export const writeLimit = makeLimit({ windowMs: 60_000, max: 30 });   // POST routes
