-- 0007: Accurate catalog stats for the homepage hero.
-- Replaces the hardcoded "2,184 spots / 47 cities / 38,902 notes" fiction with
-- real counts. COUNT(DISTINCT ...) isn't expressible via PostgREST, so expose
-- it as a STABLE function callable with .rpc('place_stats').
create or replace function public.place_stats()
returns table (places bigint, cities bigint, countries bigint)
language sql
stable
as $$
  select
    count(*)::bigint                              as places,
    count(distinct nullif(city, ''))::bigint      as cities,
    count(distinct nullif(country, ''))::bigint    as countries
  from public.places
  where verified = true;
$$;
