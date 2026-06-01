'use client';

import { useEffect, useState } from 'react';

interface Props {
  lat: number;
  lng: number;
  /** Search radius in degrees (default ~50m at the equator). */
  radius?: number;
}

interface MapillaryImage {
  id: string;
  thumb_1024_url?: string;
  captured_at?: number;
}

// Mapillary Graph API (anonymous, free tier): https://www.mapillary.com/developer/api-documentation
// We use a public client token via env var. Without it, the component shows
// nothing — Mapillary returns 401 for unauthenticated calls.
//
// Get a token at https://www.mapillary.com/dashboard/developers (5 min, free).
// Set NEXT_PUBLIC_MAPILLARY_CLIENT_TOKEN in .env.local.

export default function MapillaryEmbed({ lat, lng, radius = 0.0005 }: Props) {
  const [img, setImg] = useState<MapillaryImage | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'found' | 'empty' | 'noconfig' | 'error'>('idle');

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPILLARY_CLIENT_TOKEN;
    if (!token) { setState('noconfig'); return; }

    setState('loading');
    const ctl = new AbortController();
    const bbox = `${lng - radius},${lat - radius},${lng + radius},${lat + radius}`;
    const url = `https://graph.mapillary.com/images?access_token=${token}&fields=id,thumb_1024_url,captured_at&bbox=${bbox}&limit=1`;
    fetch(url, { signal: ctl.signal })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then((j) => {
        const first = j?.data?.[0];
        if (first) { setImg(first); setState('found'); }
        else setState('empty');
      })
      .catch((e) => { if (e.name !== 'AbortError') setState('error'); });
    return () => ctl.abort();
  }, [lat, lng, radius]);

  if (state === 'noconfig') return null; // silent — feature is optional
  if (state === 'loading') {
    return (
      <div style={{ padding: 16, fontSize: 13, color: 'var(--muted)' }}>
        Looking for street view…
      </div>
    );
  }
  if (state === 'empty' || state === 'error') {
    return (
      <div style={{ padding: 16, fontSize: 13, color: 'var(--muted)' }}>
        No street-level imagery near this point.
      </div>
    );
  }
  if (!img) return null;

  const date = img.captured_at ? new Date(img.captured_at).toLocaleDateString() : null;

  return (
    <figure style={{ margin: 0, border: '1px solid var(--hair)', borderRadius: 8, overflow: 'hidden' }}>
      <a
        href={`https://www.mapillary.com/app/?focus=photo&pKey=${img.id}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'block' }}
      >
        <img src={img.thumb_1024_url} alt="Street-level imagery near this place" style={{ width: '100%', display: 'block' }} />
      </a>
      <figcaption style={{ padding: 8, fontSize: 12, color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
        <span>Mapillary{date ? ` · ${date}` : ''}</span>
        <a
          href={`https://www.mapillary.com/app/?focus=photo&pKey=${img.id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'underline' }}
        >
          Open full viewer ↗
        </a>
      </figcaption>
    </figure>
  );
}
