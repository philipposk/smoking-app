import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Age verification — Smoking',
  robots: { index: false, follow: false },
};

const LEAVE_URL = 'https://www.who.int/news-room/fact-sheets/detail/tobacco';

export default function AgeGatePage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  // Allowlist: only paths starting with "/" and not "//" pass through.
  const raw = searchParams?.next ?? '/';
  const next = typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/';

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: 'var(--paper, #EFEAE0)',
        color: 'var(--ink, #1A1814)',
        fontFamily: 'var(--sans, system-ui, sans-serif)',
      }}
    >
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <div
          style={{
            fontFamily: 'var(--mono, ui-monospace, monospace)',
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--muted, #7A7065)',
            marginBottom: 24,
          }}
        >
          Age verification · 18+
        </div>
        <h1
          style={{
            fontFamily: 'var(--serif, "Instrument Serif", serif)',
            fontSize: 'clamp(32px, 5vw, 44px)',
            lineHeight: 1.05,
            letterSpacing: '-0.01em',
            marginBottom: 16,
          }}
        >
          Are you of legal smoking age?
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--ink-2, #3F3A33)', marginBottom: 28 }}>
          This is a directory of places where smoking is socially or legally
          permitted. It is intended for adults at or above the legal smoking
          age in their jurisdiction. We do not sell tobacco, nicotine, or
          cannabis products.
        </p>

        <form method="POST" action="/api/age-gate" style={{ display: 'inline' }}>
          <input type="hidden" name="next" value={next} />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href={LEAVE_URL}
              style={{
                padding: '12px 22px',
                border: '1px solid var(--hair, rgba(26,24,20,0.14))',
                background: 'transparent',
                color: 'inherit',
                fontFamily: 'inherit',
                borderRadius: 999,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              Leave
            </a>
            <button
              type="submit"
              style={{
                padding: '12px 22px',
                border: '1px solid var(--ink, #1A1814)',
                background: 'var(--ink, #1A1814)',
                color: 'var(--paper, #EFEAE0)',
                fontFamily: 'inherit',
                borderRadius: 999,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              I am of legal age — enter
            </button>
          </div>
        </form>

        <p style={{ fontSize: 12, color: 'var(--muted, #7A7065)', marginTop: 24 }}>
          By entering you confirm you meet the minimum age and accept our{' '}
          <a href="/terms" style={{ textDecoration: 'underline' }}>Terms</a> and{' '}
          <a href="/privacy" style={{ textDecoration: 'underline' }}>Privacy Policy</a>.
        </p>
      </div>
    </main>
  );
}
