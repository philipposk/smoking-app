import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Public catalog stats for the homepage hero. Returns real counts so the UI
// never advertises numbers the database can't back up. Degrades to zeros if
// Supabase isn't configured yet, so the homepage still renders.
export const revalidate = 0;

export async function GET() {
  try {
    const sb = supabaseAdmin();
    const [{ data: stats }, { count: notes }] = await Promise.all([
      sb.rpc('place_stats'),
      sb.from('reviews').select('id', { count: 'exact', head: true }),
    ]);

    const row = Array.isArray(stats) ? stats[0] : stats;
    return NextResponse.json(
      {
        places: Number(row?.places ?? 0),
        cities: Number(row?.cities ?? 0),
        countries: Number(row?.countries ?? 0),
        notes: notes ?? 0,
      },
      { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' } },
    );
  } catch {
    // No DB / not configured — honest zeros rather than a 500 that breaks the hero.
    return NextResponse.json({ places: 0, cities: 0, countries: 0, notes: 0 });
  }
}
