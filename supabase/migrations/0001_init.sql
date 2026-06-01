-- Smoking app: initial schema
-- Run this in Supabase Studio SQL editor (or via psql) after creating the project.

create extension if not exists "pgcrypto";

-- Users (custom auth: we manage password hashes ourselves with bcrypt)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  email text unique not null,
  password_hash text not null,
  role text not null default 'user' check (role in ('user','merchant','admin')),
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

-- Sessions (signed cookie holds session id; row is the source of truth)
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists sessions_user_id_idx on public.sessions(user_id);
create index if not exists sessions_expires_at_idx on public.sessions(expires_at);

-- Places (smoking spots, shops, kiosks, benches, dispensaries, cafes)
create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,           -- e.g. osm:node/12345 or google:ChIJ...
  source text not null default 'user' check (source in ('user','osm','google','retailer','seed')),
  name text not null,
  description text,
  type text not null check (type in ('spot','shop','cafe','dispensary','kiosk','convenience','bench','smoking_area')),
  lat double precision not null,
  lng double precision not null,
  country text,
  city text,
  neighborhood text,
  region text,
  tags text[] not null default '{}',
  photo_url text,
  accessible boolean,
  notes text,
  verified boolean not null default false,
  merchant_claimed boolean not null default false,
  merchant_user_id uuid references public.users(id) on delete set null,
  contributed_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists places_type_idx on public.places(type);
create index if not exists places_country_idx on public.places(country);
create index if not exists places_city_idx on public.places(city);
create index if not exists places_source_idx on public.places(source);
-- spatial-ish index for bbox queries (cheap; switch to PostGIS later if needed)
create index if not exists places_lat_lng_idx on public.places(lat, lng);

-- Reviews
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now(),
  unique (place_id, user_id)
);
create index if not exists reviews_place_id_idx on public.reviews(place_id);

-- Favorites
create table if not exists public.favorites (
  user_id uuid not null references public.users(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

-- Merchant claims (pending until admin verifies)
create table if not exists public.merchant_claims (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  business_name text,
  proof_url text,
  contact_email text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

-- Forum
create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  body text not null,
  category text,
  created_at timestamptz not null default now()
);
create index if not exists forum_posts_created_at_idx on public.forum_posts(created_at desc);

create table if not exists public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists forum_replies_post_id_idx on public.forum_replies(post_id);

-- Updated_at trigger for places
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists places_touch_updated_at on public.places;
create trigger places_touch_updated_at
  before update on public.places
  for each row execute function public.touch_updated_at();

-- Row-Level Security: we use the service role from the server, so RLS is
-- mainly a safety net if anon keys ever get used by the browser directly.
alter table public.users           enable row level security;
alter table public.sessions        enable row level security;
alter table public.places          enable row level security;
alter table public.reviews         enable row level security;
alter table public.favorites       enable row level security;
alter table public.merchant_claims enable row level security;
alter table public.forum_posts     enable row level security;
alter table public.forum_replies   enable row level security;

-- Public-readable tables (anyone with anon key can SELECT)
drop policy if exists places_read   on public.places;
drop policy if exists reviews_read  on public.reviews;
drop policy if exists posts_read    on public.forum_posts;
drop policy if exists replies_read  on public.forum_replies;
create policy places_read   on public.places          for select using (true);
create policy reviews_read  on public.reviews         for select using (true);
create policy posts_read    on public.forum_posts     for select using (true);
create policy replies_read  on public.forum_replies   for select using (true);

-- All writes are blocked for anon; the server uses the service-role key which
-- bypasses RLS, so writes only happen through our API routes.
