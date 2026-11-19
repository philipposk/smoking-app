import { createBrowserClient } from '@supabase/ssr';
import { cookieOptionsForHost } from './cookies';

// Anon-key client for the browser. Read-only against tables with public SELECT
// policies. Writes go through our /api routes.
let cached: ReturnType<typeof createBrowserClient> | null = null;

export function supabaseBrowser() {
  if (cached) return cached;
  cached = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: cookieOptionsForHost(typeof window !== "undefined" ? window.location.hostname : undefined) },
  );
  return cached;
}
