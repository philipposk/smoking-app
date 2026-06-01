'use client';

import { useEffect, useState } from 'react';

const COOKIE = 'age_ok';
const COOKIE_DAYS = 365;
const LEAVE_URL = 'https://www.who.int/news-room/fact-sheets/detail/tobacco';

function setAgeCookie() {
  const max = COOKIE_DAYS * 86400;
  document.cookie = `${COOKIE}=1; max-age=${max}; path=/; samesite=lax`;
}

function hasAgeCookie() {
  if (typeof document === 'undefined') return false;
  return document.cookie.split(';').some((c) => c.trim().startsWith(`${COOKIE}=1`));
}

export default function AgeGate({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    setOk(hasAgeCookie());
  }, []);

  if (ok === null) {
    // Avoid flashing the gate or the app during the first paint.
    return null;
  }

  if (!ok) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Age verification"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--paper, #EFEAE0)',
          color: 'var(--ink, #1A1814)',
          zIndex: 9999,
          display: 'grid',
          placeItems: 'center',
          padding: '24px',
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
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => { window.location.href = LEAVE_URL; }}
              style={{
                padding: '12px 22px',
                border: '1px solid var(--hair, rgba(26,24,20,0.14))',
                background: 'transparent',
                color: 'inherit',
                fontFamily: 'inherit',
                borderRadius: 999,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Leave
            </button>
            <button
              onClick={() => { setAgeCookie(); setOk(true); }}
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
          <p style={{ fontSize: 12, color: 'var(--muted, #7A7065)', marginTop: 24 }}>
            By entering you confirm you meet the minimum age and accept our{' '}
            <a href="/terms" style={{ textDecoration: 'underline' }}>Terms</a> and{' '}
            <a href="/privacy" style={{ textDecoration: 'underline' }}>Privacy Policy</a>.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
