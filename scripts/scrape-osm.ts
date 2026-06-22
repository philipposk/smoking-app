/**
 * Scrape OpenStreetMap via the Overpass API for smoking-relevant places.
 *
 * Why OSM: free, worldwide, structured, no anti-bot. It's the cheapest and most
 * efficient source for this kind of POI data — far better than scraping retail
 * sites. We map OSM tags onto the app's place `type` enum:
 *
 *   shop=tobacco                         → shop          (buy cigarettes)
 *   shop=kiosk / shop=newsagent          → kiosk         (usually sell cigarettes)
 *   shop=cannabis / *=cannabis           → dispensary    (LICENSED cannabis only)
 *   amenity=bench                        → bench         (sit + smoke)
 *   tourism=viewpoint                    → spot          (open-air, a view)
 *   amenity=biergarten                   → spot          (outdoor beer garden)
 *   amenity=smoking_area                 → smoking_area  (designated)
 *   smoking=yes|outside|dedicated|...    → cafe/spot     (EXPLICITLY allowed)
 *   outdoor_seating=yes on cafe/bar/pub  → cafe          (likely smoking outside)
 *
 * The `smoking=*` tag is the key signal — it's OSM's own "is smoking allowed
 * here" flag. We record WHY each place qualifies in `description`.
 *
 * Etiquette: the public Overpass instance rate-limits hard and discourages
 * concurrency, so we run cities sequentially with polite delays AND exponential
 * backoff on 429/504/timeout (transient failures no longer drop a whole city).
 * For large-scale ingestion, self-host Overpass or point OVERPASS_URL at a mirror.
 *
 *   npm run scrape:osm                 # all cities
 *   npm run scrape:osm -- athens tokyo # specific cities
 */

import { adminClient } from './lib/db';
import { CITIES, City } from './cities';

const OVERPASS_URL = process.env.OVERPASS_URL ?? 'https://overpass-api.de/api/interpreter';
const SLEEP_MS = 2_000;        // politeness delay between cities
const MAX_RETRIES = 4;         // per city, on transient Overpass errors
const BASE_BACKOFF_MS = 3_000; // exponential: 3s, 6s, 12s, 24s

type OsmEl = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

// smoking_status: structured "can I smoke here?" verdict.
// source: where the verdict came from (osm = an explicit OSM smoking=* tag;
// unknown = inferred from the place being outdoors, not an explicit statement).
type SmokingStatus = 'allowed' | 'outside_only' | 'designated' | 'banned' | 'unknown';
type Classification = {
  type: string;
  reason: string;
  smokingStatus: SmokingStatus;
  smokingSource: 'osm' | 'unknown';
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Map the OSM smoking=* tag onto our structured verdict.
function statusFromSmokingTag(v: string): SmokingStatus {
  if (v === 'yes' || v === 'dedicated') return 'allowed';
  if (v === 'outside' || v === 'separated') return 'outside_only';
  if (v === 'isolated') return 'designated';
  if (v === 'no') return 'banned';
  return 'unknown';
}

// Map a tag set onto the app's place type, a short reason for the description,
// and a structured smoking verdict. Order matters — most specific first.
function classify(tags: Record<string, string>): Classification | null {
  const smoking = tags.smoking;
  const amenity = tags.amenity;
  const shop = tags.shop;

  // Explicit smoking=* flag — the strongest signal we have. Source: osm.
  if (smoking && ['yes', 'outside', 'dedicated', 'isolated', 'separated'].includes(smoking)) {
    const venue = amenity === 'bar' || amenity === 'pub' || amenity === 'cafe' || amenity === 'restaurant';
    return {
      type: venue ? 'cafe' : 'spot',
      reason: `OSM tags this as smoking=${smoking}.`,
      smokingStatus: statusFromSmokingTag(smoking),
      smokingSource: 'osm',
    };
  }

  // Designated smoking areas.
  if (amenity === 'smoking_area') {
    return { type: 'smoking_area', reason: 'Designated smoking area.', smokingStatus: 'designated', smokingSource: 'osm' };
  }

  // Retailers (legal/licensed only — we never tag illegal sellers). Not a place
  // to smoke, so status stays unknown.
  if (shop === 'tobacco') return { type: 'shop', reason: 'Tobacconist.', smokingStatus: 'unknown', smokingSource: 'unknown' };
  if (shop === 'kiosk' || shop === 'newsagent') return { type: 'kiosk', reason: 'Kiosk — usually sells cigarettes.', smokingStatus: 'unknown', smokingSource: 'unknown' };
  if (shop === 'cannabis' || amenity === 'cannabis' || tags.cannabis === 'yes') {
    return { type: 'dispensary', reason: 'Licensed cannabis retailer (per OSM).', smokingStatus: 'unknown', smokingSource: 'unknown' };
  }

  // Open-air spots that suit a smoke — outdoors, so "outside only" by inference.
  if (tags.tourism === 'viewpoint') return { type: 'spot', reason: 'Viewpoint — open-air, a view.', smokingStatus: 'outside_only', smokingSource: 'unknown' };
  if (amenity === 'biergarten') return { type: 'spot', reason: 'Beer garden — outdoor seating.', smokingStatus: 'outside_only', smokingSource: 'unknown' };

  // Outdoor seating at a venue → you can usually smoke outside (inferred).
  if (tags.outdoor_seating === 'yes' && ['cafe', 'bar', 'pub', 'restaurant'].includes(amenity ?? '')) {
    return { type: 'cafe', reason: 'Has outdoor seating — usually fine to smoke outside.', smokingStatus: 'outside_only', smokingSource: 'unknown' };
  }

  // Benches — sit and smoke. Outdoors → outside_only by inference.
  if (amenity === 'bench') {
    const view = tags.direction ? ' with an outlook' : '';
    return { type: 'bench', reason: `Public bench${view}.`, smokingStatus: 'outside_only', smokingSource: 'unknown' };
  }

  return null;
}

function defaultName(type: string): string {
  switch (type) {
    case 'shop': return 'Tobacconist';
    case 'kiosk': return 'Kiosk';
    case 'dispensary': return 'Cannabis retailer';
    case 'bench': return 'Bench';
    case 'smoking_area': return 'Smoking area';
    case 'cafe': return 'Café (outdoor)';
    default: return 'Smoking spot';
  }
}

function queryFor(city: City): string {
  const [minLng, minLat, maxLng, maxLat] = city.bbox;
  // Overpass bbox order is south,west,north,east.
  const b = `${minLat},${minLng},${maxLat},${maxLng}`;
  // nwr = node|way|relation in one go. `out center tags` gives a point for ways/relations.
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
      nwr["smoking"="isolated"](${b});
      nwr["smoking"="separated"](${b});
      node["amenity"="bench"](${b});
      nwr["outdoor_seating"="yes"]["amenity"~"^(cafe|bar|pub|restaurant)$"](${b});
    );
    out center tags;
  `;
}

async function fetchOverpass(query: string): Promise<OsmEl[]> {
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const wait = BASE_BACKOFF_MS * 2 ** (attempt - 1);
      console.log(`    …retry ${attempt}/${MAX_RETRIES} after ${Math.round(wait / 1000)}s`);
      await sleep(wait);
    }
    try {
      const res = await fetch(OVERPASS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'smoking-app/1.0 (OSM POI ingest; contact hello@6x7.gr)',
        },
        body: 'data=' + encodeURIComponent(query),
      });
      // 429 (too many requests) and 504 (gateway timeout) are Overpass's
      // standard "busy, back off" responses — retry them.
      if (res.status === 429 || res.status === 504) {
        lastErr = new Error(`Overpass ${res.status} (busy)`);
        continue;
      }
      if (!res.ok) throw new Error(`Overpass ${res.status}: ${await res.text().catch(() => '')}`);
      const json = await res.json();
      return (json.elements ?? []) as OsmEl[];
    } catch (e: any) {
      lastErr = e; // network/parse error — also worth a retry
    }
  }
  throw lastErr ?? new Error('Overpass failed');
}

async function scrapeCity(city: City) {
  console.log(`[osm] ${city.name} (${city.country})`);
  const els = await fetchOverpass(queryFor(city));
  console.log(`  -> ${els.length} elements`);

  const seen = new Set<string>();
  const rows = els.flatMap((el) => {
    const tags = el.tags ?? {};
    const cls = classify(tags);
    if (!cls) return [];
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat == null || lng == null) return [];

    const external_id = `osm:${el.type}/${el.id}`;
    if (seen.has(external_id)) return []; // a node can match two filters
    seen.add(external_id);

    return [{
      external_id,
      source: 'osm',
      name: tags.name ?? tags['name:en'] ?? defaultName(cls.type),
      type: cls.type,
      lat,
      lng,
      country: city.country,
      city: city.name,
      region: city.region,
      description: cls.reason,
      smoking_status: cls.smokingStatus,
      smoking_status_source: cls.smokingSource,
      accessible: tags.wheelchair === 'yes' ? true : tags.wheelchair === 'no' ? false : null,
      tags: Object.entries(tags).slice(0, 20).map(([k, v]) => `${k}=${v}`),
      verified: true,
    }];
  });

  if (rows.length === 0) {
    console.log('  ok: nothing to upsert');
    return;
  }

  const sb = adminClient();
  let upserted = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const { error } = await sb
      .from('places')
      .upsert(chunk, { onConflict: 'external_id', ignoreDuplicates: false });
    if (error) {
      console.error(`  ! upsert error: ${error.message}`);
      break;
    }
    upserted += chunk.length;
  }
  console.log(`  ok: upserted ${upserted} places`);
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

  let ok = 0;
  let failed = 0;
  for (const c of targets) {
    try {
      await scrapeCity(c);
      ok++;
    } catch (e: any) {
      console.error(`  ! ${c.slug} failed: ${e.message}`);
      failed++;
    }
    await sleep(SLEEP_MS);
  }
  console.log(`\nDone. ${ok} cities ok, ${failed} failed, of ${targets.length}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
