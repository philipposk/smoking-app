import { NextRequest, NextResponse } from 'next/server';

// Rate limiter with two backends, chosen at runtime:
//
//   1. Upstash Redis (shared, correct across serverless instances) when
//      UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set. Uses the REST
//      API directly (no SDK dependency): INCR + EXPIRE NX = fixed-window count.
//   2. In-memory Map fallback otherwise (fine for a single Node server / local
//      dev; NOT correct across multiple Vercel lambdas — set Upstash in prod).
//
// `check` is async. Callers: `const blocked = await limit.check(req, 'key');`

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

function upstashConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

// Returns { count, ttlMs } for the current window, or null if Redis is
// unavailable / errored (caller then falls back to in-memory).
async function upstashHit(id: string, windowMs: number): Promise<{ count: number; ttlMs: number } | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;
  const ttlSec = Math.ceil(windowMs / 1000);
  const key = `rl:${id}`;
  try {
    // Pipeline: INCR then set expiry only if not already set (NX) so the window
    // is fixed from the first hit.
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, String(ttlSec), 'NX'],
        ['PTTL', key],
      ]),
      // Don't let a slow Redis hang the request path.
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return null;
    const out = await res.json();
    // out is [{result: count}, {result: 0|1}, {result: pttlMs}]
    const count = Number(out?.[0]?.result);
    const pttl = Number(out?.[2]?.result);
    if (!Number.isFinite(count)) return null;
    return { count, ttlMs: Number.isFinite(pttl) && pttl > 0 ? pttl : windowMs };
  } catch {
    return null;
  }
}

export function makeLimit({ windowMs, max }: Opts) {
  type Bucket = { count: number; resetAt: number };
  const buckets = new Map<string, Bucket>();

  // Periodic cleanup so the in-memory Map doesn't grow forever.
  if (typeof setInterval !== 'undefined') {
    const iv = setInterval(() => {
      const now = Date.now();
      for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
    }, Math.max(windowMs, 60_000));
    if (typeof iv === 'object' && iv && 'unref' in iv) (iv as any).unref();
  }

  function tooMany(retryAfterMs: number): NextResponse {
    const retryAfter = Math.max(1, Math.ceil(retryAfterMs / 1000));
    return NextResponse.json(
      { error: 'Too many requests. Slow down.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }

  function memCheck(id: string): NextResponse | null {
    const now = Date.now();
    let b = buckets.get(id);
    if (!b || b.resetAt < now) {
      b = { count: 0, resetAt: now + windowMs };
      buckets.set(id, b);
    }
    b.count++;
    if (b.count > max) return tooMany(b.resetAt - now);
    return null;
  }

  return {
    /** Returns a NextResponse if the request should be blocked, else null. */
    async check(req: NextRequest, key: string): Promise<NextResponse | null> {
      const id = `${clientIp(req)}:${key}`;
      if (upstashConfigured()) {
        const hit = await upstashHit(id, windowMs);
        if (hit) {
          if (hit.count > max) return tooMany(hit.ttlMs);
          return null;
        }
        // Redis errored — fall through to in-memory so we still throttle.
      }
      return memCheck(id);
    },
  };
}

// Pre-built limiters used across routes. Tweak numbers here in one place.
export const authLimit  = makeLimit({ windowMs: 60_000, max: 10 });   // signup/login
export const writeLimit = makeLimit({ windowMs: 60_000, max: 30 });   // POST routes
