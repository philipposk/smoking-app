import { TABLES } from '../lib/supabase/tables';
/**
 * Bulk-import OSM JSON (from fetch-osm-json.ts) into Supabase.
 *   npx tsx scripts/fetch-osm-json.ts athens > /tmp/athens.json
 *   npx tsx scripts/import-osm-json.ts /tmp/athens.json
 */

import { readFileSync } from 'fs';
import { adminClient } from './lib/db';

const BATCH = 200;

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: npx tsx scripts/import-osm-json.ts <json-file>');
    process.exit(1);
  }
  const rows = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>[];
  const sb = adminClient();
  let upserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error, count } = await sb
      .from(TABLES.places)
      .upsert(chunk, { onConflict: 'external_id', count: 'exact' });
    if (error) {
      console.error(`batch ${i}:`, error.message);
      process.exit(1);
    }
    upserted += count ?? chunk.length;
    console.log(`  ${Math.min(i + BATCH, rows.length)} / ${rows.length}`);
  }
  console.log(`imported ${upserted} places from ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
