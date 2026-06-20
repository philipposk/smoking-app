# Audit Remediation Status

Companion to [AUDIT.md](AUDIT.md). Tracks what was fixed on the `audit/full-review`
branch (original `main` untouched). Every batch was verified with `tsc` (app +
scripts), `next build`, and the Playwright e2e suite (9/9 passing).

## Fixed

### Security
| Finding | Severity | Fix | Commit |
|---|---|---|---|
| `GET /api/places/claim` leaked all merchant PII unauthenticated | High | Auth required; admin sees all, users see only own claims | `1d91fd1` |
| `/api/recommendations` + `/api/places/google` anon-callable → paid-API cost abuse / LLM proxy | High | Gated behind auth + `writeLimit`; lazy OpenAI client | `1d91fd1` |
| In-memory rate limiter is a no-op across serverless instances | High | Pluggable Upstash Redis backend (REST, no SDK) w/ in-memory fallback; all 12 callers awaited | `1ca88b2` |
| Forum search raw-interpolated into PostgREST `.or()` | Medium | Sanitize input (strip filter/LIKE metachars), length cap | `66aa16c` |
| Upload signed URLs enforce no size/MIME | Medium | Storage bucket `file_size_limit` 5 MB + image-only `allowed_mime_types` (migration 0008) | `66aa16c` |

### Data integrity / moderation
| Finding | Severity | Fix | Commit |
|---|---|---|---|
| `GET /api/places` returned unverified + admin-hidden places (moderation no-op) | High | Default `verified=true` filter; admin opt-in via `?includeUnverified=1` | `1d91fd1` |
| FSQ ingest `source='fsq'` violated CHECK → every upsert failed | High | Migration 0006 adds `'fsq'` to the constraint | `1d91fd1` |
| FSQ ingest imported `duckdb` not in package.json | High | `duckdb` optionalDependency + ambient type | `1d91fd1` |
| Favorites dropped every real (UUID) place | Medium | `resolveSlugToUuid` passes UUIDs through; hydration keys live places by id | `66aa16c` |

### UX
| Finding | Severity | Fix | Commit |
|---|---|---|---|
| Hero/assistant/footer advertised fabricated stats (2,184 / 47 / 38,902) | High | Real `/api/stats` (`place_stats` RPC, migration 0007); honest seed fallback | `b05e72b` |
| Footer Athens/Thessaloniki-only contradiction + dead `#` links | Medium | Worldwide copy; working Explore/Contact links | `b05e72b` |
| "Regenerate" + engine toggle were dead controls | Medium | Wired to real `/api/recommendations` w/ graceful fallback | `b05e72b` |
| Modals lacked dialog semantics / focus trap / Escape | High | `useModalA11y` applied to Auth, AddPlace, MerchantClaim | `3a06ece` |
| Map "Retry" left the canvas permanently blank | Medium | Retry re-runs the init effect (`retryKey`) | `3a06ece` |
| Theme not persisted; light→dark flash on reload | Medium | localStorage + pre-paint inline script in layout | `66aa16c` |
| Search results race (slow response clobbers newer) | Medium | AbortController + stale guard | `66aa16c` |

### Performance
| Finding | Severity | Fix | Commit |
|---|---|---|---|
| `GET /api/places` `select *`, no order, ships every column | High | Column projection + `order('id')` | `1d91fd1` |
| Leading-wildcard name ILIKE = sequential scan per keystroke | High | `pg_trgm` GIN index on `name` (migration 0006) | `1d91fd1` |
| No CDN caching on the hot read path | Medium | `s-maxage=60, swr=300` on public list; `no-store` for admin view | `4e66ccf` |
| `/api/reviews` + `/api/forum/replies` unbounded reads | Low | `limit`/`offset` with 200 cap | `4e66ccf` |
| Missing indexes (region, merchant_claims.place_id, verified) | Low | Added in migration 0006 | `1d91fd1` |

### Infra / dev tooling
| Finding | Severity | Fix | Commit |
|---|---|---|---|
| `scripts/` excluded from typecheck (masked the FSQ bug) | Medium | `tsconfig.scripts.json` + `typecheck:scripts` | `1d91fd1` |
| No CI gate | Medium | `.github/workflows/ci.yml` (lint + typecheck + build + e2e) | `3a06ece` |
| Map used the unreliable demotiles style | Medium | OpenFreeMap liberty + `NEXT_PUBLIC_MAP_STYLE_URL` override + error overlay | `12d6d82`/audit |

New migrations: `0006_fsq_source_and_indexes`, `0007_place_stats`, `0008_storage_bucket`.
New endpoints: `GET /api/stats`. New env: `UPSTASH_REDIS_REST_URL/TOKEN`, `NEXT_PUBLIC_MAP_STYLE_URL`.

## Recommended as focused follow-ups (large, deserve their own effort)

These are real and worth doing, but are big enough that rushing them risks the
working build. Each should be its own branch + review cycle.

1. **Split `app/components/SmokingApp.tsx` (2,366 lines, `@ts-nocheck`).** Extract
   seed data, each modal, and each view into typed modules; drop `@ts-nocheck`
   per file. Highest long-term leverage — most UI bugs trace back to this.
2. **Wire i18n into the app body.** Only the header is translated today; the body
   is hardcoded English, so non-EN locales and RTL are half-applied. Message keys
   already exist in `messages/*.json`.
3. **Adopt PostGIS for geo.** A `geography(Point,4326)` column + GiST index +
   viewport-bbox fetching replaces the JS Haversine path, fixes the
   antimeridian/pole edge cases, and scales the worldwide-map ambition.
4. **Service/data layer + write-route helpers.** Centralize the `verified` rule,
   the user-join select, and the auth/rate-limit/error boilerplate repeated across
   ~12 routes.
5. **Account lifecycle:** password reset, "sign out everywhere", expired-session
   sweep (pg_cron).
