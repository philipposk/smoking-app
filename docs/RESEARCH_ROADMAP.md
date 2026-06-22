The codebase matches the findings' claims (FSQ ingest, OSM scraper, retailers, 8 migrations, supercluster + maplibre, next-pwa, no PostGIS yet). I have what I need to synthesize.

# Smoking-Spots Directory — Prioritized Roadmap

*Next.js 14 + Supabase, free-tier focused. 37 findings de-duplicated into ~18 distinct initiatives. Legal/licensed data only — no illegal sellers, ever.*

The 37 raw findings collapse heavily. Three themes were each proposed 3–4× independently (strong signal): **(1) a structured `smoking_policy` field from OSM tags**, **(2) freshness/confirmation system**, and **(3) viewport/bbox + server-clustering for the map**. These are merged below and rank at the top.

---

## New Features

### F1. Structured "Can I smoke here?" verdict on every place *(merges 4 findings: #1, #11, #31, +overlap with data D2)*
**Idea:** Replace free-text smoking notes with a structured `smoking_policy` field + a colored verdict chip, falling back to country legal defaults when a venue is untagged.
**Evidence:** OSM `smoking=*` already encodes venue reality (`yes/outside/separated/isolated/dedicated/no`); the scraper currently flattens it into prose. Travel forums ask this near-identically every time ("a cold beer and a cig at the same time"). No mainstream map exposes this — clear differentiator. WHO MPOWER / Our World in Data / Wikipedia supply the legal fallback.
**Effort:** Medium · **Impact:** High
**How-to:** Migration `0009`: `smoking_status text check in ('allowed','outside_only','designated','banned','unknown')` + `smoking_status_source text ('osm','legal_default','community')`. In `scripts/scrape-osm.ts` `classify()`: map `yes/dedicated→allowed`, `outside/separated→outside_only`, `isolated→designated`, `no→banned`. Untagged → join a small `legal_defaults` table (see G2). Render a verdict chip atop `app/place/[id]/PlaceDetail.tsx`; **show the source** so "banned by national law" reads differently from "owner says no."

### F2. Smoker-specific multi-axis filters *(merges #3, #10, #13-vaping)*
**Idea:** One-tap chips for covered/sheltered, seating, heater, ashtray, terrace/rooftop, beer garden, open-now — plus distinct **vape-OK vs cigarettes vs cannabis** flags.
**Evidence:** Weedmaps/Leafly/AllTrails all drive engagement with rich faceting. CLUB JT filters by product type. Forum requests cluster on "outdoor seating you can smoke at." Hotels lump vaping with smoking and fine $150–500, but rules differ by chain — vapers actively search this; Greece's 2019 law explicitly separates e-cigs.
**Effort:** Small–Medium · **Impact:** High
**How-to:** Controlled tag vocabulary in `places.tags text[]` (already exists, unused) + booleans `vaping_allowed`, `cigarettes_allowed`, `cannabis_ok`, plus `hotel_vaping_note`. Backfill from OSM (`covered=yes`, `outdoor_seating`, `bench`). GIN index on `tags`. Filter bar feeds the existing bbox query (`tags @> array`). "Open now" needs an `opening_hours` column (OSM `opening_hours=*`), parsed client-side.

### F3. Airport smoking guide *(unique — #14)*
**Idea:** Dedicated `airport_smoking` place type with walk directions, **inside-security vs landside**, re-entry warning, and a door/area photo.
**Evidence:** Acute, recurring, under-served. O'Hare thread: "couldn't find any maps/photos explaining how to get into such an area." Free seed dataset exists: no-smoke.org "Smoking Policies in the 35 Busiest U.S. Airports" PDF. Some airports keep post-security areas (Tampa, Nashville, Vegas, CDG lounges).
**Effort:** Medium · **Impact:** High
**How-to:** Add `airport_smoking` to `places.type` check constraint. Fields: `airside bool`, `requires_reentry bool`, `walking_directions text`, `terminal text`. Parse the no-smoke.org PDF table for US seed; reuse Supabase Storage uploads (migration 0008) for door photos and reviews for "still open?".

### F4. Lists / Collections *(merges #5, #18-curation)*
**Idea:** User-curated + auto-generated lists ("Cigar-friendly lounges near me", "Beer gardens you can smoke in, Munich").
**Evidence:** AllTrails saved trails + Google Local Guides collaborative lists are cited retention drivers; Cigarbase segments by venue type. Lists double as SEO landing pages.
**Effort:** Medium · **Impact:** Medium
**How-to:** Generalize the existing `favorites` table into `lists(id, owner_user_id, title, slug, is_public)` + `list_places(list_id, place_id, position)`. Auto-seed per city/type. Indexable `/list/[slug]` via Next 14 server component + ISR. *(Pairs with G1.)*

---

## Data Sources *(licensed/legal only)*

### D1. Overture Maps Places as a third bulk source *(merges #19, #33-worldwide)*
**Idea:** Add Overture `places` theme (75M+ global POIs) alongside OSM + FSQ for worldwide coverage — the data moat.
**Evidence:** Overture places is **CDLA Permissive 2.0** (commercial OK, no share-alike — *not* ODbL), free GeoParquet on AWS Open Data, carries a `confidence` score. **Caveat from findings:** it re-bundles Meta + Microsoft + **Foursquare**, so it overlaps your FSQ feed → dedupe required (see T4).
**Effort:** Medium · **Impact:** High
**How-to:** Clone `scripts/ingest-fsq.ts → ingest-overture.ts`, keep the DuckDB pattern, point at `s3://overturemaps-us-west-2/release/<DATE>.0/theme=places/type=place/*`. Filter on `bbox` struct + `categories.primary IN (...)` + `confidence > 0.6`. Upsert `external_id = overture:${id}`, `source='overture'`. Env var `OVERTURE_RELEASE`. Attribute "Overture Maps Foundation" in footer.

### D2. Smoke-free law layer (US CDC + WHO global) *(merges #20, #12)*
**Idea:** Separate `jurisdiction_rules` / `country_smoking_rules` tables driving a per-place legal banner ("Indoor smoking banned statewide in CA — outdoor only").
**Evidence:** CDC STATE System publishes machine-readable smokefree-indoor-air legislation via Socrata SODA API (`32fd-hyzc`, e-cig `wan8-w4er`), quarterly, **US public domain**. WHO GHO + tobaccocontrollaws.org cover ~40 tourist countries. **Caveat:** ANR Foundation's 21,000-law DB is *not* open-license — link out to no-smoke.org, don't ingest.
**Effort:** Medium · **Impact:** High
**How-to:** `scripts/ingest-cdc-laws.ts` → `data.cdc.gov/resource/32fd-hyzc.json?$limit=50000`. Store latest row per (state, provision): status, citation, effective_year, source_url. Manual editorial seed for top countries from WHO + tobaccocontrollaws.org. On place pages, look up stored region/country → render banner + "last updated YYYY, source: CDC." Re-run quarterly via existing `run-nightly.sh`. This same table is F1's `legal_default` fallback.

### D3. Licensed retailer layer — tobacco + cannabis *(merges #8, #17, #25, #32)*
**Idea:** Map **only** government-licensed tobacconists / dispensaries / consumption lounges, with a "Verified license #" badge and merchant claim flow.
**Evidence:** Official open registries: NY OCM (`data.ny.gov/.../jskf-tt3q`), CA DCC (daily), MA CCC open data, WA LCB, Denver ArcGIS, plus Cannlytics multi-state (CC-BY 4.0). NYC tobacco-retailer license list. Schema already has `source='retailer'`, `verified`, `merchant_claimed`, and `merchant_claims`. This is the legal-safety AND trust play. **Hard rule: gate the importer on a license-registry source — never ingest unlicensed/gray-market sellers.**
**Effort:** Large · **Impact:** High (legal-safety), Medium (volume)
**How-to:** Per-jurisdiction adapters behind a registry map (extend `scripts/scrape-retailers.ts`). Modes: (a) Socrata/ArcGIS GeoJSON; (b) CSV → geocode via Photon (already in `AddPlaceModal`). New columns `license_number`, `license_authority`, `license_status`, `license_expiry`, `source_url`. Only insert rows with active/current status. Add `consumption_lounge` to `type`. Gate cannabis behind the existing age gate + per-jurisdiction legality flag from D2. Document the licensed-only rule in `SCRAPERS.md`.

### D4. Wikidata / Commons enrichment *(unique — #21)*
**Idea:** Enrich viewpoints/parks/landmarks with free photos + descriptions, keyed on the OSM `wikidata=*` tag — as enrichment, **not** a primary source.
**Evidence:** Wikidata is **CC0** (soft credit only). **Correction baked into findings:** there is *no* smoking property — `P5197` is a music-track ID, not a smoking flag. So OSM `smoking=*` stays authoritative; Wikidata only adds `P18` image, Wikipedia blurb, `P31` instance-of.
**Effort:** Small · **Impact:** Medium
**How-to:** Persist `tags.wikidata` in `scrape-osm.ts`. New `scripts/enrich-wikidata.ts`: batch Q-ids to WDQS SPARQL, build Commons URL via `Special:FilePath/<file>?width=600`. Throttle <1 req/s, descriptive User-Agent. Store `image_url` + `blurb`.

### D5. Expand OSM Overpass to more open-air POIs *(unique — #22; categorized "feature" but it's a data-coverage win)*
**Idea:** Capture `leisure=park/garden/picnic_table`, `tourism=picnic_site`, `natural=peak/beach`, `amenity=shelter` — the bench/viewpoint/outdoor categories in the product pitch, free in data you already fetch.
**Evidence:** OSM `Key:smoking` is de-facto standard; these leisure tags are heavily mapped worldwide; you already attribute "© OpenStreetMap contributors" (ODbL).
**Effort:** Small · **Impact:** Medium
**How-to:** Add the tags to `scrape-osm.ts` `queryFor()`. Extend `classify()` → `spot`/`bench` with a reason string. Guard polygon bloat: keep `out center`, add per-type caps. Keep cannabis gated to `shop=cannabis` (licensed) only.

### D6. (Defer) Park/viewpoint boundary datasets *(unique — #26)*
**Idea:** Skip the WDPA/national-park boundary hunt for now — OSM + Overture cover points cheaply.
**Evidence:** No open global viewpoint dataset exists outside OSM/Wikidata; WDPA has non-commercial-ish terms — **check license before any ingest**.
**Effort:** Small · **Impact:** Low → **Backlog, not now.**

---

## UX

### U1. Map heatmap + verdict-colored markers *(unique — #9)*
**Idea:** MapLibre heatmap of where smoking is tolerated; color markers by F1 verdict.
**Evidence:** AllTrails heatmaps cited as a moat; Weedmaps' map is the primary surface. You already ship `supercluster ^8` + `maplibre-gl ^5`.
**Effort:** Small · **Impact:** Medium · Mostly a front-end layer over F1 data.

### U2. Photo-first place pages *(unique — #7)*
**Idea:** Gallery of the actual spot/seating area, EXIF-stripped uploads, "this photo helped" vote.
**Evidence:** AllTrails attributes trust to community photos; Google weights photos at 7 pts. Storage + Mapillary already wired.
**Effort:** Small · **Impact:** Medium
**How-to:** `place_photos(place_id, user_id, url, caption, helpful_count)`. Promote single `photo_url` → gallery. Strip EXIF server-side (privacy + smaller files). Reuse the existing flag/moderation queue.

### U3. Full-text + map search with autocomplete *(unique — #16)*
**Idea:** Search by city, venue name, "rooftop bars Berlin."
**Evidence:** The only review of the paid Japan Smoking Area app is 1-star, top complaint: **"No query search."** Cheap gap to win.
**Effort:** Small · **Impact:** Medium
**How-to:** Postgres `tsvector` on `places(name, city, neighborhood, description)` + GIN, or `pg_trgm` for fuzzy. Expose via `/api/places?q=`. Combine with Photon geocoder (already in `AddPlaceModal`).

### U4. Offline "my city" pack *(merges #6, #18-offline, #36)*
**Idea:** Download your city's verified places + a small PMTiles basemap extract for no-signal use.
**Evidence:** Finding-a-spot is a low-signal, on-the-street moment. The paid Japan app ships offline + proximity alerts as headline features. `next-pwa` + `public/sw.js` already present (task #17 done). PMTiles is single-file, range-request, cache-friendly.
**Effort:** Medium · **Impact:** Medium
**How-to:** Nightly `pmtiles extract` per city using bboxes already in `scripts/cities.ts`. "Download offline" button caches city PMTiles + places GeoJSON via Cache API. Optional Web Push "smoking area 50m away."

---

## Growth

### G1. Editorial city guides + SEO list pages *(merges #18, #17-editorial)*
**Idea:** Static indexable `/guide/[city]/[topic]` pages ("Smoke-friendly rooftops in NYC").
**Evidence:** Demand currently captured by blog listicles that rank (Billy Penn's "45 bars where you can light up", NYC.com, Yelp city pages). Recurring forum search intent.
**Effort:** Small · **Impact:** Medium
**How-to:** Server-render from DB filtered by city + `smoking_policy`/type, with metadata/OG + JSON-LD `ItemList`. Near-zero marginal cost; pairs with F4 lists.

### G2. Localized smoking-law explainer pages *(unique — #10; the content twin of D2)*
**Idea:** `/laws/[country]` pages ("Smoking rules in Japan / Greece / Portugal"), ISR, localized via existing `next-intl` (5 locales).
**Evidence:** Outdoor bans are the next regulatory wave → travelers actively search. WHO GHO has API+CSV; same data backs F1's legal fallback.
**Effort:** Medium · **Impact:** Medium · Reuses the D2 table; cross-link from place pages.

### G3. Contributor gamification *(unique — #4)*
**Idea:** Points + levels + badges for adds/photos/confirmations/edits, on a public `/u/[username]` profile + leaderboard.
**Evidence:** Google Local Guides (reviews 10 / photos 7 / new place 15 / edit 1 pt, 10 levels) credited as a major contribution+retention driver; Swarm mayorships are its stickiness engine.
**Effort:** Medium · **Impact:** Medium
**How-to:** `points int` + `level int` on `users` (already has role/bio/avatar). Award server-side in the insert handlers. No new infra.

### G4. Survive Supabase 7-day inactivity pause *(unique — #34; ops/reliability framed as growth)*
**Idea:** Keep the read path static (T6) + a tiny cron ping so the map never goes blank.
**Evidence:** Free tier pauses after 7 days idle, max 2 projects, no SLA/backups — a low-traffic early-stage directory *will* trigger this.
**Effort:** Small · **Impact:** Medium
**How-to:** (1) Serve map from nightly PMTiles/GeoJSON snapshot (T6) so reads don't need the DB awake; (2) Vercel Cron → `/api/health` running `select 1` every ~3 days. Document in `SETUP_SUPABASE.md`.

---

## Tech / Architecture

### T1. Freshness / confirmation system *(merges 2 findings: #2, #15)*
**Idea:** Per-place "last confirmed" date + one-tap "Still smoking-friendly? Yes/No," auto-demote stale/disputed listings.
**Evidence:** Stale data is the #1 failure mode of every crowdsourced competitor (and the explicit complaint vs "Smoking Map" apps). AllTrails' moat is condition reports validated within hours. Policies change fast (Czech 2017, Greece 2019).
**Effort:** Small–Medium · **Impact:** High
**How-to:** `place_confirmations(place_id, user_id, still_allowed bool, created_at)` + `last_confirmed_at` on places. `POST /api/places/[id]/confirm` reusing the email-verified write gate + `lib/rate-limit.ts`. Freshness badge (green <30d, amber <180d, grey older). Confidence score = f(recency, +confirms, flags); hang aggregates off existing `place_stats` (migration 0007). Reuse `admin/queue` for disputes.

### T2. Viewport (bbox) map loading *(unique — #28)*
**Idea:** Stop fetching all places once; refetch only the current viewport on pan/zoom.
**Evidence:** `FullMapView.tsx:48` does `fetch('/api/places?limit=2000')` once → above 2000 worldwide POIs the **map silently truncates**. The API already accepts `bbox` (`route.ts:54-59`) and CDN cache headers exist — this is almost entirely a client change.
**Effort:** Medium · **Impact:** High
**How-to:** Debounced (250ms) `moveend` → `map.getBounds()` → `/api/places?bbox=...&limit=2000`. Below z<6, use the cluster endpoint (T3) instead.

### T3. Server-side cluster endpoint for low zoom *(unique — #29)*
**Idea:** Return cluster bubbles (count + centroid) from Postgres at country/continent zoom instead of raw points.
**Evidence:** Free tier = 5GB DB egress/month; shipping all points per viewport burns it. PostGIS `ST_SnapToGrid`/`ST_ClusterDBSCAN` do this server-side. Difference between a 5KB and 5MB response.
**Effort:** Medium · **Impact:** High
**How-to:** RPC `cluster_places(z, bbox)` using `ST_SnapToGrid(geom, cell_size(z))`. Client renders circles when z<~12, real points at z≥12. CDN-cache the response like `/api/places`. *(Depends on T5.)*

### T4. Dedup / merge layer *(unique — #24; becomes mandatory once D1 lands)*
**Idea:** `source` priority + spatial dedupe so the same café doesn't appear 3× across OSM/FSQ/Overture/gov.
**Evidence:** Overture re-bundles FSQ and even carries the originating FSQ id in `sources` → guaranteed duplicates without this.
**Effort:** Medium · **Impact:** Medium
**How-to:** `dedupe_key = round(lat,4)+round(lng,4)+normalize(name)`. Nightly pass keeps one canonical row by priority (gov > osm-with-smoking-tag > overture > fsq) and confidence; mark others `hidden=true` (keep provenance). Surface a `sources` array. Read Overture `sources[].dataset` to skip FSQ records you already have.

### T5. PostGIS + `geography(Point)` + GiST index *(unique — #27)*
**Idea:** Replace the `(lat,lng)` btree with a real spatial index; unlocks T2/T3 and vector tiles.
**Evidence:** `0001_init.sql:58` is a composite btree (only filters the first column efficiently for 2-D ranges). Migration 0001's own comment flags "switch to PostGIS later." One-line enable on Supabase.
**Effort:** Medium · **Impact:** Medium (foundational for T2/T3)
**How-to:** Migration `0009`: `create extension postgis;` → `add column geom geography(Point,4326) generated always as (st_point(lng,lat)::geography) stored;` → GiST index. RPC `places_in_bbox(...)` with `geom && ST_MakeEnvelope(...,4326)`. Keep lat/lng for payload shape. Watch the 500MB DB cap.

### T6. Static GeoJSON/PMTiles snapshot on CDN *(unique — #30)*
**Idea:** Nightly-built static file serves the near-static read path; bypass the DB entirely.
**Evidence:** POIs change rarely; Protomaps' thesis = near-static map data belongs in a CDN file, not a live DB. Protects the 5GB egress cap and keeps the map alive when Supabase is paused (G4).
**Effort:** Medium · **Impact:** High
**How-to:** Extend nightly job: dump verified places → `places.geojson` → `tippecanoe -zg --drop-densest-as-needed -o places.pmtiles` → upload to R2. Add as a second MapLibre layer. DB API serves only fresh submissions + detail pages.

### T7. Keep the basemap free (OpenFreeMap + PMTiles-on-R2 fallback) *(unique — #25-basemap/#27-basemap → "#25" entry)*
**Idea:** Stay on OpenFreeMap; add a self-hosted PMTiles-on-Cloudflare-R2 production fallback. **Never** route basemap tiles through Supabase.
**Evidence:** `LiveMap.tsx` already uses OpenFreeMap "liberty" (MIT, no key, no limits). PMTiles+R2+Worker: ~$0.50 per 50k loads vs ~$350/mo Google; fits R2 free tier (zero egress).
**Effort:** Small · **Impact:** High (cost insurance)
**How-to:** Basemap stays as-is. For resilience: `pmtiles extract` a regional build → R2 bucket → Protomaps Worker → point `NEXT_PUBLIC_MAP_STYLE_URL` at `pmtiles://`.

### T8. Aggressive edge caching, split anon vs personalized *(unique — #32-cache)*
**Idea:** Serve the identical anonymous map from Vercel's edge cache; raise TTL; apply to new bbox/cluster routes.
**Evidence:** Commit `4e66ccf` already added `s-maxage=60, swr=300` for anon and `private,no-store` for admin (`route.ts:67-69`). Gap: 60s is short for nightly-changing data, and T2/T3 routes need the same.
**Effort:** Small · **Impact:** Medium
**How-to:** Raise `s-maxage` to ~600. Same Cache-Control on bbox + cluster RPC routes. Add `?v=<nightly-build-id>` cache-buster set by the nightly job. Consider Cloudflare in front of Vercel later.

---

## Top 10 to Build Next *(ordered by impact ÷ effort)*

| # | Initiative | Effort | Impact | Why first |
|---|-----------|--------|--------|-----------|
| 1 | **T1 — Freshness/confirm system** | S–M | High | Kills the #1 competitor failure (stale data); reuses existing auth + rate-limit + place_stats. |
| 2 | **F1 — Structured smoking verdict** | M | High | The core differentiator; data is already fetched, just flattened. Foundation for U1, F2, G1. |
| 3 | **U3 — Full-text + map search** | S | Med | Cheap; directly beats the paid competitor's 1-star "no search" complaint. |
| 4 | **T2 — Viewport bbox loading** | M | High | Fixes a real bug — map silently truncates above 2000 POIs. API already supports it. |
| 5 | **F2 — Smoker filter chips (+ vape flag)** | S–M | High | Matches verbatim forum search intent; `tags[]` column already exists. |
| 6 | **T7 — Free basemap + R2 fallback** | S | High | Cost insurance; basemap already free, this just hardens it. |
| 7 | **D5 — Expand OSM open-air POIs** | S | Med | Free coverage boost (parks/benches/viewpoints) in data you already pull. |
| 8 | **T5 + T6 — PostGIS + static snapshot** | M | High | Foundational: unlocks T3, protects egress cap, survives the DB pause (G4). |
| 9 | **D1 — Overture Maps ingest** | M | High | The worldwide data moat; near-copy-paste of `ingest-fsq.ts`. Pair with T4 dedupe. |
| 10 | **D2 + G2 — Smoke-free law layer + /laws pages** | M | High | Owns the #1 traveler anxiety; doubles as F1's legal fallback + SEO. |

*Sequencing note:* T5 should land just before T2/T3/D1 (it's their index foundation), and T4 (dedupe) must land **with** D1, not after — Overture bundles your existing FSQ data and will produce visible duplicates immediately.

---

## Cheapest Scalable Stack Recommendation

**Principle from the findings: split the two layers.** The basemap (roads/water/labels) and *your* points are independent — only your points need a database, and even those are near-static.

- **Basemap:** OpenFreeMap (already wired, MIT, no key, no limits) → fallback **Protomaps PMTiles on Cloudflare R2** + a ~10KB Worker. R2 has **zero egress fees**; ~$0.50 per 50k loads vs ~$350/mo on Google Maps.
- **Hot read path (your points):** **Static nightly PMTiles/GeoJSON snapshot on CDN** (T6), built by the existing nightly job with Tippecanoe. This is faster than the DB, protects Supabase's 5GB/month egress cap, and keeps the map alive even when the free project is paused.
- **Live DB (Supabase free tier):** **PostGIS + GiST** (T5) for fresh user submissions, detail pages, confirmations, auth. Reads served via **bbox + server-side cluster RPCs** (T2/T3) so low-zoom responses are ~5KB not ~5MB.
- **Edge cache (Vercel Hobby):** `s-maxage≈600` on all anon read routes with a nightly-build cache-buster (T8); `private,no-store` for admin.
- **Keepalive:** Vercel Cron → `/api/health` `select 1` every ~3 days to dodge the 7-day pause (G4).
- **Ingest (all free, commercially-usable, legal):** OSM/Overpass (ODbL), FSQ OS Places (Apache-2.0), Overture (CDLA Permissive 2.0), CDC/state license registries (US public domain), Wikidata (CC0). Run nightly via the existing `run-nightly.sh` + launchd/Vercel Cron.

**Net monthly cost at early-growth scale: ~$0**, with a clean upgrade path (Supabase Pro $25/mo removes the pause) only when traffic justifies it.

**Legal guardrails carried through the whole stack:** map only OSM-tagged venues, open POI datasets, and **government-licensed** tobacco/cannabis retailers (store the license number + authority + status). The cannabis/dispensary importers are gated on an official license-registry source — unlicensed/gray-market sellers are never ingested, and cannabis visibility stays behind the age gate + per-jurisdiction legality flag.

---

Key files referenced (all absolute):
- `/Users/phktistakis/Devoloper Projects/Smoking/scripts/scrape-osm.ts` (F1, D5)
- `/Users/phktistakis/Devoloper Projects/Smoking/scripts/ingest-fsq.ts` (D1 clone target)
- `/Users/phktistakis/Devoloper Projects/Smoking/scripts/scrape-retailers.ts` (D3)
- `/Users/phktistakis/Devoloper Projects/Smoking/scripts/cities.ts` (U4 bboxes)
- `/Users/phktistakis/Devoloper Projects/Smoking/app/components/FullMapView.tsx` (T2, `fetch(...limit=2000)` at line ~48)
- `/Users/phktistakis/Devoloper Projects/Smoking/app/components/LiveMap.tsx` (U1, T7 basemap)
- `/Users/phktistakis/Devoloper Projects/Smoking/app/api/places/route.ts` (T2/T3/T8, bbox + cache headers ~54-69)
- `/Users/phktistakis/Devoloper Projects/Smoking/app/place/[id]/PlaceDetail.tsx` (F1, U2)
- `/Users/phktistakis/Devoloper Projects/Smoking/supabase/migrations/0001_init.sql` (T5, btree index line ~58) and `0007_place_stats.sql`, `0008_storage_bucket.sql`