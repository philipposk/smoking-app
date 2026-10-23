import type { Metadata } from 'next';

// Public landing rendered at `/` (via a middleware rewrite) for visitors who
// haven't confirmed their age yet, and for search engines. It describes the
// app; the interactive map stays behind the age gate.

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://smoking.6x7.gr').replace(/\/$/, '');
const DESCRIPTION =
  'Smoking is a free field guide to places where smoking is allowed: smoke shops, terraces, courtyards, lookouts, kiosks and benches, with a live map, photos and reviews from adults who use them.';

export const metadata: Metadata = {
  title: 'Smoking — A field guide to places where you can still light up',
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Smoking',
    title: 'Smoking — A field guide to places where you can still light up',
    description: DESCRIPTION,
  },
};

const FEATURES = [
  { title: 'Live map', body: 'Find smoke-friendly terraces, courtyards, kiosks and smoke shops near you on a live map.' },
  { title: 'Real places, checked', body: 'Listings come from open map data and are verified, with photos and reviews from the community.' },
  { title: 'Add what you know', body: 'Suggest a spot, add a photo or leave a review so the guide stays current.' },
  { title: 'In your language', body: 'The guide works in several languages and in light or dark mode.' },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Smoking',
  url: `${SITE_URL}/`,
  description: DESCRIPTION,
  applicationCategory: 'TravelApplication',
  operatingSystem: 'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  audience: { '@type': 'PeopleAudience', suggestedMinAge: 18 },
};

export default function WelcomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '64px 24px',
        background: 'var(--paper, #EFEAE0)',
        color: 'var(--ink, #1A1814)',
        fontFamily: 'var(--sans, system-ui, sans-serif)',
      }}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <p
          style={{
            fontFamily: 'var(--mono, ui-monospace, monospace)',
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--muted, #7A7065)',
            marginBottom: 20,
          }}
        >
          Smoking · a field guide · 18+
        </p>
        <h1
          style={{
            fontFamily: 'var(--serif, "Instrument Serif", serif)',
            fontSize: 'clamp(36px, 6vw, 56px)',
            lineHeight: 1.05,
            letterSpacing: '-0.01em',
            marginBottom: 20,
          }}
        >
          Places where you can still light up.
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--ink-2, #3F3A33)', marginBottom: 32, maxWidth: 600 }}>
          {DESCRIPTION}
        </p>
        <a
          href="/age-gate?next=%2F"
          style={{
            display: 'inline-block',
            padding: '12px 22px',
            border: '1px solid var(--ink, #1A1814)',
            background: 'var(--ink, #1A1814)',
            color: 'var(--paper, #EFEAE0)',
            borderRadius: 999,
            fontSize: 15,
            textDecoration: 'none',
          }}
        >
          Open the guide (18+)
        </a>

        <h2 style={{ fontFamily: 'var(--serif, serif)', fontSize: 28, margin: '56px 0 16px' }}>What you get</h2>
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {FEATURES.map((f) => (
            <li key={f.title} style={{ border: '1px solid var(--hair, rgba(26,24,20,0.14))', borderRadius: 16, padding: 20 }}>
              <h3 style={{ fontSize: 16, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink-2, #3F3A33)' }}>{f.body}</p>
            </li>
          ))}
        </ul>

        <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--muted, #7A7065)', marginTop: 48 }}>
          Smoking is for adults at or above the legal smoking age where they live. We don&rsquo;t sell tobacco,
          nicotine or cannabis products. Smoking harms your health.{' '}
          <a href="/terms" style={{ textDecoration: 'underline', color: 'inherit' }}>Terms</a> ·{' '}
          <a href="/privacy" style={{ textDecoration: 'underline', color: 'inherit' }}>Privacy</a>
        </p>
      </div>
    </main>
  );
}
