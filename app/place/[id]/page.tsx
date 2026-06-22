import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';
import PlaceDetail from './PlaceDetail';

interface Props {
  params: { id: string };
}

// Resolve either a UUID or a seed slug ("plaka-athens" → external_id "seed:plaka-athens").
async function loadPlace(idOrSlug: string) {
  const sb = supabaseAdmin();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  const col = isUuid ? 'id' : 'external_id';
  const value = isUuid ? idOrSlug : `seed:${idOrSlug}`;
  const { data } = await sb.from('places').select('*').eq(col, value).maybeSingle();
  return data;
}

async function loadReviews(placeId: string) {
  const sb = supabaseAdmin();
  const { data } = await sb
    .from('reviews')
    .select('id, rating, body, created_at, users:users(username, avatar_url)')
    .eq('place_id', placeId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const place: any = await loadPlace(params.id);
    if (!place) return { title: 'Place not found — Smoking' };
    const where = [place.neighborhood, place.city, place.country].filter(Boolean).join(', ');
    const title = `${place.name}${where ? ` · ${where}` : ''} — Smoking`;
    const description =
      place.description ||
      `${place.name}${where ? ` in ${where}` : ''} — a ${String(place.type).replace('_', ' ')} on Smoking, the reader-kept field guide to places where you can still light up.`;
    return {
      title,
      description,
      alternates: { canonical: `/place/${params.id}` },
      openGraph: {
        title,
        description,
        type: 'website',
        url: `/place/${params.id}`,
        images: place.photo_url ? [{ url: place.photo_url }] : undefined,
      },
      twitter: {
        card: place.photo_url ? 'summary_large_image' : 'summary',
        title,
        description,
      },
    };
  } catch {
    return { title: 'Place — Smoking' };
  }
}

export default async function Page({ params }: Props) {
  let place: any = null;
  let reviews: any[] = [];
  let envErr = '';

  try {
    place = await loadPlace(params.id);
    if (place) reviews = await loadReviews(place.id);
  } catch (e: any) {
    envErr = e.message ?? String(e);
  }

  if (envErr) {
    return (
      <main className="wrap" style={{ maxWidth: 720, padding: '64px 24px' }}>
        <a href="/" style={{ fontSize: 13, opacity: 0.7 }}>← Back</a>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 36, marginTop: 24 }}>Database not configured</h1>
        <p style={{ marginTop: 16, lineHeight: 1.6 }}>
          The place lookup needs Supabase. See <code>SETUP_SUPABASE.md</code> in the repo root, then
          run <code>npm run seed:places</code>.
        </p>
        <pre style={{ marginTop: 16, padding: 12, background: 'var(--card)', fontSize: 12, overflowX: 'auto' }}>{envErr}</pre>
      </main>
    );
  }

  if (!place) notFound();

  return <PlaceDetail place={place} reviews={reviews} />;
}
