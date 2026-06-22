import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://smoking.6x7.gr').replace(/\/$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/place/', '/privacy', '/terms'],
        // The age-gated interactive views and APIs aren't useful to index.
        disallow: ['/api/', '/admin/', '/age-gate'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
