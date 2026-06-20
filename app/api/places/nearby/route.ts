import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// /api/places/nearby?lat=..&lng=..&radiusKm=5&limit=50
// Returns places within radius, sorted by haversine distance.
// Uses a bounding-box pre-filter (cheap) then exact distance in app code.

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const lat = parseFloat(p.get('lat') ?? '');
  const lng = parseFloat(p.get('lng') ?? '');
  const radiusKm = Math.min(parseFloat(p.get('radiusKm') ?? '5') || 5, 50);
  const limit = Math.min(parseInt(p.get('limit') ?? '50', 10) || 50, 200);
  const type = p.get('type');

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'lat + lng required' }, { status: 400 });
  }

  // 1° lat ≈ 111 km; 1° lng ≈ 111 * cos(lat) km.
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));

  let q = supabaseAdmin()
    .from('places')
    .select('id,external_id,name,type,lat,lng,country,city,neighborhood,description,photo_url,source,verified')
    .eq('verified', true)
    .gte('lat', lat - dLat).lte('lat', lat + dLat)
    .gte('lng', lng - dLng).lte('lng', lng + dLng)
    .limit(Math.min(limit * 4, 1000));

  if (type) q = q.eq('type', type);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const withDist = (data ?? []).map((row: any) => ({
    ...row,
    distance_km: haversineKm(lat, lng, row.lat, row.lng),
  }));
  withDist.sort((a, b) => a.distance_km - b.distance_km);

  return NextResponse.json({ places: withDist.slice(0, limit) });
}
