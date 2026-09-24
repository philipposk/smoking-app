/**
 * Fetch OSM places for given city slugs and write JSON to stdout.
 *   npx tsx scripts/fetch-osm-json.ts athens copenhagen mytilene molyvos > /tmp/osm.json
 */

import { writeFileSync } from 'fs';
import { CITIES, City } from './cities';

const OVERPASS_URL = process.env.OVERPASS_URL ?? 'https://overpass-api.de/api/interpreter';
const slugs = process.argv.slice(2).length ? process.argv.slice(2) : ['athens', 'copenhagen', 'mytilene', 'molyvos'];

type Classification = { type: string; reason: string; smokingStatus: string };

function classify(tags: Record<string, string>): Classification | null {
  const smoking = tags.smoking;
  const amenity = tags.amenity;
  const shop = tags.shop;
  if (smoking && ['yes', 'outside', 'dedicated', 'isolated', 'separated'].includes(smoking)) {
    const venue = ['bar', 'pub', 'cafe', 'restaurant'].includes(amenity ?? '');
    const st =
      smoking === 'yes' || smoking === 'dedicated' ? 'allowed'
      : smoking === 'outside' || smoking === 'separated' ? 'outside_only'
      : 'designated';
    return { type: venue ? 'cafe' : 'spot', reason: `OSM smoking=${smoking}.`, smokingStatus: st };
  }
  if (amenity === 'smoking_area') return { type: 'smoking_area', reason: 'Designated smoking area.', smokingStatus: 'designated' };
  if (shop === 'tobacco') return { type: 'shop', reason: 'Tobacconist.', smokingStatus: 'unknown' };
  if (shop === 'kiosk' || shop === 'newsagent') return { type: 'kiosk', reason: 'Kiosk.', smokingStatus: 'unknown' };
  if (shop === 'cannabis' || amenity === 'cannabis' || tags.cannabis === 'yes') {
    return { type: 'dispensary', reason: 'Licensed cannabis retailer.', smokingStatus: 'unknown' };
  }
  if (tags.tourism === 'viewpoint') return { type: 'spot', reason: 'Viewpoint.', smokingStatus: 'outside_only' };
  if (amenity === 'biergarten') return { type: 'spot', reason: 'Beer garden.', smokingStatus: 'outside_only' };
  if (tags.outdoor_seating === 'yes' && ['cafe', 'bar', 'pub', 'restaurant'].includes(amenity ?? '')) {
    return { type: 'cafe', reason: 'Outdoor seating.', smokingStatus: 'outside_only' };
  }
  if (amenity === 'bench') return { type: 'bench', reason: 'Public bench.', smokingStatus: 'outside_only' };
  return null;
}

function queryFor(city: City): string {
  const [minLng, minLat, maxLng, maxLat] = city.bbox;
  const b = `${minLat},${minLng},${maxLat},${maxLng}`;
  return `
    [out:json][timeout:120];
    (
      nwr["shop"="tobacco"](${b});
      nwr["shop"="kiosk"](${b});
      nwr["shop"="newsagent"](${b});
      nwr["shop"="cannabis"](${b});
      nwr["amenity"="cannabis"](${b});
      nwr["amenity"="smoking_area"](${b});
      nwr["amenity"="biergarten"](${b});
      nwr["tourism"="viewpoint"](${b});
      nwr["smoking"="yes"](${b});
      nwr["smoking"="outside"](${b});
      nwr["smoking"="dedicated"](${b});
      node["amenity"="bench"](${b});
      nwr["outdoor_seating"="yes"]["amenity"~"^(cafe|bar|pub|restaurant)$"](${b});
    );
    out center tags;
  `;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchCity(city: City) {
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt <= 4; attempt++) {
    if (attempt > 0) {
      const wait = 3000 * 2 ** (attempt - 1);
      console.error(`  retry ${attempt}/4 after ${Math.round(wait / 1000)}s`);
      await sleep(wait);
    }
    try {
      const res = await fetch(OVERPASS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'smoking-app/1.0 (OSM POI ingest; contact hello@6x7.gr)',
        },
        body: 'data=' + encodeURIComponent(queryFor(city)),
      });
      if (res.status === 429 || res.status === 504) {
        lastErr = new Error(`Overpass ${res.status} for ${city.slug}`);
        continue;
      }
      if (!res.ok) throw new Error(`Overpass ${res.status} for ${city.slug}`);
      const json = await res.json();
      return parseElements(json, city);
    } catch (e: any) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error(`Overpass failed for ${city.slug}`);
}

function parseElements(json: { elements?: unknown[] }, city: City) {
  const seen = new Set<string>();
  const rows: Record<string, unknown>[] = [];
  for (const el of (json.elements ?? []) as Array<{
    type: string; id: number; lat?: number; lon?: number;
    center?: { lat: number; lon: number }; tags?: Record<string, string>;
  }>) {
    const tags = el.tags ?? {};
    const c = classify(tags);
    if (!c) continue;
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (!lat || !lng) continue;
    const external_id = `osm:${el.type}/${el.id}`;
    if (seen.has(external_id)) continue;
    seen.add(external_id);
    const defaults: Record<string, string> = {
      shop: 'Tobacconist', kiosk: 'Kiosk', dispensary: 'Cannabis retailer',
      bench: 'Bench', smoking_area: 'Smoking area', cafe: 'Café (outdoor)', spot: 'Smoking spot',
    };
    rows.push({
      external_id,
      source: 'osm',
      name: tags.name || defaults[c.type] || 'Place',
      description: c.reason,
      type: c.type,
      lat, lng,
      country: city.country,
      city: city.name,
      region: city.region,
      tags: [],
      verified: true,
      smoking_status: c.smokingStatus,
      smoking_status_source: tags.smoking ? 'osm' : 'unknown',
    });
  }
  return rows;
}

// parseElements closes above; fetchCity returns its result

async function main() {
  const cities = slugs.map((s) => CITIES.find((c) => c.slug === s)).filter(Boolean) as City[];
  const all: Record<string, unknown>[] = [];
  for (const city of cities) {
    console.error(`[fetch] ${city.slug}…`);
    const rows = await fetchCity(city);
    console.error(`  -> ${rows.length}`);
    all.push(...rows);
    await new Promise((r) => setTimeout(r, 2500));
  }
  const out = process.env.OUT_FILE;
  if (out) writeFileSync(out, JSON.stringify(all));
  else process.stdout.write(JSON.stringify(all));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
