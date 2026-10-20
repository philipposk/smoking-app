import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Smoking uses its own users table (custom bcrypt auth), so it can't write the shared
 * public.app_access (FK to auth.users). It records into public.app_access_external
 * (see docs/sql/0099_app_access_external.sql — NOT applied yet). Until that
 * table exists the upsert simply errors and is ignored. Never throws.
 */
export async function trackExternalAccess(user: { id: string; email?: string | null }, event: 'signup' | 'login') {
  try {
    const now = new Date().toISOString();
    await supabaseAdmin()
      .from('app_access_external')
      .upsert(
        { app: 'smoking', external_id: user.id, email: user.email?.toLowerCase() ?? null, last_seen: now, last_event: event },
        { onConflict: 'app,external_id' },
      );
  } catch {
    /* ignore */
  }
}
