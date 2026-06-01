import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { currentUser } from '@/lib/auth/session';

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ favorites: [] });

  const { data, error } = await supabaseAdmin()
    .from('favorites')
    .select('place_id, created_at, places:places(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ favorites: data ?? [] });
}

const Body = z.object({ placeId: z.string().uuid() });

export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let parsed;
  try {
    parsed = Body.parse(await request.json());
  } catch (e: any) {
    return NextResponse.json({ error: 'Invalid input', details: e.errors }, { status: 400 });
  }

  const { error } = await supabaseAdmin()
    .from('favorites')
    .upsert({ user_id: user.id, place_id: parsed.placeId }, { onConflict: 'user_id,place_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const placeId = request.nextUrl.searchParams.get('placeId');
  if (!placeId) return NextResponse.json({ error: 'placeId required' }, { status: 400 });

  const { error } = await supabaseAdmin()
    .from('favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('place_id', placeId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
