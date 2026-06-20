# Smoking App — Full Codebase Audit

**Stack:** Next.js 14 (App Router) + Supabase (Postgres, Storage), custom bcrypt/HMAC auth, MapLibre map, PWA, Playwright e2e.
**Branch audited:** `audit/full-review`
**Scope:** 83 raw findings across 10 dimensions, deduplicated to 55 distinct issues.

---

## Executive Summary

**Overall health: Not production-ready.** The app has a competent backend skeleton — Zod validation, bcrypt + HMAC-signed sessions, rate-limit *intent*, RLS *enabled*, four ingestion pipelines, and an e2e smoke test. But three classes of problem undercut it:

1. **Trust is broken by design.** The whole product is a directory of real, community-verified smoking spots, yet the public listing API never filters on the `verified` flag. That single omission means unmoderated user submissions go live instantly *and* admin "soft-hide" moderation does nothing. On top of that, the homepage advertises "2,184 spots across 47 cities" and "38,902 reader notes" — numbers that are pure fiction next to a real catalog of 9 seed places. A visitor who clicks "All 2,184 spots" lands on 9 pins. The product currently reads as vaporware to anyone who scrolls past the hero.

2. **A real PII leak ships.** `GET /api/places/claim` has no auth at all and returns every merchant's `contact_email`, `business_name`, and `proof_url` to any anonymous caller. This is a one-request harvest of every business owner who trusted the app with their contact details.

3. **The frontend is a 2,366-line `@ts-nocheck` monolith** with all type safety switched off, while the rest of the repo runs in strict mode. Every new feature lands here, and bugs fail silently at runtime instead of at compile time. This is the root cause behind several of the UI bugs below.

There is no CI gate, no unit tests, and the nightly data refresh runs on the author's personal Mac via `launchd` — so the catalog's freshness depends on one laptop being awake at 3am.

### Top 5 Most Urgent Issues

| # | Issue | Severity | Where |
|---|-------|----------|-------|
| 1 | `GET /api/places/claim` leaks all merchant PII (email, business, proof URL) with no auth | High | `app/api/places/claim/route.ts:64-71` |
| 2 | `GET /api/places` ignores `verified` → unmoderated + admin-hidden places stay live | High | `app/api/places/route.ts:25-41` |
| 3 | Unauthenticated `/api/recommendations` & `/api/places/google` call paid OpenAI/Groq/Google APIs (unbounded bill + free LLM proxy) | High | `app/api/recommendations/route.ts`, `app/api/places/google/route.ts` |
| 4 | Homepage hero, assistant, and footer show fabricated stats and contradictory scope | High | `app/components/SmokingApp.tsx` |
| 5 | Entire frontend is one 2,366-line `@ts-nocheck` client component | High | `app/components/SmokingApp.tsx:1-2366` |

### Counts by Severity (deduplicated)

| Severity | Count |
|----------|-------|
| High | 10 |
| Medium | 27 |
| Low | 17 |
| Info | 1 |
| **Total** | **55** |

---

## Security

### [HIGH] `GET /api/places/claim` leaks all merchant claims (PII) with no auth
**File:** `app/api/places/claim/route.ts:64-71`
**Problem:** The GET handler has no authentication, no admin check, and no rate limit. `GET /api/places/claim` runs `select('*')` on `merchant_claims` and returns every row — `contact_email`, `business_name`, `proof_url`, `user_id` — to any anonymous caller. `?placeId=` is an optional filter, not a guard: calling with no query string dumps the whole table. The frontend only ever uses the POST side (correctly gated by `requireWriter`), so this open GET serves no legitimate UI.
**Why it matters:** Business owners submit private contact details and ownership-proof documents (which `proof_url` may point at) expecting moderator-only visibility. An attacker harvests every claimant's email and business identity in one request — a direct PII breach and a ready-made phishing/spam list. The fact that the POST is gated makes this open GET especially easy to overlook.
**Severity:** High
**Fix:** Require admin on the GET handler (reuse the `requireAdmin()` pattern from `app/api/admin/flags/route.ts`), or scope the query to `.eq('user_id', user.id)` for the signed-in user. If the GET has no real caller, delete it. Never return `contact_email`/`proof_url` to non-admins.

### [HIGH] Unauthenticated legacy routes hit paid third-party APIs (cost abuse + free LLM proxy)
**File:** `app/api/recommendations/route.ts:31-168`, `app/api/places/google/route.ts:1-111`
**Problem:** Both legacy (pre-Supabase) routes accept anonymous POST/GET with no auth and no rate limit. `/api/recommendations` calls OpenAI `gpt-4o-mini` and/or Groq `llama-3.1-70b` on every request with attacker-controlled prompt context; `/api/places/google` calls Google Places Text Search. The OpenAI and Groq keys are real and present in `.env.local`. `recommendations` also instantiates an OpenAI client at module load. Neither route is referenced anywhere in `app/` or `lib/` (verified by grep).
**Why it matters:** Anyone who finds these endpoints can loop requests to burn the OpenAI/Groq/Google quota and run up an unbounded bill, and can use `/api/recommendations` as a free LLM proxy (prompt-injection passthrough) on the owner's dime. These are dead-but-shipping routes that are easy to miss in review.
**Severity:** High
**Fix:** Delete both routes (recommended — they predate the rebuild and return an inconsistent place shape). If kept, gate behind `currentUser()` + `writeLimit.check()` and a strict per-IP/day cap, validate inputs with Zod. Note `/api/places/google` uses `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` server-side — a `NEXT_PUBLIC_` key is also shipped to the browser and cannot be kept secret; use a non-public server key if the route survives.

### [HIGH] In-memory rate limiter is per-process — largely a no-op on Vercel
**File:** `lib/rate-limit.ts:35-73`
**Problem:** `authLimit`/`writeLimit` store buckets in a module-scoped `Map`. On Vercel each serverless instance is its own process, spun up/down on demand, so the counter is split across N concurrent lambdas and reset on every cold start. The auth routes import `bcryptjs` + `supabaseAdmin` (Node-only), so they run as Node serverless functions with no edge override — confirming the per-instance behavior. A single IP can effectively get ~N×10 login attempts/min, and every cold start gives a clean slate. The `setInterval` cleanup is unref'd and won't run reliably while a serverless process is frozen. The code comment itself documents this limitation, but it ships as the only limiter.
**Why it matters:** Login brute-force and content/upload spam are exactly what rate limiting exists to stop. On the actual deployment target the protection silently does almost nothing, exposing bcrypt-checked passwords to credential stuffing and the places/forum/upload tables to flooding. There is no account lockout to compensate.
**Severity:** High
**Fix:** Move the limiter to a shared store — Upstash Redis (`@upstash/ratelimit`, drop-in for the existing `check()` signature) or a Supabase `rate_limits` table with atomic upsert. As defense-in-depth, add account-level lockout (`failed_login_count` + `locked_until` on `users`) so login throttling doesn't depend on per-instance memory. Drop the `setInterval` cleanup once on Redis with TTLs.

### [MEDIUM] Forum search injects raw user input into a PostgREST `.or()` filter
**File:** `app/api/forum/posts/route.ts:20`
**Problem:** `q.or(`title.ilike.%${search}%,body.ilike.%${search}%`)` interpolates raw `search` into a PostgREST *filter-grammar* string. Unlike `.ilike(col, value)` (which parameterizes the value safely, as places search does at line 29), `.or()` parses its argument as filter syntax. A comma, parens, or a `column.op.value` token in `search` is interpreted as additional filter logic, letting a caller break out of the intended two-column match and inject clauses (e.g. `x,id.eq.<uuid>` or nested `or(...)`). The signup/login routes were *deliberately rewritten* to avoid this exact pattern, so the codebase already knows the risk — it was just left in the forum route.
**Why it matters:** Not classic SQL injection (PostgREST sits in front of Postgres), but a crafted `search` value can error the endpoint (cheap DoS), return rows the filter never intended, or act as a boolean oracle confirming row existence. It is the one place in the codebase where raw user input becomes query *logic* rather than a bound value.
**Severity:** Medium
**Fix:** Escape/strip PostgREST metacharacters (`,()*.`) before interpolation, or — cleaner — run two parameterized `.ilike()` queries and merge in app code (as the auth routes do), or switch to `.textSearch()` / a dedicated search column. Apply the same hardening anywhere `.or()`/`.filter()` takes user input.

### [MEDIUM] No CSRF protection beyond `SameSite=lax`
**File:** `lib/auth/session.ts:47-53`
**Problem:** The session cookie is `httpOnly` + `secure` (prod) + `SameSite=lax`, and all write routes authenticate solely by that cookie. There is no CSRF token, no Origin/Referer check, and no non-simple-content-type requirement. `SameSite=lax` still permits top-level cross-site POST navigations and doesn't cover all CSRF vectors.
**Why it matters:** A malicious page could ride a logged-in user's session to create reviews, forum posts, claims, or favorites on their behalf. `SameSite=lax` mitigates the common case but is the *only* line of defense — there is no defense-in-depth on any mutating endpoint.
**Severity:** Medium
**Fix:** Add an Origin/Referer allowlist check (reject mutating requests whose Origin isn't your host) in a shared write-route helper, and/or issue a double-submit CSRF token. Cheap and broadly effective alongside `SameSite`.

### [MEDIUM] Upload endpoint enforces no size or real content-type; public bucket
**File:** `app/api/upload/route.ts:21-56`
**Problem:** Any logged-in user — note this route uses `currentUser()`, **not** `requireWriter()`, so there's no email-verification gate that the other five write routes have — gets a Supabase signed upload URL. The server validates only an `ext` enum; it never sets a max file size or checks real content-type, and the bucket is `public`-read. The client then PUTs raw bytes straight to storage. Content-type is client-supplied and the signed URL is bound only to the path, not the bytes. There is no per-user quota; the only brake is the (ineffective) in-memory `writeLimit`.
**Why it matters:** Storage-cost and abuse vector: a user can upload arbitrarily large files, or files whose bytes don't match the `.jpg`/`.png` extension (HTML/SVG with script, or malware) served from a public path. SVG/HTML served public-read inline can become a stored-XSS / malware-hosting surface depending on the bucket's Content-Type handling.
**Severity:** Medium
**Fix:** Set `file_size_limit` and `allowed_mime_types` on the storage bucket. Require email verification (`requireWriter`) to match other write routes. Disallow `svg`; serve images through a transform/proxy. Add a per-user daily upload quota in the DB. Confirm the bucket can't serve files as `text/html` or `image/svg+xml` inline.

### [LOW] Sessions never rotate on login and can't be revoked app-wide
**File:** `lib/auth/session.ts:37-65`
**Problem:** `createSession` always inserts a fresh row; nothing rotates or revokes prior sessions. `destroySession` deletes only the one session tied to the current cookie. There is no "sign out everywhere," no password-change flow, and a 30-day expiry with no rotation. A stolen session id or signed cookie stays valid up to 30 days. (The cookie is HMAC-signed with a timing-safe compare, so forging/stealing is non-trivial — hence the low rating; the gap is the *absence of a kill-switch*.)
**Why it matters:** If a token leaks (shared device, log capture), the user has no way to kill all sessions and there's no rotation to shrink the exposure window.
**Severity:** Low
**Fix:** Add a "sign out everywhere" action (`delete from sessions where user_id = $1`), rotate the session on privilege changes, and invalidate existing sessions when a password-reset/change flow is added.

### [LOW] Public RLS SELECT policies ignore `verified`; anon key over-trusts public tables
**File:** `supabase/migrations/0001_init.sql:125-148`
**Problem:** RLS is enabled on all tables, but the only policies are `for select using(true)` on `places`/`reviews`/`forum_posts`/`forum_replies`, with no write policies and none on `users`/`sessions`/`favorites`/`merchant_claims` (so anon is correctly denied there). This works today because all server writes use the service-role key. The risk: `NEXT_PUBLIC_SUPABASE_ANON_KEY` ships to the browser and can directly `SELECT` all of those four tables — including unverified/soft-hidden places, compounding the `verified`-filter gap. The tables exposed hold only public user-facing content (no passwords/PII), which keeps this low.
**Why it matters:** The authorization model rests on "all writes go through service-role." That's sound now but fragile: any future direct browser use of `supabaseBrowser()` inherits unfiltered public read, and the `using(true)` policy lets a client read soft-hidden/unmoderated rows straight from the DB — a moderation bypass at the data layer.
**Severity:** Low
**Fix:** Tighten the `places` SELECT policy to `using (verified = true)`; consider column-limited views for reviews/posts. Add a CI check that no `NEXT_PUBLIC_` var ever holds the service-role key. Keep documenting that service-role must never reach the client.

### [LOW] Verbose Postgres error messages returned to clients
**File:** `app/api/places/route.ts:40` (and ~15 other routes)
**Problem:** Many routes return the raw Supabase/Postgres error string: `return NextResponse.json({ error: error.message }, { status: 500 })`. Confirmed across places, reviews, favorites, forum posts/replies, flag, claim, admin, nearby, and resend-verify. These messages can disclose column names, constraint names, and query structure.
**Why it matters:** Leaked internals help an attacker map the schema and constraints (useful for the `.or()` injection above and for crafting valid payloads). Low impact individually; it removes a layer of obscurity across the whole API surface.
**Severity:** Low
**Fix:** Log the detailed error server-side (Sentry/console) and return a generic message to the client. Keep detailed Zod validation errors for 400s — those are safe.

---

## Bugs & Logic

### [MEDIUM] Map "Retry" button leaves the map permanently blank
**File:** `app/components/LiveMap.tsx:233-239`
**Problem:** On a style-load error, the Retry button removes the map and sets `mapRef.current = null`. But the init `useEffect` (line 68) has an empty dependency array and an early-return guard `if (!containerRef.current || mapRef.current) return`. Nulling the ref doesn't re-run the effect, so no new map is ever created.
**Why it matters:** Users who hit a transient tile/style error (offline first paint, CDN hiccup) click Retry, the error message vanishes, and they're left with an empty grey container — no recovery short of a full page reload. The button looks functional but does nothing.
**Severity:** Medium
**Fix:** Drive re-init with state: add a `retryCount` state, include it in the effect deps, and have Retry increment it after removing the old map.

### [MEDIUM] Search results race — a slow earlier query can overwrite newer results
**File:** `app/components/SmokingApp.tsx:302-314`
**Problem:** The debounced search effect fires `fetch('/api/places?q=...')` with no `AbortController` and no sequence/stale guard. Fast typing lets an earlier request resolve after a later one (network reordering / variable latency), and its `setResults` overwrites the correct one. Cleanup clears only the timeout, not the in-flight fetch. The "near me" path shares the same `setResults` sink.
**Why it matters:** Users occasionally see results for a query they already edited away from (results for "lis" while the box says "lisbon"), hiding the right matches and looking buggy.
**Severity:** Medium
**Fix:** Capture an `AbortController` per effect run and abort in cleanup, or track a monotonically increasing request id and ignore stale responses before calling `setResults`.

### [MEDIUM] Favorites sync drops every non-seed (UUID) favorite — real places can't be saved
**File:** `app/components/SmokingApp.tsx:2266-2289`
**Problem:** The one-shot server hydration only maps server favorites back to local state when `external_id` starts with `'seed:'` (line 2270). Favorites whose place has any other `external_id` (user-submitted, OSM/scraper places) are silently skipped. `toggleFav` stores slug ids only, and live/user places never render a save control anywhere — only the 9 editorial seed rows have hearts.
**Why it matters:** Saving any real/live place is effectively impossible, and even an existing UUID favorite is dropped on hydration. The "follows you across devices" promise only works for 9 hard-coded seed spots. The elaborate slug↔UUID round-trip gives a false impression that all places are saveable.
**Severity:** Medium
**Fix:** Track favorites as DB place UUIDs (or carry both id and `external_id`), render a save control on live place cards/map popups, and in hydration union *all* server favorites regardless of `external_id` prefix.

### [LOW] `/api/places/nearby` breaks across the antimeridian and at the poles
**File:** `app/api/places/nearby/route.ts:32-40`
**Problem:** The bbox pre-filter uses `lng ± dLng` with plain `.gte`/`.lte`. Near ±180° the box doesn't wrap (lng=179, dLng=2 → 177..181), excluding places just across the line. The `cos(lat)` guard clamps to 0.01, making `dLng` up to ~100× `radiusKm` near the poles and pulling a huge candidate set before the limit cap.
**Why it matters:** Users searching "near me" close to the 180° meridian (Fiji, far-east Russia, parts of NZ) silently miss nearby spots on the other side. A correctness edge case, not a crash.
**Severity:** Low
**Fix:** Detect box wrap and issue an OR over the two split ranges (or accept the over-fetch and rely on the haversine sort+slice). At the poles, cap `dLng` at 180 and skip the lng filter. (Subsumed long-term by the PostGIS recommendation below.)

### [LOW] Forum reply count is desynced from real replies
**File:** `app/components/SmokingApp.tsx:1564-1567, 1602-1611, 1685-1687`
**Problem:** Real posts from the API are always assigned `replies: 0` regardless of DB reply count (the GET response has no count). The displayed count only increments when *this* client posts a reply in the current session.
**Why it matters:** A thread with 10 existing replies shows 0 until you reply yourself. The page-total "X replies" is almost always wrong. Undermines the forum's at-a-glance signal.
**Severity:** Low
**Fix:** Return a reply count from `/api/forum/posts` (a `count` aggregate on `forum_replies`) and map it into `replies` instead of hard-coding 0.

### [LOW] Optimistic review replace matches on username, not user id
**File:** `app/place/[id]/PlaceDetail.tsx:65-77`
**Problem:** After posting, the optimistic update filters existing reviews by `r.users?.username !== user.username`. But reviews are upserted server-side keyed on `(place_id, user_id)` — identity is the user id, not username. Matching on username removes the wrong row if two display names collide, and a review with a null `users` join is treated as "not me" even when it's the user's own.
**Why it matters:** Can momentarily show a duplicate of your own review or drop someone else's until refresh. Low impact (reload corrects it) but logically keyed on the wrong field.
**Severity:** Low
**Fix:** Filter by `user_id` (return it in the review payload), or replace by the returned review id from the upsert response.

---

## Performance

### [HIGH] `GET /api/places` returns full rows, no projection, no order, up to 2000 rows
**File:** `app/api/places/route.ts:20-41`
**Problem:** The handler does `select('*').limit(limit)` (default 500, capped 2000), selecting every column including large text fields (`description`, `notes`, `tags[]`, `photo_url`), with no `.order()` — so past the limit Postgres returns an arbitrary, nondeterministic slice. The map view requests 500 rows and FullMapView 2000; every row's full payload is serialized to JSON, shipped to the browser, and re-clustered client-side. The list view shows only 200 rows yet downloads 500/2000.
**Why it matters:** The map is the core feature. Once the OSM/FSQ scrapers populate the table (the FSQ ingest targets 5000/city across 46 cities), a single map load downloads a multi-megabyte JSON blob and parses it on the main thread before MapLibre can cluster — seconds of blank map and jank on mobile.
**Severity:** High
**Fix:** Project only needed columns: `.select('id,external_id,name,type,lat,lng,city,country,verified,source')`. Add `.order('id')` for deterministic pagination. For the map, use the existing bbox path scoped to the viewport with a lower limit; give the list a separate small paginated endpoint. Consider returning minimal GeoJSON features directly.

### [HIGH] Place search uses leading-wildcard ILIKE with no trigram index — sequential scan per keystroke
**File:** `app/api/places/route.ts:29`
**Problem:** `query.ilike('name', '%${q}%')`. A leading-wildcard `%...%` ILIKE cannot use a B-tree index, and no GIN/`pg_trgm` index exists in any migration. The SearchBox fires this (debounced 250ms) on every keystroke. Same pattern in the forum `.or(...)` search.
**Why it matters:** Each search forces a full table scan. With scrapers populating tens of thousands of rows, type-ahead search degrades progressively and spikes DB CPU on a path triggered by normal typing.
**Severity:** High
**Fix:** Add `create extension if not exists pg_trgm;` and `create index places_name_trgm_idx on public.places using gin (name gin_trgm_ops);` in a new migration. Alternatively switch to Postgres full-text search (`tsvector` + GIN). Apply the same to the forum search.

### [MEDIUM] bbox/nearby geo queries can't use a true 2D spatial index
**File:** `app/api/places/route.ts:32-37`; `app/api/places/nearby/route.ts:35-53`; `supabase/migrations/0001_init.sql:57-58`
**Problem:** Coordinates are `lat`/`lng` `double precision` with a composite B-tree `places_lat_lng_idx (lat, lng)` — not PostGIS `geography(Point,4326)` with a GiST index. A composite B-tree only ranges efficiently on its leading column (lat); the lng range becomes a filter over the whole lat band. `nearby` over-fetches `limit*4` (up to 1000 rows) and computes Haversine + sorts in Node. The migration comment already flags "switch to PostGIS later."
**Why it matters:** Bounding-box and "near me" — the whole point of a geo directory — degrade to scanning a horizontal band across the globe at a given latitude, getting slower with every ingested row, and ship up to 1000 rows to the app for distance math. PostGIS `ST_DWithin` on a GiST-indexed geography column is correct (incl. antimeridian) and orders of magnitude faster. *(No current production impact — only ~9 seed rows today — but it's a guaranteed cliff once ingestion runs.)*
**Severity:** Medium
**Fix:** Enable PostGIS, add a `geog geography(Point,4326)` column + GiST index, rewrite nearby to `ST_DWithin(geog, ST_MakePoint(lng,lat)::geography, radiusKm*1000)` ordered by `geog <-> point`, and use `&&` bbox operators for the map. This also fixes the antimeridian/pole bug above.

### [MEDIUM] `SmokingApp` ships ~40KB of editorial seed arrays into the client bundle
**File:** `app/components/SmokingApp.tsx:21-1040`
**Problem:** `PLACES`, `THREADS`, `RECS`, `CONTINENT_PATHS` are large literals at module top-level in the single `'use client'` component (~40KB of source). All of it is parsed and shipped to every visitor even though most is only fallback/demo content.
**Why it matters:** Every first paint downloads and parses this dead weight on top of the MapLibre bundle. For a PWA whose value is fast mobile loads, shipping kilobytes of demo data the backend is meant to replace is pure overhead.
**Severity:** Medium
**Fix:** Move seed/fallback arrays into a separate module imported lazily only on the error/empty path. Split `SmokingApp` into route-level chunks (HomeView/PlacesView/ForumView/SavedView) with `dynamic` import (the map already uses `next/dynamic`).

### [MEDIUM] Top-level `App` holds all state → whole-tree re-renders; children not memoized
**File:** `app/components/SmokingApp.tsx:2203-2363`
**Problem:** `App()` holds route, theme, favorites, user, and all modal flags, passing `favorites`/`toggleFav` to every view. `toggleFav` is recreated each render (no `useCallback`), and no heavy child (HomeView, PlacesView, ForumView, the list rows) is `React.memo`'d. So toggling one favorite re-renders the whole active view and re-runs the inline `visible` filter (line 1315-1317, not `useMemo`'d) over up to 500 rows.
**Why it matters:** Favoriting one heart re-renders the whole list and re-filters hundreds of rows, showing as input lag and dropped frames. Cost grows with the live dataset.
**Severity:** Medium
**Fix:** Wrap `toggleFav` in `useCallback`, memo the list-row and view components, move `visible` into `useMemo` keyed on `[data.places, typeFilter]`. Long-term, lift favorites into a context so only consumers re-render.

### [MEDIUM] Map renders every place individually with no server-side viewport filtering
**File:** `app/components/LiveMap.tsx:50-66, 101-107`; `app/components/FullMapView.tsx:48`
**Problem:** `LiveMap` builds a full GeoJSON FeatureCollection from the entire `places` array and clusters client-side. The parent always passes the full result of `/api/places?limit=500` (or 2000 in FullMapView) regardless of viewport — no bbox-scoped fetch on map move. The route *supports* bbox; the components just don't pass it. So the map silently shows an arbitrary 2000 of however-many places, not what's in view.
**Why it matters:** All clustering runs in the browser over the full dataset; combined with the unprojected `select('*')` payload, the map holds the global dataset in memory and re-tessellates even when zoomed into one city. This is the main driver of janky map interaction once data is real, and a correctness bug (wrong rows shown).
**Severity:** Medium
**Fix:** Wire the map's `moveend` to refetch `/api/places?bbox=...&limit=...` (debounced) for the current viewport; keep clustering client-side but only over visible rows. Add server-side clustering or a zoom-gated point cap for low zoom.

### [MEDIUM] Render-blocking Google Fonts via raw `<link>` instead of `next/font`
**File:** `app/layout.tsx:41-46`
**Problem:** Three font families (Instrument Serif, Space Grotesk, JetBrains Mono, multiple weights) load via a hand-written `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?...">` in `<head>` — a render-blocking request to a third-party origin on the critical path. `next/font` (self-hosts, inlines, adds `size-adjust`) isn't used.
**Why it matters:** Every page load blocks first paint on a Google Fonts round-trip (DNS + connect + CSS + font files). On slow mobile this delays text and adds flash; for an offline-first PWA it hurts the offline story (fonts cached only after first online visit).
**Severity:** Medium
**Fix:** Switch to `next/font/google` for the three families — self-hosts files, removes the render-blocking request, cuts layout shift. Keeps `display=swap` benefit and improves offline behavior.

### [LOW] Scrapers run cities strictly sequentially with no concurrency or backoff
**File:** `scripts/scrape-osm.ts:120-141`; `scripts/ingest-fsq.ts:98-133`
**Problem:** `main()` loops 46 cities one at a time, awaiting each Overpass query (up to 90s timeout) plus a fixed 2000ms sleep. FSQ ingest is also fully sequential with a `LIMIT 5000` parquet scan per city. No parallelism cap, no 429-aware retry/backoff — a single failure logs and moves on.
**Why it matters:** A full OSM refresh is worst-case ~46 × (90s + 2s) ≈ over an hour of wall-clock nightly, and Overpass 429s silently drop a city's data. Offline tooling, so impact is indirect (stale/incomplete map data), but it limits freshness.
**Severity:** Low
**Fix:** Keep Overpass sequential but add 429-aware exponential backoff instead of the fixed sleep. For FSQ (independent DuckDB queries), run a small concurrency pool (3-4 cities). Log per-city row counts and a final summary so partial failures are visible.

### [LOW] Place detail page does redundant sequential DB round-trips
**File:** `app/place/[id]/page.tsx:43-52`
**Problem:** `Page()` awaits `loadPlace(params.id)` then `loadReviews(place.id)` sequentially. `generateMetadata()` also calls `loadPlace` independently, so one place page can issue `loadPlace` *twice* plus `loadReviews` — three round-trips, two identical.
**Why it matters:** The most-linked page (every map pin and search result deep-links here) pays for a duplicate place fetch on every view.
**Severity:** Low
**Fix:** Memoize `loadPlace` per request with React's `cache()` so `generateMetadata` and `Page` share one query. Optionally fetch reviews via a Supabase embedded select (`places.select('*, reviews(...)')`).

### [LOW] PWA caches full-snapshot `/api/places` responses, amplifying payload size
**File:** `next.config.js:27-35`
**Problem:** The runtime cache stores up to 50 `/api/places` URLs (StaleWhileRevalidate, 24h). Because the app fetches `?limit=500`/`?limit=2000` full-table snapshots rather than bbox-scoped queries, each cached entry is a large multi-row blob, so the cache fills with whole-dataset snapshots.
**Why it matters:** The service worker caches megabyte-scale responses; storage grows and the offline list replays a stale full snapshot. A symptom of the unscoped API rather than a standalone bug.
**Severity:** Low
**Fix:** After projecting columns and adding bbox-scoped fetches, entries shrink naturally. Consider NetworkFirst with a short timeout for `/api/places` so online users get fresh data, keeping a small SWR cache only for the offline fallback.

---

## Architecture & Code Quality

### [HIGH] Split the 2,366-line `@ts-nocheck` `SmokingApp.tsx` monolith
**File:** `app/components/SmokingApp.tsx:1-2366`
**Problem:** The entire frontend is one client component: 2,366 lines, `// @ts-nocheck` + `/* eslint-disable */`, 19 in-file components, 52 `useState` calls, 18 inline `fetch()` calls, and all editorial seed data alongside live-data components. `App()` holds all global state including the subtle favorites slug↔UUID sync across 4 effects + a ref cache. `@ts-nocheck` disables *all* type safety on the file even though the repo runs `strict: true`.
**Why it matters:** This is the single hardest file to change safely. With types off, a typo in a prop, a renamed API field, or a wrong `p.type` fails silently at runtime — exactly the favorites/place-shape code that's already "best-effort/fire-and-forget." Every new feature lands here and inflates it. It's also untestable as a unit.
**Severity:** High
**Fix:** Incrementally extract: (1) seed arrays → typed `lib/seed-data.ts`; (2) each modal and view into its own file under `app/components/`; (3) lift favorites + auth into typed contexts/hooks (`useFavorites`, `useAuth`) so they're testable; (4) remove `@ts-nocheck`/`eslint-disable` per-file as each piece is typed, reusing existing `Place`/`User` types. File-by-file so each PR stays reviewable.

### [HIGH] No service/data layer — every route hand-rolls Supabase queries inline
**File:** `app/api/places/route.ts:25-41` (representative of ~22 routes)
**Problem:** There is no `lib/services` or repository layer. Every route calls `supabaseAdmin()` directly and builds PostgREST queries inline; places GET, reviews GET, forum posts GET, nearby, and the place-detail page each independently encode the `places` table shape, column lists, and filter logic. The `users:users(username, avatar_url)` join string is duplicated across reviews, forum posts, replies, and the place page.
**Why it matters:** Business rules live nowhere central, so they drift. The clearest symptom: the "only show verified places" rule is simply *absent* from places GET and nearby GET — silently defeating moderation. A service layer would have made that one function every read path calls. Column-list duplication means a schema change requires editing ~6 files and is easy to half-finish.
**Severity:** High
**Fix:** Add `lib/services/places.ts` (`listPlaces`, `getPlaceByIdOrSlug`, `createUserPlace`), `lib/services/reviews.ts`, `lib/services/forum.ts`. Centralize the user-join select and the `verified`/visibility rule so every read path enforces them identically. Routes become thin: parse → validate → call service → shape response.

### [MEDIUM] Per-route auth/rate-limit/error boilerplate is copy-pasted across ~8 write routes
**File:** `app/api/places/route.ts:59-71` (and every write route)
**Problem:** Three identical blocks are duplicated verbatim across places, reviews, forum posts/replies, claim, upload, flag: (1) the `writeLimit.check` line, (2) the `requireWriter()` gate, (3) the Zod parse try/catch. The `{ error: error.message }, { status: 500 }` shape is repeated on every Supabase error. Admin auth is hand-rolled in two different shapes (`requireAdmin()` returning `{user, deny}` vs an inline check in the admin queue page).
**Why it matters:** Each copy is a chance to forget the rate-limit line or auth gate and ship an unprotected endpoint — "any new route that forgets the check is unprotected by default." Inconsistent error shapes also make the frontend brittle (it reads `j.error` sometimes, `j.details` others).
**Severity:** Medium
**Fix:** Add `withWriter(req, key, schema, handler)` that runs rate-limit → `requireWriter` → Zod-parse and returns standardized 400/401/403/429/500 JSON, calling `handler(user, parsedBody)` only on success. Same for `withAdmin`. Define one `jsonError(status, message)`. Removes ~15 lines/route and makes the auth gate impossible to forget.

### [MEDIUM] Place-type enum and the Supabase admin client are each defined twice
**File:** `app/api/places/route.ts:7-9`; `lib/supabase/admin.ts:7-23` vs `scripts/lib/db.ts:4-15`
**Problem:** (1) The place-type list is hardcoded as `PLACE_TYPES` in the route, duplicating `PlaceType` in `lib/supabase/types.ts`, the AddPlaceModal `<option>` list, and the LivePlacesView `typeCounts` object — four hand-maintained copies. (2) The service-role client is built twice with near-identical code.
**Why it matters:** Adding a new place type (e.g. `hookah_lounge`) requires editing ≥4 places plus the DB CHECK constraint; miss one and the UI offers a type the API rejects, or the filter never counts it — surfacing as confusing "Invalid input" errors.
**Severity:** Medium
**Fix:** Export `PLACE_TYPES` as a `const` tuple from `lib/supabase/types.ts` and derive `PlaceType = typeof PLACE_TYPES[number]`; import it into the Zod enum, modal options, and filter counts. Share one admin-client factory (`lib/supabase/create-admin.ts`) that both `supabaseAdmin()` and the scripts' `adminClient()` call.

### [MEDIUM] Dead legacy routes still ship: `/api/places/google` and `/api/recommendations`
**File:** `app/api/places/google/route.ts:1-111`; `app/api/recommendations/route.ts`
**Problem:** Both are pre-Supabase routes, unreferenced anywhere (verified by grep), and architecturally inconsistent: `places/google` returns a different place shape (`googlePlaceId`, `verified: true`, no DB write) with `error: 'msg'` strings (no Zod) and no auth/rate-limit; `recommendations` (169 lines) instantiates an OpenAI client at module load and dynamically imports Groq, also with no auth/rate-limit. *(Security impact tracked above under "Unauthenticated legacy routes hit paid APIs" — this entry is the code-hygiene angle.)*
**Why it matters:** Beyond the cost-abuse vector, two contradictory "place" shapes confuse future readers, and `recommendations` loads an OpenAI client even when unused.
**Severity:** Medium
**Fix:** Delete both files and the unused `openai`/`groq-sdk` deps. If recommendations are wanted later, rebuild against Supabase data + the standardized auth/rate-limit helper.

### [MEDIUM] Editorial seed data is intermixed with live data in the UI and fallback paths
**File:** `app/components/SmokingApp.tsx:21-167, 1091-1268, 1335-1368`
**Problem:** Hardcoded editorial `PLACES` (slugs, ratings, quotes, photo numbers) live in the same file as live-data views and are used as a runtime fallback: LivePlacesView renders seed `PLACES` when the API errors and feeds seed coords into the live map when the API is empty. The favorites system keys off seed slugs and resolves them via `external_id LIKE 'seed:...'`, so the seed/live boundary leaks into core state logic.
**Why it matters:** Users can be shown two different "truths" depending on whether Supabase is reachable, and a saved favorite is sometimes a slug, sometimes a UUID. Mixing marketing copy (fake quotes/counts) with live records makes it impossible to reason about what a user is looking at.
**Severity:** Medium
**Fix:** Move seed data to typed `lib/seed-data.ts`; make the seed-vs-live decision explicit and single-sourced — either always seed the DB (live is the only path) or show a clear "demo data" banner on fallback, never silently blending. Replace hardcoded counts with values derived from fetched data.

### [LOW] RLS is enabled but every path uses the service-role key — RLS is a no-op in practice
**File:** `supabase/migrations/0001_init.sql:125-147`; `lib/supabase/admin.ts`
**Problem:** RLS is enabled with public SELECT and no write policies, but all reads *and* writes go through `supabaseAdmin()` (service-role, bypasses RLS). The anon/browser client isn't the data path. So RLS protects nothing the app uses; authorization lives entirely in route handlers, and admin routes rely on in-handler checks, not middleware.
**Why it matters:** Defense-in-depth is illusory — a single forgotten auth check in a new route is the only thing between a caller and a service-role write. No DB-level backstop. Acceptable architecturally, but should be a *documented decision*, not assumed protection.
**Severity:** Low
**Fix:** Either (a) document explicitly that route handlers are the sole authz layer and add a checklist/lint for new routes, or (b) move public reads to the anon client + RLS SELECT policies (`using (verified = true)`) and reserve service-role for privileged writes, making RLS a real backstop. At minimum add per-table write RLS policies even if unused today.

### [LOW] Every API route uses the service-role key — no read/write or RLS separation under load
**File:** `lib/supabase/admin.ts`
**Problem:** All 21 routes go through the service-role client. The hot public read path (`GET /api/places`, every load) shares the same elevated key and connection path as privileged writes; there's no server-side anon-key read client, so read traffic can't be pooled/cached differently from writes. *(Closely related to the RLS-no-op finding; kept separate for the load/connection angle.)*
**Why it matters:** At scale, the cheapest-to-scale read traffic is coupled to the most sensitive credential with no RLS backstop on the part of the app most likely to be refactored carelessly.
**Severity:** Low
**Fix:** Use the anon key (public SELECT policies already exist) for the public `GET /api/places` read path, reserving service-role for writes/admin. Combine with the CDN caching fix so most reads never reach Postgres.

---

## UI/UX & Accessibility

### [HIGH] Hero stats are hardcoded fiction that contradicts the real catalog
**File:** `app/components/SmokingApp.tsx:758-770, 738, 782`
**Problem:** The home hero shows hardcoded counts — "2,184" spots, "47 cities / 23 countries", "38,902 reader notes" — plus an eyebrow "An atlas of 47 cities" and a CTA "All 2,184 spots." None come from the database. The real data lives only on the "Live" tab; the editorial seed is exactly 9 places. Clicking "All 2,184 spots" lands on 9 seed pins; the Live tab may read "0 of 0 live places" if the scraper hasn't run.
**Why it matters:** This is the first thing every visitor sees and it's demonstrably false. The promised scale doesn't exist, eroding trust the moment a user explores. It reads as vaporware.
**Severity:** High
**Fix:** Fetch real aggregate counts (a lightweight `/api/places?count` endpoint) and render those, or remove the numeric stats and the "2,184 spots" CTA label. At minimum make the hero CTA and stats consistent with what the Places view actually shows.

### [HIGH] Seed editorial data is silently intermixed with real data
**File:** `app/components/SmokingApp.tsx:21-166, 1091-1268, 1335-1368`
**Problem:** Home, the default map/list/globe modes, and SavedView render the 9 hardcoded `PLACES` with invented ratings ("★ 4.8"), fictional quotes, and a fake "saved 3 days ago" label. Only the "Live" tab pulls from `/api/places`, and even it falls back to the same 9 seed pins when the API is empty, with no on-map label that they're placeholders. Seed pins link to `/place/<slug>`, which only resolves if the seed-loader ran against Supabase — otherwise the detail page shows "Database not configured."
**Why it matters:** Users can't tell which spots are real community contributions and which are decorative samples. Ratings and "saved X days ago" are fabricated, and clicking a seed pin can dead-end on an error page. Undermines the core directory promise.
**Severity:** High
**Fix:** Make "Live" the default Places view; badge seed/editorial spots as "sample" or remove them from main flows; stop showing fabricated ratings and timestamps; ensure seed slugs always resolve or aren't linked.

### [HIGH] Modals lack dialog semantics, focus trap, focus restoration, Escape-to-close
**File:** `app/components/SmokingApp.tsx:1975-1980, 2105-2110, 511-514`
**Problem:** AuthModal, AddPlaceModal, and MerchantClaimModal render a `.modal-bg/.modal` with only a close button — no `role="dialog"`, no `aria-modal`, no `aria-labelledby`, no Escape handler, no focus trap, no focus move on open / restore on close, and no body-scroll lock. (Only `AgeGate.tsx` has the proper pattern.)
**Why it matters:** Keyboard and screen-reader users can't reliably operate these modals: Tab walks behind the dialog, Escape does nothing, and screen readers don't announce a dialog. A core WCAG failure on the primary sign-in/add/claim flows — effectively locking some users out of contributing.
**Severity:** High
**Fix:** Add `role="dialog" aria-modal="true"` and `aria-labelledby` → the `<h2>`; move focus into the dialog on open and trap Tab; close on Escape; restore focus to the trigger on close; lock body scroll. Reuse the `AgeGate.tsx` pattern.

### [HIGH] App body is hardcoded English; only the header is translated, breaking i18n/RTL
**File:** `app/components/SmokingApp.tsx:7, 295, 395`
**Problem:** `useTranslations` is used in exactly two places, both in the header. Every other surface — hero, cards, recommendations, all Places/Live/List/Globe views, SavedView, ForumView, all three modals, the assistant, the footer — is hardcoded English literals, despite `messages/{es,ja,pt,ar}.json` existing (and `en.json` defining auth/addPlace/forum/saved/common keys the components never read). Selecting Japanese or Arabic translates only the nav. For Arabic, the layout flips to RTL but the content stays English LTR inside an RTL frame.
**Why it matters:** The language picker advertises 5 languages but delivers a half-translated UI. An Arabic speaker gets an RTL shell wrapped around English paragraphs — worse than no translation. The written translation files are dead weight.
**Severity:** High
**Fix:** Wire the existing keys into AuthModal, AddPlaceModal, MerchantClaimModal, ForumView, SavedView, and the home/places copy. Until coverage is real, hide locales that aren't substantially translated so the picker doesn't over-promise.

### [MEDIUM] "Regenerate" button and OpenAI/Groq engine toggle are non-functional dead controls
**File:** `app/components/SmokingApp.tsx:822-823, 277-288`
**Problem:** The home recommendations strip renders a "Regenerate" button with no `onClick`. Next to it, `ProviderToggle` renders an "Engine: OpenAI / Groq" switch that only flips local state and changes nothing. The three RECS are a hardcoded editorial list, yet copy says "drawn from your saved spots" and "Re-roll any time."
**Why it matters:** Buttons that look interactive but do nothing make the product feel broken. The personalization framing promises something that doesn't exist.
**Severity:** Medium
**Fix:** Wire "Regenerate" to a real recommendations route or remove it. Remove the user-facing engine toggle (an internal/legacy concept). If recs are static, drop the "drawn from your saved spots" / "Re-roll any time" copy.

### [MEDIUM] Assistant FAB returns canned answers and repeats the fake "2,184 spots" claim
**File:** `app/components/SmokingApp.tsx:635-664`
**Problem:** The "Ask the assistant" button opens a chat ("Ash") whose replies are hardcoded string-matching on "lisbon"/"tokyo"/"rooftop"/etc. Any unmatched query returns "We have 2,184 spots across 47 cities" — the fabricated number again — with a fake 900ms typing indicator. It can't answer about real places or perform the "Want me to take you there?" navigation it offers.
**Why it matters:** It presents as an AI concierge but is a scripted demo. Users asking real questions get irrelevant canned text plus a false catalog size, and lose confidence. The "Online" dot reinforces the illusion.
**Severity:** Medium
**Fix:** Connect Ash to a real search/recommendations route, or clearly label it as a scripted demo / remove it for launch. Remove the hardcoded "2,184 spots" fallback.

### [MEDIUM] Footer copy contradicts the product (Athens/Thessaloniki-only)
**File:** `app/components/SmokingApp.tsx:1832, 1844-1849, 1861`
**Problem:** The footer reads "an independent reader-kept field guide to Athens & Thessaloniki," lists only those two cities, and the copyright says "© 2026 Smoking · Athens" — while the rest of the app markets a worldwide atlas of "47 cities, 23 countries" (Tokyo, Lisbon, Berlin, Paris).
**Why it matters:** Two different products described on one page. A user reading "from Tokyo to Lisbon" then "field guide to Athens & Thessaloniki" sees an obvious inconsistency that signals mismatched templates.
**Severity:** Medium
**Fix:** Pick one scope and make all copy consistent. If worldwide, rewrite the colophon and Cities list (or make Cities dynamic) and drop the Athens-specific tagline.

### [MEDIUM] Footer "Cities", "Submit a city", and "Contact" links are dead (`href="#"`)
**File:** `app/components/SmokingApp.tsx:1846-1848, 1857`
**Problem:** "Athens", "Thessaloniki", "Submit a city", and "Contact" all use `href="#"` with no handler. Only Privacy/Terms are real routes.
**Why it matters:** Dead footer links are a classic trust/quality signal. "Contact" is one users actively look for.
**Severity:** Medium
**Fix:** Point these at real destinations (a city filter, a contact page, the Add Place flow) or remove until they exist.

### [MEDIUM] Theme isn't persisted and SSR hardcodes light — flash + reset on every reload
**File:** `app/components/SmokingApp.tsx:2205, 2220-2222`
**Problem:** Theme initializes to `'light'` and applies via effect; it's never written to or read from localStorage, and `app/layout.tsx` server-renders `<html data-theme="light">` unconditionally with no `prefers-color-scheme` detection. So a dark-mode choice reverts on every navigation/reload, and dark users always get a light flash first.
**Why it matters:** A theme toggle that forgets your choice feels broken, and the light-to-dark flash is jarring — visible quality regressions, especially for dark-mode users.
**Severity:** Medium
**Fix:** Persist theme to localStorage and read on init; apply via a tiny inline `<script>` in `<head>` before paint to avoid the flash; optionally seed from `prefers-color-scheme` on first visit.

### [MEDIUM] Forum like button and seed reply counts are fake local-only state
**File:** `app/components/SmokingApp.tsx:1621-1623, 1776-1778, 170-223`
**Problem:** Seed threads ship invented like counts (42, 21, 47…) and reply counts (18, 9, 22…). The heart/like button only mutates local React state — likes are never persisted and reset on reload. Seed threads can't accept replies (blocked with "This is a seed thread"), yet display reply counts that show nothing on expand (`loadReplies` is a no-op for non-UUID ids).
**Why it matters:** A thread that says "18 replies" but shows zero on expand, and a like that forgets every press on refresh, both read as broken. The forum looks active but is mostly inert decoration.
**Severity:** Medium
**Fix:** Persist likes via an API and load real reply counts, or drop the fake counts and clearly mark seed threads as samples. Don't show a reply count the expand panel can't honor.

### [MEDIUM] AddPlaceModal copy promises moderation the listing API doesn't enforce
**File:** `app/components/SmokingApp.tsx:1983-1985`
**Problem:** The modal says "Other readers will see it once a moderator confirms it isn't spam," but `GET /api/places` doesn't filter on `verified`, so user submissions (inserted `verified=false`) appear immediately. *(Same root cause as the moderation finding under Data Integrity.)*
**Why it matters:** The copy sets an expectation (review before publish) the backend contradicts — a trust issue for contributors and a content-safety gap, since the promised spam check never happens.
**Severity:** Medium
**Fix:** Either enforce the gate (filter `verified=true`) so the copy is true, or change the copy to "appears immediately, reviewed afterward."

### [LOW] Live tab / FullMapView leak developer-facing copy in empty and error states
**File:** `app/components/SmokingApp.tsx:1290-1305, 1357-1368`
**Problem:** LivePlacesView shows only a text "Loading…" (no map skeleton), caps the list at 200 rows with a developer note telling users to "use the bbox query on /api/places," and on error surfaces the raw error string plus instructions to read "SETUP_SUPABASE.md" and run "npm run scrape:osm."
**Why it matters:** Error/empty states leak ops language ("Supabase", "SETUP_SUPABASE.md", "npm run scrape:osm", "bbox query") to end users who can't act on it. Reads like a half-deployed dev build.
**Severity:** Low
**Fix:** Replace dev copy with user-facing messages ("No spots here yet — be the first to add one"), add a map loading state, and move setup hints to logs/console.

### [LOW] No "Directions / navigate here" action on place detail
**File:** `app/place/[id]/PlaceDetail.tsx:128-137`; `app/components/LiveMap.tsx:169-178`
**Problem:** The detail page links to OpenStreetMap centered on the spot but offers no directions/navigation, and the map popup only offers "Open ↗" to the detail page. For a directory whose whole purpose is "go to this spot," there's no way to get directions.
**Why it matters:** Users of a physical-place directory overwhelmingly want to navigate there; on mobile a "Directions" deep link is the expected primary action. A static OSM view isn't directions.
**Severity:** Low
**Fix:** Add a "Directions" button opening a maps deep link, e.g. `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>` or a `geo:` URI, alongside the OSM link.

### [LOW] SPA nav uses `href="#"` + preventDefault, breaking new-tab and back button
**File:** `app/components/SmokingApp.tsx:405-419, 781, 1838-1840`
**Problem:** Brand, nav items, footer "Read" links, and "All spots" are `<a href="#">` with `onClick` `preventDefault` calling `setRoute`. Routing is client state only — there are no real URLs for home/places/saved/forum. Cmd/Ctrl-click and "open in new tab" do nothing useful, the back button doesn't move between views, and the address bar never reflects the section.
**Why it matters:** Users expect to bookmark/share "the forum" or "saved" and use back/forward between sections. None of that works, and middle-click/new-tab silently fails — a real usability/accessibility gap.
**Severity:** Low
**Fix:** Use Next.js routes (`/`, `/places`, `/saved`, `/forum`) with `next/link`, or at least push history state so URLs reflect the view and back/forward/new-tab behave.

### [LOW] ImageUploader preview has empty `alt` while conveying upload result
**File:** `app/components/ImageUploader.tsx:77-79`
**Problem:** After a successful upload, the preview renders with `alt=""` (marked decorative), but it's the only confirmation of what uploaded.
**Why it matters:** Screen-reader users get no confirmation of the upload result.
**Severity:** Low
**Fix:** Give the preview meaningful alt text, e.g. `alt="Uploaded image preview"` (or the filename).

---

## Backend & Database

### [HIGH] `GET /api/places` returns unverified + soft-hidden places — moderation is a no-op
**File:** `app/api/places/route.ts:25-41`; `app/api/admin/flags/route.ts:41`
**Problem:** The GET query never filters on `verified`. User submissions insert with `verified=false` (DB default), and the admin moderation action *soft-hides* a flagged place by setting `verified=false`. Because GET ignores `verified`, both unmoderated submissions AND admin-hidden places stay fully visible on the list, map, and search. Consumers don't compensate — `verified` is used only as a display badge.
**Why it matters:** Two trust failures at once. (1) Any logged-in, email-verified user can post a place that goes live instantly despite the AddPlace UI promising moderator review. (2) When an admin "actions" a flagged place to hide it, it stays visible — the moderation queue does nothing for places, including doxxing/abusive content an admin believes they removed. This is the highest-impact correctness/trust bug in the backend.
**Severity:** High
**Fix:** Default the public GET to `.eq('verified', true)`, with an opt-in `?includeUnverified=1` gated to admin contexts. Apply the same to `/api/places/nearby` and the map feed. When fixing, verify (a) seed places are `verified=true` (they are), (b) place-detail by `external_id` still loads an author's own unverified place if desired, (c) the AddPlace success UI reflects "pending review." Fix the read filter and the POST default *as a pair*.

### [HIGH] FSQ ingest writes `source='fsq'` that violates the places CHECK constraint — every upsert fails
**File:** `scripts/ingest-fsq.ts:109-123`; `supabase/migrations/0001_init.sql:32`
**Problem:** The Foursquare ingest builds rows with `source: 'fsq'`, but the `places.source` CHECK constraint allows only `('user','osm','google','retailer','seed')`. Postgres rejects every chunk with a check_violation; the loop logs the error and `break`s, so zero FSQ rows ever land. No later migration adds `'fsq'`, and `'fsq'` isn't in the `PlaceSource` type either. (The `fsq:` `external_id` prefix is fine — only the `source` value is invalid.)
**Why it matters:** One of the four documented ingestion pipelines — positioned as the bulk-coverage source (~100M POIs) — is completely broken and silently so. An operator running `npm run ingest:fsq` gets zero rows and a cryptic constraint error. The "1M places" scenario is unreachable via the documented pipeline; the catalog stays limited to OSM + seed.
**Severity:** High
**Fix:** Add `'fsq'` to the constraint via a new migration: `alter table public.places drop constraint places_source_check, add constraint places_source_check check (source in ('user','osm','google','retailer','seed','fsq'));` and to the `PlaceSource` union. Verify `upsert onConflict('external_id')` then succeeds. (See also Testing & Dev Tooling — `scripts/` is excluded from type checking, which is why this shipped undetected.)

### [LOW] `merchant_claims.place_id` has no index but GET filters on it
**File:** `supabase/migrations/0001_init.sql:81-90`
**Problem:** `merchant_claims` defines no index on `place_id`, yet the claim GET filters `.eq('place_id', placeId)` and per-place reconciliation looks up claims by place. Reviews and forum_replies got their FK indexes; claims were missed.
**Why it matters:** Low volume today, but every per-place claim lookup is a full table scan. Cheap to fix and consistent with the rest.
**Severity:** Low
**Fix:** `create index if not exists merchant_claims_place_id_idx on public.merchant_claims(place_id);` and consider `(status)` for the admin queue.

### [LOW] Missing `updated_at` column + trigger on `reviews` (mutable) and others
**File:** `supabase/migrations/0001_init.sql:61-69, 112-123`
**Problem:** Only `places` has `updated_at` and the touch trigger. `reviews` are upsertable (a user can edit their review), but the table has only `created_at` — no record of edits. forum_posts/replies are insert-only so less critical.
**Why it matters:** Edited reviews keep their original `created_at` with no edited-at signal, so the UI can't show "edited" and moderators can't tell a review changed after the fact. A data-provenance gap.
**Severity:** Low
**Fix:** Add `updated_at timestamptz not null default now()` to `reviews` and attach the existing `public.touch_updated_at` trigger. Optionally apply to `merchant_claims` on status change.

### [LOW] `places.region` is populated by ingest but unindexed
**File:** `supabase/migrations/0001_init.sql:40, 53-56`
**Problem:** `region` is written by every ingest script and the frontend groups by region, but there's no `places_region_idx` (type/country/city/source are indexed).
**Why it matters:** If region filtering/grouping moves server-side (it's client-side today), it will scan. Minor and forward-looking.
**Severity:** Low
**Fix:** `create index if not exists places_region_idx on public.places(region);` if/when region filtering moves to SQL. Low priority while grouping is client-side.

### [LOW] No transaction around admin "actioned" flag — content and flag state can diverge
**File:** `app/api/admin/flags/route.ts:72-87`
**Problem:** PATCH runs `actOnTarget` (delete review/post/reply or set place `verified=false`) as one Supabase call, then separately updates the flag to `status='actioned'` — two independent round-trips, no transaction. If the second fails after the target is gone, the flag stays "open" while the content is removed (or vice versa).
**Why it matters:** Moderation state can drift from content state: a deleted review still shows as an open flag, so an admin re-actions a non-existent target, or a "reviewed" flag points at content never actually removed. Low frequency (admin-only) but it corrupts the audit trail.
**Severity:** Low
**Fix:** Wrap both ops in a Postgres function (`sb.rpc('moderate_flag', {...})`) so they commit atomically. Interim: update the flag first, then act on the target, surfacing partial failure clearly.

### [INFO] Migrations are runner-less and manually applied; no down-migrations
**File:** `supabase/migrations/0002_claims_place_ref.sql:10-19`
**Problem:** Migrations are mostly idempotent (`create table if not exists`, `drop ... if exists`), but there's no migration runner/manifest — files rely on lexical order and manual SQL-editor application. No down-migrations. 0002's NOT NULL drop + CHECK add is safe given prior data, but order-sensitive on re-run.
**Why it matters:** Runner-less migrations risk out-of-order/partial application in a team setting, with no rollback path.
**Severity:** Info
**Fix:** Adopt the Supabase CLI migration workflow (`supabase migration` / `db push`) so ordering and applied-state are tracked. Add an "apply in numeric order" note. No code change required today — process hardening.

---

## Scalability & Infrastructure

### [MEDIUM] `/api/places` has no caching/CDN headers — every page load hits Postgres
**File:** `app/api/places/route.ts:39-41`
**Problem:** GET returns `NextResponse.json` with no `Cache-Control`/`s-maxage`/CDN headers and no `export const revalidate`. SmokingApp fetches `?limit=500` on every home/live mount, FullMapView `?limit=2000` — each an uncached full query. The PWA service-worker caches `/api/places` client-side, but that only helps repeat visits on the same device, not origin/DB load from new or anonymous visitors.
**Why it matters:** Places data is global and near-static (refreshed nightly). Without an edge cache, 10k users browsing the map each trigger a 500-2000 row Postgres scan, saturating Supabase's pooled connections and CPU long before the data itself is large, and driving up egress/compute. The single highest-leverage scalability fix.
**Severity:** Medium
**Fix:** Add `Cache-Control: public, s-maxage=300, stale-while-revalidate=3600` to the GET response (Vercel serves from CDN), keyed on the query string for bbox/list variants. Or `export const revalidate = 300`. Turns N concurrent DB hits into one per 5 min per cache key.

### [MEDIUM] Place list/map fetches are spatially-unscoped top-N — wrong rows at scale
**File:** `app/components/FullMapView.tsx:48`; `app/components/SmokingApp.tsx:1296`
**Problem:** FullMapView fetches `?limit=2000`, SmokingApp `?limit=500`, both via `select('*')`, neither passing bbox even though the route supports it. At large data the map shows an arbitrary top-N (e.g. 2000 of however many), not what's in view, and the payload is multi-MB JSON every load. *(Closely tied to the High projection finding under Performance; this is the viewport-correctness angle.)*
**Why it matters:** The map silently stops being correct (random subset, not viewport) and the payload becomes slow and expensive for every visitor and cold lambda. A correctness-and-cost cliff that hits well before 1M places.
**Severity:** Medium
**Fix:** Drive the map off the bbox query (`?bbox=minLng,minLat,maxLng,maxLat`), refetch on pan/zoom (debounced). Trim the `select` to map-only columns. Add server-side clustering or a zoom-gated point cap; keep the global limit only at low zoom.

### [MEDIUM] Data scrapers run only on the author's Mac via launchd — single point of failure, no monitoring
**File:** `scripts/launchd/com.smokingapp.scrape.plist:8-27`
**Problem:** The nightly OSM/retailer/seed ingest is triggered by a launchd plist hardcoded to `/Users/phktistakis/Devoloper Projects/Smoking` at 03:00 local, with `RunAtLoad=false`. If the Mac is fully off at 03:00 the run is lost (launchd catches up a missed calendar job after wake, but not if the machine was off). Failures are swallowed by `|| echo "... failed"` and written only to local logs. There is no alerting, retry, off-machine execution, or `vercel.json` cron.
**Why it matters:** Data freshness depends on one laptop being awake and online at 3am with valid env vars. A closed lid, OS update, or expired key silently stops all data refresh and nobody is notified. For a directory product, stale/absent data is the core failure mode and it's currently invisible.
**Severity:** Medium
**Fix:** Move ingestion to a hosted scheduler — GitHub Actions scheduled workflow, a Vercel Cron hitting a protected route, or a Supabase Edge Function on cron. Fail loudly (non-zero exit, Sentry/Slack alert) instead of `|| echo`. Keep launchd only as a local dev convenience.

### [MEDIUM] Upload route issues signed PUT URLs with no size/content-type limit
**File:** `app/api/upload/route.ts:34-55`
*(Merged with the Security upload finding above — same root issue. See "Upload endpoint enforces no size or real content-type; public bucket." Severity: Medium.)*

### [LOW] GET list endpoints (`/api/reviews`, `/api/forum/replies`) have no pagination or limit
**File:** `app/api/reviews/route.ts:7-17`; `app/api/forum/replies/route.ts:7-17`
**Problem:** Both apply only an optional `eq` filter and no `limit`. Calling `/api/reviews` with no `placeId` returns every review ordered by `created_at`; `/api/forum/replies` with no `postId` returns every reply. No pagination cursor.
**Why it matters:** As content grows these become unbounded responses (slow, memory-heavy) and a cheap way to scrape or pressure the DB — and they leak the entire corpus in one request.
**Severity:** Low
**Fix:** Add a capped `limit` (as places/forum-posts do), ideally require the scoping param (`placeId`/`postId`), or add keyset pagination.

### [LOW] Sessions table grows unbounded — no expired-session sweep
**File:** `lib/auth/session.ts:37-54`
**Problem:** Every login/signup inserts a 30-day session row. Rows are deleted only lazily (on logout, or when `currentUser()` loads an already-expired cookie). Since the browser cookie expires at the same 30-day mark, the lazy delete often never fires. No scheduled `DELETE FROM sessions WHERE expires_at < now()` exists, and no cron.
**Why it matters:** At 10k users with churn, the table accumulates dead rows indefinitely, bloating the table and `sessions_expires_at_idx`, and slowing the per-request `currentUser()` lookup on the hottest auth path. A slow leak, not an outage.
**Severity:** Low
**Fix:** Add a scheduled cleanup — a Supabase `pg_cron` job `delete from sessions where expires_at < now()` daily, or a Vercel Cron route. The `expires_at` index makes this cheap. Optionally rotate/cap sessions per user on login.

### [LOW] Sentry under-instrumented: fixed sample rate, no release tagging
**File:** `sentry.server.config.ts:7-12` (and client/edge configs)
**Problem:** All three configs init only when a DSN is set, use a fixed `tracesSampleRate: 0.1` with no prod/dev separation, set `environment: process.env.NODE_ENV` (always 'production' on Vercel), have no `release` field, and disable replays. So errors can't be tied to a deploy, and triaging "which release broke this" is manual.
**Why it matters:** When something breaks at 10k users, "this started in release X" and trace-volume/cost control matter. Functional but under-instrumented for an at-scale incident.
**Severity:** Low
**Fix:** Set `release` from `process.env.VERCEL_GIT_COMMIT_SHA`, tune `tracesSampleRate` per environment, tag environment explicitly as 'production'/'preview' rather than `NODE_ENV`, and confirm Sentry quota headroom.

---

## Missing Features

### [LOW] No directions / "navigate here" action
*(Tracked under UI/UX — "No 'Directions / navigate here' action on place detail.")* For a physical-place directory, a maps deep link is the single most-wanted missing action. **Severity: Low.**

Other notable gaps surfaced indirectly by the findings (no standalone finding, listed for the roadmap):
- **No password reset / change flow** (surfaced by the session-rotation finding) — users who forget a password have no recovery path.
- **No real recommendations engine** — the UI promises personalization ("drawn from your saved spots") with hardcoded data and dead controls.
- **No "sign out everywhere" / session management UI.**

---

## Testing & Dev Tooling

### [MEDIUM] No CI/CD pipeline — no automated build/lint/test gate before deploy
**File:** *(repo-wide)*
**Problem:** No `.github/workflows`, `.circleci`, or `.gitlab-ci` (confirmed absent). `vercel.json` only sets build/dev/install commands. Playwright e2e tests exist but nothing runs them automatically; the main UI is `@ts-nocheck` so `tsc` wouldn't catch its regressions even if run. Deploys are Vercel auto-deploy on push with no test/lint/typecheck gate.
**Why it matters:** Every push to the deployed branch ships straight to users with no safety net — and the codebase already has known landmines (FSQ constraint break, moderation `verified` bug, the 2,366-line `@ts-nocheck` component). CI is the cheapest way to stop the next regression reaching production.
**Severity:** Medium
**Fix:** Add a GitHub Actions workflow running `next build`, `next lint`, and `playwright test` on PRs, blocking merge on failure. Incrementally remove `@ts-nocheck` so `tsc --noEmit` becomes meaningful, then add it to CI. Reuse the scheduled-workflow runner for the scrapers.

### [MEDIUM] `scripts/` excluded from type checking — masks the FSQ source bug
**File:** `tsconfig.json` (`"exclude": ["node_modules", "scripts"]`); `scripts/ingest-fsq.ts:109`
**Problem:** The entire `scripts/` tree gets zero type checking, directly masking the FSQ `source: 'fsq'` constraint bug — `'fsq'` isn't in the `PlaceSource` type either, so nothing flagged it at build time. The pipeline that populates the whole product runs untyped.
**Why it matters:** This whole class of bug (wrong column, renamed field, bad enum) ships undetected in the data pipeline. A maintainer running `npm run ingest:fsq` gets per-row failures with a generic Postgres error and no compile-time hint.
**Severity:** Medium
**Fix:** Fix the source value (see Backend finding), then remove `scripts` from tsconfig `exclude` (or give scripts their own `tsconfig` extending the root) so the pipeline is type-checked like everything else.

### [MEDIUM] No unit/integration tests; only one e2e smoke spec — core logic is untestable as written
**File:** *(repo-wide; `tests/e2e/critical-path.spec.ts` is the only test)*
**Problem:** No `*.test.ts`/`*.spec.ts` unit files exist. The most error-prone logic has no coverage and is structured so it can't easily get any: the favorites slug↔UUID sync lives inside `App()` under `@ts-nocheck`; the session HMAC verify, the Haversine math, and the email-verification gate are reachable but untested; route handlers bundle rate-limit + auth + validation + DB so they're hard to test in isolation.
**Why it matters:** The trickiest, highest-risk code (session signing, the `verified` moderation rule, favorites sync, the broken FSQ source) is exactly what has no automated safety net. The monolith and missing service layer are what make pure-function unit tests impractical today.
**Severity:** Medium
**Fix:** Pair extraction work with tests: once `sign()`/`unpack()`, `requireVerifiedEmail()`, `haversineKm`, and the place-visibility rule are pure functions in `lib/`, add Vitest/Jest unit tests. Add integration tests for the standardized route helper. The refactor is what makes testing cheap.

---

## Remediation Roadmap

### Phase 1 — Critical / High (do before any real launch)
1. **Lock down `GET /api/places/claim`** (PII leak) — add admin gate or delete. *(Security, High)*
2. **Add `verified=true` filter to `GET /api/places` + `/api/places/nearby`**, fixed as a pair with the POST default; align the AddPlace "pending review" copy. *(Backend/Data Integrity/UX, High — fixes moderation, soft-hide, and a trust gap in one stroke)*
3. **Delete or gate `/api/recommendations` and `/api/places/google`** (paid-API cost abuse + LLM proxy). *(Security, High)*
4. **Replace the in-memory rate limiter with Upstash Redis** + add login lockout. *(Security/Scalability, High)*
5. **Remove fabricated stats** (hero "2,184 / 38,902", assistant fallback, footer scope contradiction); make "Live" the default Places view and badge/seed-separate editorial data. *(UX, High)*
6. **Fix FSQ ingest** (`source` constraint + `PlaceSource` type) and **un-exclude `scripts/` from tsconfig**. *(Data Integrity / Dev Tooling, High/Medium)*
7. **Project columns on `GET /api/places` + add `pg_trgm` name index** (and forum search). *(Performance, High)*
8. **Modal accessibility** (role/aria/focus-trap/Escape) and **wire i18n into the app body**. *(UX/Accessibility, High)*
9. **Begin splitting `SmokingApp.tsx`** — extract seed data + one modal + one view, removing `@ts-nocheck` per piece. *(Architecture, High — start now, continues into Phase 2)*

### Phase 2 — Medium (hardening & scale-readiness)
- Introduce a `lib/services` data layer; centralize the `verified` rule and user-join select.
- Standardize write-route helpers (`withWriter`/`withAdmin`/`jsonError`); single-source `PLACE_TYPES` and the admin client.
- Add CDN cache headers to `/api/places`; wire bbox-scoped viewport fetching to the map's `moveend`.
- Move scrapers to a hosted scheduler with loud failure alerts; add CI (build + lint + Playwright + eventually `tsc`).
- Fix the favorites UUID drop, search race, and map Retry button; persist theme.
- Harden the forum `.or()` search; add CSRF Origin check; enforce upload size/MIME + `requireWriter`.
- Fix the dead/canned UI controls (Regenerate, engine toggle, assistant), dead footer links, and dev-facing empty/error copy.
- Adopt PostGIS for geo (also fixes the antimeridian/pole bug); begin unit tests on extracted pure functions.

### Phase 3 — Polish
- Add `merchant_claims.place_id`, `places.region`, and `reviews.updated_at` + trigger.
- Add expired-session sweep (pg_cron) and "sign out everywhere"; wrap admin moderation in an RPC transaction.
- Paginate `/api/reviews` and `/api/forum/replies`; de-dup the place-detail double-fetch with `cache()`.
- Switch fonts to `next/font`; add Directions deep links; fix forum reply counts and the username-keyed optimistic review.
- Sentry `release` tagging + per-env sample rate; tighten RLS SELECT to `verified=true` and move public reads to the anon key; adopt the Supabase CLI migration workflow; generic client error messages.

---

## Recommended New Features & Architecture

- **Make "Live" the only source of truth.** Always seed the database (so there's one data path) and delete the runtime seed-fallback blending. This single decision resolves a cluster of trust bugs (fake stats, mixed data, slug↔UUID favorites, dead-end seed links).
- **Server-side geo + clustering with PostGIS.** A `geography(Point,4326)` column + GiST index plus viewport bbox fetching is the foundation for the worldwide-map ambition; it makes "near me," the map, and search correct and fast at the 100M-POI scale the ingestion pipelines target.
- **A real recommendations service** rebuilt against Supabase data behind the standard auth + rate-limit helper, replacing the dead OpenAI/Groq toggle and the scripted assistant — or cut both for launch.
- **Proper account lifecycle:** password reset/change, session management UI ("sign out everywhere"), and email-verified upload gating — the auth core is solid but missing these table-stakes flows.
- **Caching + edge strategy:** CDN-cached read endpoints, anon-key read client, service-role reserved for writes. This is what lets a near-static directory serve 10k+ users cheaply.
- **A typed, layered codebase:** service layer + extracted components + contexts + per-route helpers + CI with `tsc`. Most of the bug findings trace back to the `@ts-nocheck` monolith and the absence of a service layer; fixing those two structural issues is the highest-leverage long-term investment.

**Relevant files:** `/Users/phktistakis/Devoloper Projects/Smoking/app/api/places/route.ts`, `/Users/phktistakis/Devoloper Projects/Smoking/app/api/places/claim/route.ts`, `/Users/phktistakis/Devoloper Projects/Smoking/app/api/recommendations/route.ts`, `/Users/phktistakis/Devoloper Projects/Smoking/app/api/places/google/route.ts`, `/Users/phktistakis/Devoloper Projects/Smoking/lib/rate-limit.ts`, `/Users/phktistakis/Devoloper Projects/Smoking/app/components/SmokingApp.tsx`, `/Users/phktistakis/Devoloper Projects/Smoking/scripts/ingest-fsq.ts`, `/Users/phktistakis/Devoloper Projects/Smoking/supabase/migrations/0001_init.sql`, `/Users/phktistakis/Devoloper Projects/Smoking/lib/auth/session.ts`, `/Users/phktistakis/Devoloper Projects/Smoking/app/components/LiveMap.tsx`, `/Users/phktistakis/Devoloper Projects/Smoking/tsconfig.json`.