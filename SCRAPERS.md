# Scrapers

The app pulls smoke shops, benches, and smoking areas from two sources:

1. **OpenStreetMap** via the Overpass API (free, legal, no key needed).
2. **Retailer chain store-locators** via Playwright (configurable list, optional).

Both write into the same `places` table. Each row carries an `external_id`
(e.g. `osm:node/12345`), so re-running the scrapers is **idempotent** — it
updates existing rows in place instead of duplicating them.

---

## 1. OSM scraper

Run it manually:

```bash
# Scrape every city in the registry (slow, polite — ~2s between cities)
npm run scrape:osm

# Or just one or two
npm run scrape:osm -- athens tokyo
```

Cities are listed in [`scripts/cities.ts`](scripts/cities.ts). To add one:
grab a bounding box from <https://boundingbox.klokantech.com> ("CSV raw"
format) and append a row.

What it grabs per city (mapped onto the app's place `type`):

| OSM tag | type | why it's a smoking place |
|---|---|---|
| `smoking=yes\|outside\|dedicated\|isolated\|separated` | cafe / spot | **explicitly** smoking-allowed (OSM's own flag) |
| `amenity=smoking_area` | smoking_area | designated area |
| `shop=tobacco` | shop | buy cigarettes |
| `shop=kiosk` / `shop=newsagent` | kiosk | usually sell cigarettes |
| `shop=cannabis` / `amenity=cannabis` | dispensary | **licensed** cannabis only |
| `tourism=viewpoint` | spot | open-air, a view |
| `amenity=biergarten` | spot | outdoor beer garden |
| `amenity=bench` | bench | sit + smoke |
| `outdoor_seating=yes` on cafe/bar/pub/restaurant | cafe | smoke outside |

The **`smoking=*` tag is the key signal** — it's OSM's own "is smoking allowed
here" flag. Each row records *why* it qualified in its `description`. We only
ingest **licensed** retailers; we never map illegal sellers.

Reliability: cities run sequentially (Overpass discourages concurrency) with
exponential backoff on `429`/`504`/timeout, so a busy-server blip retries
instead of dropping the whole city.

Heads up: benches are dense in big cities (Tokyo alone has tens of thousands).
Expect each big city to take 10-30 seconds and write a few thousand rows.

## 2. Retailer scraper (Playwright)

Out of the box this scraper has **no chains configured** — you turn it on by
adding entries to [`scripts/retailers.ts`](scripts/retailers.ts).

For each chain you want:

1. Open the chain's store-locator page in a normal browser.
2. In DevTools → Network → XHR, find the request that returns store data.
   It is almost always a JSON endpoint.
3. Write a small `extract` function that runs in the browser and returns
   `{ id, name, address?, lat, lng }[]`.
4. Add an entry to `RETAILERS` in `scripts/retailers.ts`.

Then:

```bash
npx playwright install chromium      # one-time
npm run scrape:retailers             # scrape all chains
npm run scrape:retailers -- my-slug  # one chain
```

**Legal note.** Some retailers' Terms of Service forbid automated scraping.
Read the ToS before adding a chain. If a chain offers an official API or a
data download, use that instead. The default registry is intentionally empty.

## 3. Nightly cron (macOS)

This runs both scrapers and writes a timestamped log to `scripts/logs/`.

```bash
npm run scrape:nightly
```

To run it automatically every night at 3 AM, install the launchd job:

```bash
# 1. Edit the plist if your project path differs from the default.
open scripts/launchd/com.smokingapp.scrape.plist

# 2. Copy it into LaunchAgents and load it
cp scripts/launchd/com.smokingapp.scrape.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.smokingapp.scrape.plist

# Disable later with:
launchctl unload ~/Library/LaunchAgents/com.smokingapp.scrape.plist
```

The job runs whenever your Mac is awake at 3 AM. If your Mac is asleep at
3 AM, launchd runs it the next time the Mac wakes up.

## 4. Troubleshooting

- **`Missing NEXT_PUBLIC_SUPABASE_URL`** — your scraper isn't reading
  `.env.local`. The scripts load `dotenv/config` and look for `.env` first,
  then `.env.local`. Make sure the file is in the project root.
- **Overpass returns 429** — back off. The Overpass API rate-limits free
  users. The script already sleeps 2 s between cities; raise it via the
  `SLEEP_MS` constant in `scripts/scrape-osm.ts`.
- **Playwright says "Executable doesn't exist"** — run
  `npx playwright install chromium` once.
