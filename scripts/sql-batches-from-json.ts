/**
 * Split OSM JSON into SQL batch files for manual/MCP import.
 *   npx tsx scripts/sql-batches-from-json.ts /tmp/osm-places.json /tmp/osm-batches 150
 */

import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const file = process.argv[2];
const outDir = process.argv[3] ?? '/tmp/osm-batches';
const batchSize = parseInt(process.argv[4] ?? '100', 10);

if (!file) {
  console.error('Usage: npx tsx scripts/sql-batches-from-json.ts <json> [outDir] [batchSize]');
  process.exit(1);
}

const rows = JSON.parse(require('fs').readFileSync(file, 'utf8')) as Record<string, unknown>[];

function esc(s: string) {
  return s.replace(/'/g, "''");
}

mkdirSync(outDir, { recursive: true });

for (let i = 0; i < rows.length; i += batchSize) {
  const chunk = rows.slice(i, i + batchSize);
  const values = chunk.map((r) => {
    const tags = Array.isArray(r.tags) ? (r.tags as string[]) : [];
    return `('${esc(String(r.external_id))}','osm','${esc(String(r.name))}','${esc(String(r.description ?? ''))}','${esc(String(r.type))}',${r.lat},${r.lng},'${esc(String(r.country ?? ''))}','${esc(String(r.city ?? ''))}','${esc(String(r.region ?? ''))}',array[${tags.map((t) => `'${esc(t)}'`).join(',')}]::text[],true,'${esc(String(r.smoking_status ?? 'unknown'))}','${esc(String(r.smoking_status_source ?? 'unknown'))}')`;
  }).join(',\n');

  const sql = `insert into public.smoking_places (external_id, source, name, description, type, lat, lng, country, city, region, tags, verified, smoking_status, smoking_status_source) values\n${values}\non conflict (external_id) do update set name=excluded.name, description=excluded.description, type=excluded.type, lat=excluded.lat, lng=excluded.lng, country=excluded.country, city=excluded.city, region=excluded.region, verified=excluded.verified, smoking_status=excluded.smoking_status, smoking_status_source=excluded.smoking_status_source;`;

  const path = join(outDir, `batch-${String(i).padStart(5, '0')}.sql`);
  writeFileSync(path, sql);
}

console.log(`wrote ${Math.ceil(rows.length / batchSize)} batches (${rows.length} rows) to ${outDir}`);
