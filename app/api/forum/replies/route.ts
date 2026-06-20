import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireWriter } from '@/lib/auth/session';
import { writeLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const postId = p.get('postId');
  const limit = Math.min(parseInt(p.get('limit') ?? '100', 10) || 100, 200);
  const offset = Math.max(parseInt(p.get('offset') ?? '0', 10) || 0, 0);
  let q = supabaseAdmin()
    .from('forum_replies')
    .select('id, post_id, user_id, body, created_at, users:users(username, avatar_url)')
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);
  if (postId) q = q.eq('post_id', postId);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ replies: data ?? [] });
}

const Body = z.object({
  postId: z.string().uuid(),
  body: z.string().trim().min(1).max(10_000),
});

export async function POST(request: NextRequest) {
  const blocked = await writeLimit.check(request, 'forum-reply');
  if (blocked) return blocked;
  const gate = await requireWriter();
  if ('status' in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const user = gate;

  let parsed;
  try {
    parsed = Body.parse(await request.json());
  } catch (e: any) {
    return NextResponse.json({ error: 'Invalid input', details: e.errors }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from('forum_replies')
    .insert({ post_id: parsed.postId, user_id: user.id, body: parsed.body })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reply: data });
}
