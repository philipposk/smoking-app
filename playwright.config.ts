import { defineConfig, devices } from '@playwright/test';

// Spins up `npm run dev` on a free port and runs tests against it.
// Set BASE_URL in env to point at a deployed instance instead.
const PORT = Number(process.env.E2E_PORT ?? 3939);
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: process.env.BASE_URL ? undefined : {
    command: `npx next dev -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    // First Next.js compile of the full app can take ~60s on cold cache.
    timeout: 240_000,
  },
});
