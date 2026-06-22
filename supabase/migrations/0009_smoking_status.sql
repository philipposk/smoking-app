-- 0009: Structured "can I smoke here?" verdict.
-- The OSM scraper already reads the smoking=* tag but flattened it into prose.
-- Store it as a structured status + its provenance so the UI can show a clear
-- verdict chip AND be honest about where the answer came from ("national law"
-- reads very differently from "the owner says so").
alter table public.places
  add column if not exists smoking_status text not null default 'unknown'
    check (smoking_status in ('allowed','outside_only','designated','banned','unknown')),
  add column if not exists smoking_status_source text not null default 'unknown'
    check (smoking_status_source in ('osm','legal_default','community','unknown'));

create index if not exists places_smoking_status_idx on public.places(smoking_status);
