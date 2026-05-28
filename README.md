# Smoking — A Field Guide

A worldwide map and guide to places where you can still smoke: smoke shops, outdoor terraces, courtyards, lookouts, kiosks, benches, and smoke-friendly cafés. You open it on your phone or computer, search a city or tap "near me", and see spots on a map or in a list. You can save favorites, add places you know about, and chat with other people in a forum.

It's for smokers travelling or out and about who want to quickly find a welcoming spot nearby.

## What it does
- Shows smoke-friendly places on a map, a list, or a spinning globe view
- Lets you search any city or find spots near your current location
- Lets you save favorite places and add new ones yourself
- Has a community forum and a built-in assistant to help you
- Lets shop owners claim and manage their own listing
- Works as an installable app and keeps working offline
- Asks you to confirm your age before entering

## Status
Working website / web app that can also be installed like a phone app. Without a connected database it still loads with a built-in set of curated places, but sign-up, the forum, favorites, and the live map need setup.

---
### For developers
Next.js 14 (App Router) + TypeScript. Backend is REST routes under `app/api/` on Supabase Postgres, with custom bcrypt + HMAC-signed-cookie auth, rate limiting, optional email verification via Resend, and image upload via Supabase Storage; moderation queue at `/admin/queue`. Map is MapLibre GL with supercluster on the Live tab. Data comes from scrapers in `scripts/` (OpenStreetMap via Overpass, Foursquare Open Places via DuckDB, curated editorial seed, configurable retailer chains via Playwright). PWA via `manifest.json` + Workbox service worker (caches `/api/places` and map tiles). Cookie-based age gate plus Privacy/Terms pages. Quick start:

```bash
npm install
cp .env.example .env.local       # fill Supabase URL + keys + SESSION_SECRET
# run supabase/migrations/*.sql in order, create a public Storage bucket
npm run seed:places
npm run dev                       # http://localhost:3000
```

See `SETUP_SUPABASE.md` and `SCRAPERS.md`. Sentry and Playwright are configured.
