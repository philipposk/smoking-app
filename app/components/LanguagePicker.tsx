'use client';

import { useLocale } from 'next-intl';
import { LOCALES, LOCALE_LABELS, type Locale } from '@/i18n/locales';
import { useState } from 'react';

// Compact dropdown that POSTs to /api/locale and reloads.
// next-intl resolves the new locale from the cookie on the next request.
export default function LanguagePicker() {
  const current = useLocale() as Locale;
  const [busy, setBusy] = useState(false);

  const onChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as Locale;
    if (next === current || busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: next }),
      });
      if (res.ok) window.location.reload();
      else setBusy(false);
    } catch {
      setBusy(false);
    }
  };

  return (
    <select
      value={current}
      onChange={onChange}
      disabled={busy}
      aria-label="Language"
      title="Language"
      style={{
        padding: '4px 8px',
        fontSize: 12,
        border: '1px solid var(--hair)',
        borderRadius: 999,
        background: 'transparent',
        color: 'inherit',
        fontFamily: 'inherit',
        cursor: 'pointer',
      }}
    >
      {LOCALES.map((l) => (
        <option key={l} value={l}>{LOCALE_LABELS[l]}</option>
      ))}
    </select>
  );
}
