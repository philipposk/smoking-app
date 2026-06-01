'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { Map as MlMap, GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  city?: string | null;
  country?: string | null;
}

const TYPE_COLOR: Record<string, string> = {
  shop: '#B9421A',
  bench: '#3F7A52',
  smoking_area: '#7A6FB9',
  cafe: '#C98A2A',
  dispensary: '#4A8BC9',
  kiosk: '#B9421A',
  convenience: '#7A7065',
  spot: '#1A1814',
};

// OpenFreeMap liberty — free, no API key, full vector tiles worldwide.
// Fallback: https://demotiles.maplibre.org/style.json (low detail, for CI).
const STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ??
  'https://tiles.openfreemap.org/styles/liberty';

export default function LiveMap({
  places,
  initialZoom = 1.8,
  initialCenter = [20, 30] as [number, number],
  height = 'calc(100vh - 220px)',
}: {
  places: Place[];
  initialZoom?: number;
  initialCenter?: [number, number];
  height?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Stable geojson reference — prevents redundant data-push effects.
  const geojson = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: places.map((p) => ({
        type: 'Feature' as const,
        properties: {
          id: p.id,
          name: p.name,
          type: p.type,
          color: TYPE_COLOR[p.type] ?? '#B9421A',
          loc: [p.city, p.country].filter(Boolean).join(' · '),
        },
        geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
      })),
    }),
    [places],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let map: MlMap;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: STYLE_URL,
        center: initialCenter,
        zoom: initialZoom,
        attributionControl: { compact: true },
      });
    } catch (e) {
      setLoadError('MapLibre failed to initialise. Check WebGL support.');
      return;
    }

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      'top-right',
    );

    map.on('error', (e) => {
      // Only surface style-load errors; tile 404s are noisy and expected on
      // first paint while the service worker caches responses.
      if ((e as any).sourceId == null) {
        setLoadError(`Map style failed to load. ${(e as any).error?.message ?? ''}`);
      }
    });

    map.on('load', () => {
      setLoadError(null); // clear any transient error on successful load

      map.addSource('places', {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 50,
      });

      // Cluster bubbles
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'places',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step', ['get', 'point_count'],
            '#B9421A', 10, '#8E2F12', 100, '#5A1E0A',
          ],
          'circle-radius': ['step', ['get', 'point_count'], 14, 10, 20, 100, 28],
          'circle-stroke-color': '#EFEAE0',
          'circle-stroke-width': 2,
        },
      });

      // Cluster counts — fonts must exist in the style's glyph set.
      // OpenFreeMap liberty ships 'Open Sans Bold'; demotiles ships nothing,
      // so the layer is skipped gracefully on that fallback.
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'places',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 12,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        },
        paint: { 'text-color': '#EFEAE0' },
      });

      // Individual pins coloured by type
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'places',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': 6,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#EFEAE0',
        },
      });

      // Interactions
      map.on('click', 'clusters', async (e) => {
        const feature = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })[0];
        const clusterId = feature?.properties?.cluster_id;
        if (clusterId == null) return;
        const source = map.getSource('places') as GeoJSONSource;
        const zoom = await source.getClusterExpansionZoom(clusterId);
        map.easeTo({ center: (feature.geometry as any).coordinates, zoom });
      });

      map.on('click', 'unclustered-point', (e) => {
        const f = e.features?.[0] as any;
        if (!f) return;
        new maplibregl.Popup({ offset: 14 })
          .setLngLat(f.geometry.coordinates)
          .setHTML(
            `<div style="font-family:system-ui;font-size:13px;line-height:1.4">
               <div style="font-weight:600">${escapeHtml(f.properties.name)}</div>
               <div style="color:#7A7065;font-size:11px">${escapeHtml(f.properties.loc ?? '')} · ${escapeHtml(f.properties.type)}</div>
               <a href="/place/${encodeURIComponent(f.properties.id)}" style="color:#B9421A;text-decoration:underline;font-size:12px;display:inline-block;margin-top:4px">Open ↗</a>
             </div>`,
          )
          .addTo(map);
      });

      (['clusters', 'unclustered-point'] as const).forEach((id) => {
        map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', id, () => { map.getCanvas().style.cursor = ''; });
      });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push updated places data without rebuilding the map instance.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const push = () => {
      const src = map.getSource('places') as GeoJSONSource | undefined;
      if (src) src.setData(geojson as any);
    };
    if (map.isStyleLoaded()) push();
    else map.once('load', push);
  }, [geojson]);

  return (
    <div style={{ position: 'relative', width: '100%', height, minHeight: 400 }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', background: 'var(--card)' }}
      />
      {loadError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--paper)',
            color: 'var(--ink)',
            fontFamily: 'var(--sans)',
            gap: 12,
            padding: 32,
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: 32 }}>🗺️</span>
          <p style={{ fontWeight: 600, margin: 0 }}>Map unavailable</p>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, maxWidth: 340 }}>{loadError}</p>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 13, marginTop: 8 }}
            onClick={() => { setLoadError(null); mapRef.current?.remove(); mapRef.current = null; }}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

function escapeHtml(s: string) {
  return String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!),
  );
}
