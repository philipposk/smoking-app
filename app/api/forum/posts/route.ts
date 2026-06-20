import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireWriter } from '@/lib/auth/session';
import { writeLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const search = p.get('search');
  const category = p.get('category');
  const limit = Math.min(parseInt(p.get('limit') ?? '50', 10) || 50, 200);

  let q = supabaseAdmin()
    .from('forum_posts')
    .select('id, user_id, title, body, category, created_at, users:users(username, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (category) q = q.eq('category', category);
  if (search) {
    // PostgREST .or() takes a raw filter string, so unsanitized input could
    // inject extra filters or break parsing via commas/parens/operators. Strip
    // characters with meaning in or-filter syntax and SQL LIKE wildcards.
    const safe = search.replace(/[,()*:%_\\]/g, ' ').trim().slice(0, 100);
    if (safe) q = q.or(`title.ilike.%${safe}%,body.ilike.%${safe}%`);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data ?? [] });
}

const Body = z.object({
  title: z.string().trim().min(3).max(200),
  body: z.string().trim().min(1).max(10_000),
  category: z.string().max(40).optional(),
});

export async function POST(request: NextRequest) {
  const blocked = writeLimit.check(request, 'forum-post');
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
    .from('forum_posts')
    .insert({ ...parsed, user_id: user.id })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}
