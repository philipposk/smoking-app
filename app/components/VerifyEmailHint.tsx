'use client';

import { useState } from 'react';

// Shown when a write request returns 403 because the user's email isn't
// verified yet. One-click resend, optimistic feedback.
export default function VerifyEmailHint({ message }: { message: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [err, setErr] = useState('');

  const resend = async () => {
    if (state === 'sending' || state === 'sent') return;
    setState('sending');
    setErr('');
    try {
      const res = await fetch('/api/auth/resend-verify', { method: 'POST' });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(j.error || `Failed (HTTP ${res.status})`);
        setState('error');
        return;
      }
      setState('sent');
    } catch {
      setErr('Network error.');
      setState('error');
    }
  };

  return (
    <div
      role="alert"
      style={{
        background: 'var(--ember-bg)',
        border: '1px solid var(--ember-2)',
        color: 'var(--ink)',
        padding: 12,
        borderRadius: 6,
        marginTop: 12,
        fontSize: 14,
      }}
    >
      <p style={{ margin: 0, marginBottom: 8 }}>{message}</p>
      {state === 'sent' ? (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-2)' }}>
          Sent. Check your inbox (and spam).
        </p>
      ) : (
        <button
          type="button"
          onClick={resend}
          disabled={state === 'sending'}
          className="btn btn-ink"
          style={{ fontSize: 13, padding: '6px 12px' }}
        >
          {state === 'sending' ? 'Sending…' : 'Resend verification email'}
        </button>
      )}
      {err && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ember-2)' }}>{err}</p>}
    </div>
  );
}
