/**
 * Registry of retailer chains to scrape with Playwright.
 *
 * Each entry has:
 *   slug      — unique id, used as external_id prefix
 *   name      — chain display name
 *   country   — primary country (for tagging in DB)
 *   url       — store-locator page to load
 *   wait      — selector to wait for before scraping
 *   extract   — runs IN the browser; must return Array<RawStore>
 *
 * RawStore = { id: string; name: string; address?: string; lat: number; lng: number; }
 *
 * Add new chains by appending to RETAILERS. Most store-locators expose a JSON
 * API; sniff it with DevTools → Network → XHR, then `fetch(...)` inside extract.
 */

export interface RawStore {
  id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
}

export interface Retailer {
  slug: string;
  name: string;
  country: string;
  url: string;
  wait?: string;
  // The function body is stringified and evaluated in the browser context,
  // so it must be self-contained (no closures over Node-side variables).
  extract: () => Promise<RawStore[]>;
}

export const RETAILERS: Retailer[] = [
  // Example template — disabled until you confirm the chain's ToS allows scraping.
  // {
  //   slug: 'example-tobacconist',
  //   name: 'Example Tobacconist',
  //   country: 'United Kingdom',
  //   url: 'https://example.com/stores',
  //   wait: '[data-store-id]',
  //   extract: async () => {
  //     const nodes = document.querySelectorAll('[data-store-id]');
  //     return Array.from(nodes).map((n) => ({
  //       id: n.getAttribute('data-store-id')!,
  //       name: n.querySelector('.store-name')?.textContent?.trim() ?? 'Store',
  //       address: n.querySelector('.store-address')?.textContent?.trim() ?? undefined,
  //       lat: parseFloat(n.getAttribute('data-lat')!),
  //       lng: parseFloat(n.getAttribute('data-lng')!),
  //     }));
  //   },
  // },
];
