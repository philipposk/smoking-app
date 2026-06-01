/**
 * Scrape retailer chain store-locators with Playwright.
 * Driven by the registry in scripts/retailers.ts.
 *
 *   npm run scrape:retailers
 *   npm run scrape:retailers -- example-tobacconist
 */

import { chromium } from 'playwright';
import { adminClient } from './lib/db';
import { RETAILERS, Retailer, RawStore } from './retailers';

async function scrapeOne(r: Retailer): Promise<RawStore[]> {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    });
    await page.goto(r.url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    if (r.wait) {
      await page.waitForSelector(r.wait, { timeout: 30_000 });
    }
    const stores: RawStore[] = await page.evaluate(r.extract);
    return Array.isArray(stores) ? stores : [];
  } finally {
    await browser.close();
  }
}

async function main() {
  const slugs = process.argv.slice(2);
  const targets = slugs.length
    ? RETAILERS.filter((r) => slugs.includes(r.slug))
    : RETAILERS;

  if (targets.length === 0) {
    console.log('No retailers configured. Add entries to scripts/retailers.ts.');
    return;
  }

  const sb = adminClient();

  for (const r of targets) {
    console.log(`[retailer] ${r.name}`);
    try {
      const stores = await scrapeOne(r);
      console.log(`  -> ${stores.length} stores`);

      const rows = stores
        .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng))
        .map((s) => ({
          external_id: `retailer:${r.slug}/${s.id}`,
          source: 'retailer',
          name: s.name,
          description: s.address ?? null,
          type: 'shop',
          lat: s.lat,
          lng: s.lng,
          country: r.country,
          tags: [`chain:${r.slug}`],
          verified: true,
        }));

      if (rows.length === 0) continue;

      for (let i = 0; i < rows.length; i += 500) {
        const chunk = rows.slice(i, i + 500);
        const { error } = await sb
          .from('places')
          .upsert(chunk, { onConflict: 'external_id' });
        if (error) {
          console.error(`  ! upsert: ${error.message}`);
          break;
        }
      }
      console.log(`  ok: upserted ${rows.length}`);
    } catch (e: any) {
      console.error(`  ! ${r.slug} failed: ${e.message}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
