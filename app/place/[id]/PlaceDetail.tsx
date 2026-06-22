'use client';

import { useEffect, useState } from 'react';
import MapillaryEmbed from '@/app/components/MapillaryEmbed';

interface Place {
  id: string;
  name: string;
  description: string | null;
  type: string;
  lat: number;
  lng: number;
  country: string | null;
  city: string | null;
  neighborhood: string | null;
  tags: string[];
  verified: boolean;
  merchant_claimed: boolean;
  photo_url: string | null;
  source: string;
}

interface Review {
  id: string;
  rating: number;
  body: string | null;
  created_at: string;
  users?: { username: string; avatar_url: string | null } | null;
}

export default function PlaceDetail({ place, reviews: initialReviews }: { place: Place; reviews: Review[] }) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [user, setUser] = useState<any>(null);
  const [draft, setDraft] = useState({ rating: 5, body: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [flagBusy, setFlagBusy] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [shared, setShared] = useState(false);

  const share = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const data = { title: place.name, text: `${place.name} — a spot on Smoking`, url };
    try {
      if (navigator.share) { await navigator.share(data); return; }
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch { /* user cancelled share — ignore */ }
  };

  useEffect(() => {
    fetch('/api/auth/session').then((r) => r.json()).then((j) => setUser(j.user ?? null)).catch(() => {});
  }, []);

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !user) return;
    setBusy(true);
    setErr('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId: place.id, rating: draft.rating, body: draft.body || undefined }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(j.error || `Failed (HTTP ${res.status})`);
        return;
      }
      // Optimistic prepend / replace own review
      setReviews((rs) => {
        const filtered = rs.filter((r) => r.users?.username !== user.username);
        return [
          {
            id: j.review.id,
            rating: draft.rating,
            body: draft.body || null,
            created_at: new Date().toISOString(),
            users: { username: user.username, avatar_url: user.avatar_url ?? null },
          },
          ...filtered,
        ];
      });
      setDraft({ rating: 5, body: '' });
    } catch {
      setErr('Network error.');
    } finally {
      setBusy(false);
    }
  };

  const flag = async () => {
    if (flagBusy || flagged) return;
    setFlagBusy(true);
    try {
      const res = await fetch('/api/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType: 'place', targetId: place.id, reason: 'user-flag' }),
      });
      if (res.ok) setFlagged(true);
    } catch {} finally {
      setFlagBusy(false);
    }
  };

  return (
    <main className="wrap" style={{ maxWidth: 880, padding: '48px 24px' }}>
      <a href="/" style={{ fontSize: 13, opacity: 0.7 }}>← Back to map</a>

      <header style={{ marginTop: 24, marginBottom: 32 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          {place.country || '—'} · {place.city || place.neighborhood || '—'}
        </div>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(36px, 6vw, 56px)', lineHeight: 1.05, letterSpacing: '-0.01em' }}>
          {place.name}
        </h1>
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <span className="tag">{place.type}</span>
          {place.source && <span className="tag">{place.source}</span>}
          {place.verified && <span className="tag">verified</span>}
          {place.merchant_claimed && <span className="tag">merchant-claimed</span>}
          {avg && <span className="tag">★ {avg} ({reviews.length})</span>}
        </div>
      </header>

      {place.description && <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 32 }}>{place.description}</p>}

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 28, marginBottom: 16 }}>Location</h2>
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>
          {place.lat.toFixed(5)}, {place.lng.toFixed(5)}
        </p>
        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
            target="_blank"
            rel="noreferrer noopener"
            className="btn btn-ink"
            style={{ textDecoration: 'none' }}
          >
            Directions ↗
          </a>
          <button onClick={share} className="btn btn-ghost">
            {shared ? 'Link copied' : 'Share'}
          </button>
          <a
            href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=18/${place.lat}/${place.lng}`}
            target="_blank"
            rel="noreferrer noopener"
            className="btn btn-ghost"
            style={{ textDecoration: 'none' }}
          >
            OpenStreetMap ↗
          </a>
        </div>
        <div style={{ marginTop: 16 }}>
          <MapillaryEmbed lat={place.lat} lng={place.lng} />
        </div>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: 28, marginBottom: 16 }}>
          Reviews ({reviews.length})
        </h2>

        {user ? (
          <form onSubmit={submitReview} style={{ marginBottom: 24, padding: 16, border: '1px solid var(--hair)', borderRadius: 8 }}>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 8 }}>Your rating</label>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setDraft({ ...draft, rating: n })}
                  style={{
                    width: 32, height: 32, border: '1px solid var(--hair)', background: draft.rating >= n ? 'var(--ember)' : 'transparent',
                    color: draft.rating >= n ? 'var(--paper)' : 'var(--ink)', borderRadius: 4, cursor: 'pointer',
                  }}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              rows={3}
              placeholder="Optional: what was it actually like?"
              style={{ width: '100%', padding: 8, border: '1px solid var(--hair)', borderRadius: 4, fontFamily: 'inherit' }}
            />
            {err && <p style={{ color: 'var(--ember-2)', fontSize: 14, marginTop: 8 }}>{err}</p>}
            <button type="submit" className="btn btn-ink" disabled={busy} style={{ marginTop: 12 }}>
              {busy ? '…' : 'Post review'}
            </button>
          </form>
        ) : (
          <p style={{ marginBottom: 24, color: 'var(--muted)' }}>Sign in to leave a review.</p>
        )}

        {reviews.length === 0 && <p style={{ color: 'var(--muted)' }}>No reviews yet.</p>}
        {reviews.map((r) => (
          <article key={r.id} style={{ borderTop: '1px solid var(--hair)', padding: '16px 0' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginBottom: 4 }}>
              <strong>@{r.users?.username ?? 'anon'}</strong>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>★ {r.rating}</span>
              <span style={{ fontSize: 13, color: 'var(--muted)', marginLeft: 'auto' }}>
                {new Date(r.created_at).toLocaleDateString()}
              </span>
            </div>
            {r.body && <p>{r.body}</p>}
          </article>
        ))}
      </section>

      <section style={{ marginBottom: 48, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={flag} disabled={flagBusy || flagged} className="btn btn-ghost">
          {flagged ? 'Flagged for review' : flagBusy ? '…' : '⚑ Flag inaccurate listing'}
        </button>
      </section>
    </main>
  );
}
