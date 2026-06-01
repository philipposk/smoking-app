import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth/session';
import { supabaseAdmin } from '@/lib/supabase/admin';
import AdminQueue from './AdminQueue';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const user = await currentUser();
  if (!user) redirect('/');
  if (user.role !== 'admin') {
    return (
      <main className="wrap" style={{ maxWidth: 600, padding: 64 }}>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 36 }}>Not allowed</h1>
        <p style={{ marginTop: 16 }}>
          Your account does not have moderator privileges. Ask an admin to set
          <code> users.role = &apos;admin&apos; </code> for your row in the Supabase dashboard.
        </p>
      </main>
    );
  }

  const sb = supabaseAdmin();
  const { data: flags } = await sb
    .from('flags')
    .select('*, reporter:users!reporter_user_id(username)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(200);

  return <AdminQueue initialFlags={flags ?? []} />;
}
