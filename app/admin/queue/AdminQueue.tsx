'use client';

import { useState } from 'react';

interface Flag {
  id: string;
  target_type: string;
  target_id: string;
  reason: string | null;
  detail: string | null;
  reporter?: { username: string } | null;
  created_at: string;
  status: string;
}

export default function AdminQueue({ initialFlags }: { initialFlags: Flag[] }) {
  const [flags, setFlags] = useState<Flag[]>(initialFlags);
  const [busy, setBusy] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, string>>({});

  const decide = async (id: string, status: 'reviewed' | 'dismissed' | 'actioned') => {
    setBusy(id);
    setErrorById((e) => ({ ...e, [id]: '' }));
    try {
      const res = await fetch('/api/admin/flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setFlags((f) => f.filter((x) => x.id !== id));
      } else {
        const j = await res.json().catch(() => ({}));
        setErrorById((e) => ({ ...e, [id]: j.error || `HTTP ${res.status}` }));
      }
    } catch {
      setErrorById((e) => ({ ...e, [id]: 'Network error' }));
    } finally {
      setBusy(null);
    }
  };

  // Helper: explain what "Action" does for this target type
  const actionLabel = (type: string) => {
    switch (type) {
      case 'place':       return 'Action (unverify)';
      case 'review':      return 'Action (delete review)';
      case 'forum_post':  return 'Action (delete thread)';
      case 'forum_reply': return 'Action (delete reply)';
      default:            return 'Action';
    }
  };

  return (
    <main className="wrap" style={{ maxWidth: 880, padding: '48px 24px' }}>
      <a href="/" style={{ fontSize: 13, opacity: 0.7 }}>← Back</a>
      <div className="eyebrow" style={{ marginTop: 24, marginBottom: 12 }}>
        Moderation · open flags · {flags.length}
      </div>
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 44, lineHeight: 1.05 }}>Queue</h1>

      {flags.length === 0 && <p style={{ marginTop: 32, color: 'var(--muted)' }}>Inbox zero.</p>}

      {flags.map((f) => (
        <article key={f.id} style={{ borderTop: '1px solid var(--hair)', padding: '20px 0' }}>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
            <span>{f.target_type}</span>
            <span>·</span>
            <span style={{ fontFamily: 'var(--mono)' }}>{f.target_id.slice(0, 8)}…</span>
            <span>·</span>
            <span>reported by @{f.reporter?.username ?? 'unknown'}</span>
            <span style={{ marginLeft: 'auto' }}>{new Date(f.created_at).toLocaleString()}</span>
          </div>
          {f.reason && <p style={{ marginBottom: 4 }}><strong>{f.reason}</strong></p>}
          {f.detail && <p style={{ fontSize: 14, color: 'var(--ink-2)' }}>{f.detail}</p>}
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            {f.target_type === 'place' && (
              <a href={`/place/${f.target_id}`} target="_blank" className="btn btn-ghost" rel="noreferrer">
                View target ↗
              </a>
            )}
            <button onClick={() => decide(f.id, 'dismissed')} disabled={busy === f.id} className="btn btn-ghost">
              Dismiss
            </button>
            <button onClick={() => decide(f.id, 'actioned')} disabled={busy === f.id} className="btn btn-ink">
              {busy === f.id ? '…' : actionLabel(f.target_type)}
            </button>
          </div>
          {errorById[f.id] && (
            <p style={{ color: 'var(--ember-2)', fontSize: 13, marginTop: 8 }}>{errorById[f.id]}</p>
          )}
        </article>
      ))}
    </main>
  );
}
