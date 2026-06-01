/**
 * Scrape OpenStreetMap via the Overpass API for:
 *   - shop=tobacco                 → type: "shop"
 *   - amenity=bench                → type: "bench"
 *   - amenity=smoking_area         → type: "smoking_area"
 *
 * Run city-by-city to stay within Overpass rate limits.
 * Each result is upserted into public.places with external_id = osm:<type>/<id>,
 * so re-runs are idempotent.
 *
 *   npm run scrape:osm                 # all cities
 *   npm run scrape:osm -- athens tokyo # specific cities
 */

import { adminClient } from './lib/db';
import { CITIES, City } from './cities';

const OVERPASS_URL = process.env.OVERPASS_URL ?? 'https://overpass-api.de/api/interpreter';
const SLEEP_MS = 2_000; // be polite

type OsmEl = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function placeTypeFor(tags: Record<string, string>): string | null {
  if (tags.shop === 'tobacco') return 'shop';
  if (tags.amenity === 'bench') return 'bench';
  if (tags.amenity === 'smoking_area') return 'smoking_area';
  return null;
}

function queryFor(city: City): string {
  const [minLng, minLat, maxLng, maxLat] = city.bbox;
  // Overpass bbox is south,west,north,east
  const bbox = `${minLat},${minLng},${maxLat},${maxLng}`;
  return `
    [out:json][timeout:90];
    (
      node["shop"="tobacco"](${bbox});
      way["shop"="tobacco"](${bbox});
      node["amenity"="bench"](${bbox});
      node["amenity"="smoking_area"](${bbox});
      way["amenity"="smoking_area"](${bbox});
    );
    out center tags;
  `;
}

async function fetchOverpass(query: string): Promise<OsmEl[]> {
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(query),
  });
  if (!res.ok) {
    throw new Error(`Overpass ${res.status}: ${await res.text().catch(() => '')}`);
  }
  const json = await res.json();
  return (json.elements ?? []) as OsmEl[];
}

async function scrapeCity(city: City) {
  console.log(`[osm] ${city.name} (${city.country})`);
  const els = await fetchOverpass(queryFor(city));
  console.log(`  -> ${els.length} elements`);

  const rows = els.flatMap((el) => {
    const tags = el.tags ?? {};
    const type = placeTypeFor(tags);
    if (!type) return [];
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat == null || lng == null) return [];
    const name =
      tags.name ??
      (type === 'shop' ? 'Tobacco shop'
        : type === 'bench' ? 'Bench'
        : 'Smoking area');
    return [{
      external_id: `osm:${el.type}/${el.id}`,
      source: 'osm',
      name,
      type,
      lat,
      lng,
      country: city.country,
      city: city.name,
      region: city.region,
      tags: Object.entries(tags).slice(0, 20).map(([k, v]) => `${k}=${v}`),
      verified: true,
    }];
  });

  if (rows.length === 0) return;

  const sb = adminClient();
  // Chunk to avoid massive payloads
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const { error } = await sb
      .from('places')
      .upsert(chunk, { onConflict: 'external_id', ignoreDuplicates: false });
    if (error) {
      console.error(`  ! upsert error: ${error.message}`);
      break;
    }
  }
  console.log(`  ok: upserted ${rows.length} places`);
}

async function main() {
  const slugs = process.argv.slice(2);
  const targets = slugs.length
    ? CITIES.filter((c) => slugs.includes(c.slug))
    : CITIES;

  if (slugs.length && targets.length !== slugs.length) {
    const missing = slugs.filter((s) => !targets.find((c) => c.slug === s));
    console.error(`Unknown city slugs: ${missing.join(', ')}`);
    console.error(`Available: ${CITIES.map((c) => c.slug).join(', ')}`);
    process.exit(2);
  }

  for (const c of targets) {
    try {
      await scrapeCity(c);
    } catch (e: any) {
      console.error(`  ! ${c.slug} failed: ${e.message}`);
    }
    await sleep(SLEEP_MS);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
