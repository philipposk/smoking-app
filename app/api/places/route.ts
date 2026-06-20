import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { requireWriter, currentUser } from '@/lib/auth/session';
import { writeLimit } from '@/lib/rate-limit';

// Only the columns the list/map/favorites UI actually reads. Excludes heavy
// or private fields (notes, contributed_by, merchant_user_id, timestamps) so
// the map payload stays small once the table grows to tens of thousands of rows.
const LIST_COLUMNS =
  'id,external_id,name,type,lat,lng,country,city,neighborhood,region,description,tags,photo_url,source,verified,merchant_claimed';

const PLACE_TYPES = [
  'spot', 'shop', 'cafe', 'dispensary', 'kiosk', 'convenience', 'bench', 'smoking_area',
] as const;

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const type = p.get('type');
  const country = p.get('country');
  const city = p.get('city');
  const q = p.get('q');
  const externalId = p.get('external_id');
  // Repeatable: ?external_id=seed:a&external_id=seed:b → IN-query.
  const externalIds = p.getAll('external_id');
  const limit = Math.min(parseInt(p.get('limit') ?? '500', 10) || 500, 2000);

  // bbox: minLng,minLat,maxLng,maxLat
  const bbox = p.get('bbox')?.split(',').map(Number);

  // Moderation gate: the public list only shows verified places. Unmoderated
  // user submissions (verified=false) and admin-hidden places stay private.
  // Admins may opt in to seeing everything via ?includeUnverified=1 (used by
  // moderation tooling). Seed/OSM/FSQ rows are all inserted verified=true.
  const wantsUnverified = p.get('includeUnverified') === '1';
  let allowUnverified = false;
  if (wantsUnverified) {
    const u = await currentUser();
    allowUnverified = (u as any)?.role === 'admin';
  }

  let query = supabaseAdmin()
    .from('places')
    .select(LIST_COLUMNS)
    .order('id', { ascending: true })
    .limit(limit);
  if (!allowUnverified) query = query.eq('verified', true);
  if (type) query = query.eq('type', type);
  if (country) query = query.eq('country', country);
  if (city) query = query.eq('city', city);
  if (q) query = query.ilike('name', `%${q}%`);
  if (externalIds.length > 1) query = query.in('external_id', externalIds);
  else if (externalId) query = query.eq('external_id', externalId);
  if (bbox && bbox.length === 4 && bbox.every(Number.isFinite)) {
    const [minLng, minLat, maxLng, maxLat] = bbox;
    query = query
      .gte('lng', minLng).lte('lng', maxLng)
      .gte('lat', minLat).lte('lat', maxLat);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Public verified listings are safe to cache at the CDN edge — this is the
  // hot path (map + list) and is identical for all anonymous callers. The
  // admin "include unverified" view is per-user, so never cache it.
  const headers: Record<string, string> = allowUnverified
    ? { 'Cache-Control': 'private, no-store' }
    : { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' };
  return NextResponse.json({ places: data ?? [] }, { headers });
}

const PostBody = z.object({
  name: z.string().trim().min(1).max(200),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  type: z.enum(PLACE_TYPES),
  description: z.string().max(2000).optional(),
  country: z.string().max(80).optional(),
  city: z.string().max(120).optional(),
  neighborhood: z.string().max(120).optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
  accessible: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
  photo_url: z.string().url().max(500).optional(),
});

export async function POST(request: NextRequest) {
  const blocked = await writeLimit.check(request, 'places');
  if (blocked) return blocked;
  const gate = await requireWriter();
  if ('status' in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const user = gate;

  let body;
  try {
    body = PostBody.parse(await request.json());
  } catch (e: any) {
    return NextResponse.json({ error: 'Invalid input', details: e.errors }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin()
    .from('places')
    .insert({
      ...body,
      source: 'user',
      tags: body.tags ?? [],
      contributed_by: user.id,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ place: data });
}
