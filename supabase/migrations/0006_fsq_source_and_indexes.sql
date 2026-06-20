-- 0006: Fix FSQ ingest + add missing indexes flagged by the audit.
-- Additive only — does not alter prior migrations.

-- 1) Allow source='fsq'. The Foursquare ingest (scripts/ingest-fsq.ts) writes
--    source='fsq', but the original CHECK only permitted user/osm/google/
--    retailer/seed, so every upsert failed with a check_violation.
alter table public.places drop constraint if exists places_source_check;
alter table public.places
  add constraint places_source_check
  check (source in ('user','osm','google','retailer','seed','fsq'));

-- 2) Trigram index for fast name search. /api/places does ILIKE '%q%' on name,
--    which cannot use a normal btree index (leading wildcard) and forces a
--    sequential scan on every keystroke. pg_trgm + GIN makes it index-backed.
create extension if not exists pg_trgm;
create index if not exists places_name_trgm_idx
  on public.places using gin (name gin_trgm_ops);

-- 3) region is populated by the ingest scripts and filtered in the UI but had
--    no index.
create index if not exists places_region_idx on public.places(region);

-- 4) merchant_claims.place_id is filtered by the claims GET (?placeId=) but was
--    unindexed.
create index if not exists merchant_claims_place_id_idx
  on public.merchant_claims(place_id);

-- 5) verified is now part of the public-list WHERE clause; index the common
--    "verified places, filtered by type" access pattern.
create index if not exists places_verified_idx on public.places(verified);
