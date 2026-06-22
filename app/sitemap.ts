import type { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Dynamic sitemap: static routes + the most recent verified place pages.
// Degrades to just the static routes if Supabase isn't configured.
export const revalidate = 3600;

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://smoking.6x7.gr').replace(/\/$/, '');
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/map`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ];

  try {
    // Cap at 5,000 (sitemap files allow 50k; keep it light and add an index later
    // if the catalog grows). Newest verified places first.
    const { data } = await supabaseAdmin()
      .from('places')
      .select('id, updated_at')
      .eq('verified', true)
      .order('updated_at', { ascending: false })
      .limit(5000);

    const placeRoutes: MetadataRoute.Sitemap = (data ?? []).map((p: any) => ({
      url: `${base}/place/${p.id}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    return [...staticRoutes, ...placeRoutes];
  } catch {
    return staticRoutes;
  }
}
