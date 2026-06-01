/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

const createNextIntlPlugin = require('next-intl/plugin');
// Cookie-based locale (no /[locale]/ routing). Config loaded from ./i18n/request.ts
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  // Only enable in production; dev SW interferes with hot reload.
  disable: process.env.NODE_ENV === 'development',
  register: true,
  scope: '/',
  workboxOptions: {
    runtimeCaching: [
      {
        // Cache map tile providers (MapLibre/MapTiler/OSM-style URLs)
        urlPattern: /^https:\/\/(tiles|api)\.(maptiler|openstreetmap|stadiamaps)\.(com|org)\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'map-tiles',
          expiration: { maxEntries: 600, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        // Cache recent /api/places GETs so the list view works offline
        urlPattern: /\/api\/places(\?.*)?$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'places-api',
          expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'fonts',
          expiration: { maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
    ],
  },
});

module.exports = withPWA(withNextIntl(nextConfig));
