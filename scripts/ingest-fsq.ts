/**
 * Ingest Foursquare Open Source Places (Apache-2.0, ~100M POIs) into Supabase.
 * Queries the public S3 parquet directly via DuckDB — no download needed.
 *
 * Filters categories to: tobacco shops, cigar shops, hookah lounges, vape shops,
 * cafés, bars (broad coverage of smoke-friendly venues).
 *
 *   npm run ingest:fsq                # all CITIES in scripts/cities.ts
 *   npm run ingest:fsq -- athens      # one city
 *
 * Note: this scans large parquet files. First run per city takes 1-5 min.
 * DuckDB caches httpfs metadata in memory; multiple cities in one run is fast.
 *
 * Dataset details: https://opensource.foursquare.com/os-places/
 * Schema:          https://docs.foursquare.com/data-products/docs/places-os-data-schema
 */

import duckdb from 'duckdb';
import { adminClient } from './lib/db';
import { CITIES, City } from './cities';

// Foursquare's released parquet on their S3 bucket. Path is stable per release.
// If they bump the release tag, update here. Check https://opensource.foursquare.com/os-places/
const FSQ_PARQUET = process.env.FSQ_PARQUET_URL
  ?? 's3://fsq-os-places-us-east-1/release/dt=2025-04-08/places/parquet/*';

// FSQ category IDs we want. From their category taxonomy.
// Bar, café, smoke shop, hookah lounge, cigar lounge, vape store, head shop.
const CATEGORY_NAMES = [
  'tobacco', 'cigar', 'hookah', 'vape', 'smoke shop', 'head shop',
  'cafe', 'café', 'coffee', 'bar', 'pub', 'tavern',
];

// Map an FSQ category label to our DB enum.
function mapType(categories: string[]): string {
  const cats = categories.join(' ').toLowerCase();
  if (cats.match(/tobacco|cigar|hookah|smoke shop|head shop/)) return 'shop';
  if (cats.match(/vape/)) return 'shop';
  if (cats.match(/cafe|café|coffee/)) return 'cafe';
  if (cats.match(/bar|pub|tavern/)) return 'spot';
  return 'spot';
}

function openDb(): duckdb.Database {
  const db = new duckdb.Database(':memory:');
  return db;
}

function exec(db: duckdb.Database, sql: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, (err: any, rows: any[]) => (err ? reject(err) : resolve(rows)));
  });
}

async function setupDuckDb(db: duckdb.Database) {
  await exec(db, "INSTALL httpfs;");
  await exec(db, "LOAD httpfs;");
  // Anonymous S3 access for FSQ's public bucket
  await exec(db, "SET s3_region='us-east-1';");
  await exec(db, "SET s3_url_style='path';");
}

async function fetchCity(db: duckdb.Database, city: City) {
  const [minLng, minLat, maxLng, maxLat] = city.bbox;
  const catFilter = CATEGORY_NAMES
    .map((c) => `lower(array_to_string(categories, ' ')) LIKE '%${c.replace(/'/g, "''")}%'`)
    .join(' OR ');

  // Project only the columns we use. FSQ's schema: fsq_place_id, name, latitude,
  // longitude, locality, region, country, categories (array<string>).
  const sql = `
    SELECT fsq_place_id, name, latitude, longitude, locality, region, country, categories
    FROM '${FSQ_PARQUET}'
    WHERE latitude  BETWEEN ${minLat} AND ${maxLat}
      AND longitude BETWEEN ${minLng} AND ${maxLng}
      AND (${catFilter})
    LIMIT 5000
  `;
  return exec(db, sql);
}

async function ingest() {
  const slugs = process.argv.slice(2);
  const targets = slugs.length
    ? CITIES.filter((c) => slugs.includes(c.slug))
    : CITIES;

  if (slugs.length && targets.length !== slugs.length) {
    console.error('unknown slug(s)');
    process.exit(2);
  }

  const db = openDb();
  await setupDuckDb(db);

  const sb = adminClient();

  for (const c of targets) {
    console.log(`[fsq] ${c.name}`);
    try {
      const rows = (await fetchCity(db, c)) as any[];
      console.log(`  -> ${rows.length} FSQ rows`);
      if (!rows.length) continue;

      const upserts = rows
        .filter((r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude))
        .map((r) => ({
          external_id: `fsq:${r.fsq_place_id}`,
          source: 'fsq',
          name: r.name ?? 'Unnamed',
          type: mapType(r.categories ?? []),
          lat: Number(r.latitude),
          lng: Number(r.longitude),
          city: r.locality ?? c.name,
          country: r.country ?? c.country,
          region: c.region,
          tags: (r.categories ?? []).slice(0, 10),
          verified: true,
        }));

      for (let i = 0; i < upserts.length; i += 500) {
        const chunk = upserts.slice(i, i + 500);
        const { error } = await sb.from('places').upsert(chunk, { onConflict: 'external_id' });
        if (error) {
          console.error(`  ! upsert: ${error.message}`);
          break;
        }
      }
      console.log(`  ok: upserted ${upserts.length}`);
    } catch (e: any) {
      console.error(`  ! ${c.slug} failed: ${e.message}`);
    }
  }

  db.close();
}

ingest().catch((e) => {
  console.error(e);
  process.exit(1);
});
