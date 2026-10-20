import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sharedCookieOptions } from './cookies';

/** Anon-key client bound to the shared sb-6x7-auth session cookie (route handlers / server components). */
export function supabaseServer() {
  const store = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookieOptions: sharedCookieOptions,
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Server Component: middleware refreshes the cookie instead.
        }
      },
    },
  });
}
