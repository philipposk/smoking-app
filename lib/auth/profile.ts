import { supabaseAdmin } from '@/lib/supabase/admin';
import { TABLES } from '@/lib/supabase/tables';
import { PROFILE_COLS } from '@/lib/auth/session';
import type { User } from '@/lib/supabase/types';

/**
 * Smoking profile for a shared-login account. Creates one on first visit for people
 * who already have a 6x7 account from another app (username derived from email).
 */
export async function ensureProfile(
  authUser: { id: string; email?: string | null; email_confirmed_at?: string | null },
  wantedUsername?: string,
): Promise<User | null> {
  const sb = supabaseAdmin();
  const { data: existing } = await sb.from(TABLES.users).select(PROFILE_COLS).eq('auth_user_id', authUser.id).maybeSingle();
  if (existing) return existing as unknown as User;

  const email = (authUser.email ?? '').toLowerCase();
  const base = (wantedUsername || email.split('@')[0] || 'user').replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 24) || 'user';
  for (let i = 0; i < 5; i++) {
    const username = i === 0 ? base : `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    const { data, error } = await sb
      .from(TABLES.users)
      .insert({
        id: authUser.id,
        auth_user_id: authUser.id,
        username,
        email,
        password_hash: null,
        email_verified: !!authUser.email_confirmed_at,
      })
      .select(PROFILE_COLS)
      .single();
    if (!error && data) return data as unknown as User;
    if (error && !/duplicate key.*username/i.test(error.message)) {
      console.error('ensureProfile failed:', error.message);
      return null;
    }
  }
  return null;
}
