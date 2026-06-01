import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { currentUser } from '@/lib/auth/session';

async function requireAdmin() {
  const user = await currentUser();
  if (!user) return { user: null, deny: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (user.role !== 'admin') return { user, deny: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { user, deny: null };
}

export async function GET(request: NextRequest) {
  const { deny } = await requireAdmin();
  if (deny) return deny;
  const status = request.nextUrl.searchParams.get('status') ?? 'open';
  const { data, error } = await supabaseAdmin()
    .from('flags')
    .select('*, reporter:users!reporter_user_id(username)')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ flags: data ?? [] });
}

const PatchBody = z.object({
  id: z.string().uuid(),
  status: z.enum(['reviewed', 'dismissed', 'actioned']),
});

// status=actioned also acts on the underlying target:
//   place         → verified=false (soft hide; OSM data not lost)
//   review        → hard delete
//   forum_post    → hard delete (cascades replies)
//   forum_reply   → hard delete
//   user          → role unchanged here; account suspension is a separate flow.
async function actOnTarget(sb: ReturnType<typeof supabaseAdmin>, type: string, id: string) {
  switch (type) {
    case 'place':
      return sb.from('places').update({ verified: false }).eq('id', id);
    case 'review':
      return sb.from('reviews').delete().eq('id', id);
    case 'forum_post':
      return sb.from('forum_posts').delete().eq('id', id);
    case 'forum_reply':
      return sb.from('forum_replies').delete().eq('id', id);
    default:
      return { error: null };
  }
}

export async function PATCH(request: NextRequest) {
  const { user, deny } = await requireAdmin();
  if (deny) return deny;
  let body;
  try { body = PatchBody.parse(await request.json()); }
  catch (e: any) { return NextResponse.json({ error: 'Invalid input', details: e.errors }, { status: 400 }); }

  const sb = supabaseAdmin();

  // Load the flag first to know what target to act on.
  const { data: flag, error: loadErr } = await sb
    .from('flags')
    .select('target_type, target_id')
    .eq('id', body.id)
    .maybeSingle();
  if (loadErr || !flag) {
    return NextResponse.json({ error: loadErr?.message ?? 'Flag not found' }, { status: 404 });
  }

  if (body.status === 'actioned') {
    const { error: actErr } = await actOnTarget(sb, (flag as any).target_type, (flag as any).target_id);
    if (actErr) return NextResponse.json({ error: `Action failed: ${actErr.message}` }, { status: 500 });
  }

  const { data, error } = await sb
    .from('flags')
    .update({
      status: body.status,
      reviewed_by: user!.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', body.id)
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ flag: data });
}
