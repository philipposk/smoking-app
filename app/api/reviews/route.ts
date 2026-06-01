import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { currentUser, requireWriter } from '@/lib/auth/session';
import { writeLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const placeId = request.nextUrl.searchParams.get('placeId');
  let q = supabaseAdmin()
    .from('reviews')
    .select('id, place_id, user_id, rating, body, created_at, users:users(username, avatar_url)')
    .order('created_at', { ascending: false });
  if (placeId) q = q.eq('place_id', placeId);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data ?? [] });
}

const Body = z.object({
  placeId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  body: z.string().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  const blocked = writeLimit.check(request, 'review');
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

  // Upsert so a user can update their existing review
  const { data, error } = await supabaseAdmin()
    .from('reviews')
    .upsert(
      { place_id: parsed.placeId, user_id: user.id, rating: parsed.rating, body: parsed.body ?? null },
      { onConflict: 'place_id,user_id' },
    )
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ review: data });
}

export async function DELETE(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const placeId = request.nextUrl.searchParams.get('placeId');
  if (!placeId) return NextResponse.json({ error: 'placeId required' }, { status: 400 });

  const { error } = await supabaseAdmin()
    .from('reviews')
    .delete()
    .eq('place_id', placeId)
    .eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
