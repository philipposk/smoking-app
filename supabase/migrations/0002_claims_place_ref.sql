-- Allow merchant claims for places that don't yet have a DB row.
-- The current design uses slug-based ids in editorial seed data, so a
-- merchant clicking "Claim this listing" may have no UUID to attach to.
--
-- After this migration:
--   place_id  → nullable FK (used when the place is already in the DB)
--   place_ref → freeform JSON {name, city, country, slug?} for unmatched claims
-- The API accepts either; one of them must be present.

alter table public.merchant_claims
  alter column place_id drop not null,
  add column if not exists place_ref jsonb;

alter table public.merchant_claims
  drop constraint if exists merchant_claims_has_target;

alter table public.merchant_claims
  add constraint merchant_claims_has_target
  check (place_id is not null or place_ref is not null);
