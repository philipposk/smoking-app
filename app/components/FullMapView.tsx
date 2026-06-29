'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import LiveMap from './LiveMap';

interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  city?: string | null;
  country?: string | null;
  source?: string;
  verified?: boolean;
}

// Seed places shown when the API returns nothing (Supabase not wired yet).
const SEED: Place[] = [
  { id: 'golden-gai',         name: 'Golden Gai',                     lat: 35.6938,  lng: 139.7036,  type: 'spot',   city: 'Tokyo',       country: 'Japan' },
  { id: 'lisbon-miradouro',   name: 'Miradouro da Senhora do Monte',   lat: 38.7191,  lng: -9.1322,   type: 'spot',   city: 'Lisbon',      country: 'Portugal' },
  { id: 'kreuzberg-park',     name: 'Görlitzer Park',                  lat: 52.4956,  lng: 13.4378,   type: 'bench',  city: 'Berlin',      country: 'Germany' },
  { id: 'plaka-athens',       name: 'Plaka District',                  lat: 37.9710,  lng: 23.7267,   type: 'spot',   city: 'Athens',      country: 'Greece' },
  { id: 'buenos-aires-dorrego', name: 'Plaza Dorrego',                 lat: -34.6213, lng: -58.3731,  type: 'spot',   city: 'Buenos Aires',country: 'Argentina' },
  { id: 'cafe-toscano',       name: 'Café Toscano',                    lat: 19.4146,  lng: -99.1635,  type: 'cafe',   city: 'Mexico City', country: 'Mexico' },
  { id: 'le-jardin-marrakech',name: 'Le Jardin',                       lat: 31.6316,  lng: -7.9897,   type: 'spot',   city: 'Marrakech',   country: 'Morocco' },
  { id: 'mar-mikhael',        name: 'Mar Mikhael Rooftops',            lat: 33.8903,  lng: 35.5213,   type: 'spot',   city: 'Beirut',      country: 'Lebanon' },
  { id: 'place-des-vosges',   name: 'Place des Vosges',                lat: 48.8553,  lng: 2.3635,    type: 'spot',   city: 'Paris',       country: 'France' },
];

const TYPE_FILTERS = [
  ['all',          'All'],
  ['shop',         'Shops'],
  ['bench',        'Benches'],
  ['smoking_area', 'Smoking areas'],
  ['cafe',         'Cafés'],
  ['kiosk',        'Kiosks'],
  ['spot',         'Spots'],
] as const;

export default function FullMapView() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'seed'>('loading');
  const [places, setPlaces] = useState<Place[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const statusRef = useRef(status);
  statusRef.current = status;
  const bboxAbort = useRef<AbortController | null>(null);

  // As the user pans/zooms, fetch only the places in the current viewport.
  // This is what lets the map scale past a few thousand markers. Skipped when
  // there's no live DB (seed mode) — the 9 seed places stay put.
  const onBoundsChange = useCallback((bbox: [number, number, number, number]) => {
    if (statusRef.current !== 'ok') return;
    const [w, s, e, n] = bbox;
    bboxAbort.current?.abort();
    const ctrl = new AbortController();
    bboxAbort.current = ctrl;
    fetch(`/api/places?bbox=${w},${s},${e},${n}&limit=1500`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.places) setPlaces(j.places); })
      .catch(() => {}); // aborted or network — ignore
  }, []);

  useEffect(() => {
    let alive = true;
    fetch('/api/places?limit=2000')
      .then((r) => r.json().catch(() => null).then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!alive) return;
        const rows: Place[] = ok && j?.places?.length ? j.places : [];
        if (rows.length > 0) {
          setPlaces(rows);
          setStatus('ok');
        } else {
          setPlaces(SEED);
          setStatus('seed');
        }
      })
      .catch(() => {
        if (!alive) return;
        setPlaces(SEED);
        setStatus('seed');
      });
    return () => { alive = false; };
  }, []);

  const visible = useMemo(
    () => typeFilter === 'all' ? places : places.filter((p) => p.type === typeFilter),
    [places, typeFilter],
  );

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const p of places) c[p.type] = (c[p.type] ?? 0) + 1;
    return c;
  }, [places]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--paper)' }}>
      {/* Header bar */}
      <div style={{
        borderBottom: '1px solid var(--hair)',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
        flexShrink: 0,
      }}>
        <a href="/" style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', textDecoration: 'none', color: 'inherit', opacity: 0.5 }}>
          ← Smoking
        </a>
        <span style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>
          {status === 'loading' && 'Loading…'}
          {status === 'seed'    && `${visible.length} editorial spots · no live data`}
          {status === 'ok'      && `${visible.length.toLocaleString()} of ${places.length.toLocaleString()} places`}
        </span>
        {/* Type filter chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginLeft: 'auto' }}>
          {TYPE_FILTERS.map(([key, label]) => {
            const count = key === 'all' ? places.length : (typeCounts[key] ?? 0);
            if (count === 0 && key !== 'all') return null;
            return (
              <button
                key={key}
                className={`chip${typeFilter === key ? ' active' : ''}`}
                onClick={() => setTypeFilter(key)}
                style={{ fontSize: 12 }}
              >
                {label}{key !== 'all' ? ` · ${count}` : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* Full-bleed map */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {status !== 'loading' && (
          <LiveMap
            places={visible}
            initialZoom={2}
            initialCenter={[20, 20]}
            height="100%"
            onBoundsChange={onBoundsChange}
          />
        )}
      </div>

      {status === 'seed' && (
        <div style={{
          position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--ink)', color: 'var(--paper)', borderRadius: 999,
          padding: '8px 16px', fontSize: 12, fontFamily: 'var(--sans)', opacity: 0.85,
          pointerEvents: 'none',
        }}>
          Showing 9 seed spots · configure Supabase + run scraper for live data
        </div>
      )}
    </div>
  );
}
