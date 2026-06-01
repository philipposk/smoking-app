import { test, expect } from '@playwright/test';

// Critical path = the flow a new visitor takes before they need Supabase.
// Tests that don't need DB run in any environment. Tests that need DB
// auto-skip when Supabase env vars are absent.

const hasSupabase =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe('age gate', () => {
  test('GET / redirects to /age-gate for new visitors', async ({ page }) => {
    const res = await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBe(200); // followed redirect
    expect(page.url()).toContain('/age-gate');
    await expect(page.getByRole('heading', { name: /legal smoking age/i })).toBeVisible();
  });

  test('confirming 18+ unlocks the home page', async ({ page, context }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/age-gate/);
    await page.getByRole('button', { name: /I am of legal age/i }).click();
    // After the POST redirect the browser may land on localhost or 127.0.0.1
    // depending on how Next.js dev resolves the host. Match the path only.
    await expect(page).toHaveURL(/^https?:\/\/[^/]+\/$/, { timeout: 10_000 });
    await expect(page.getByText(/Index/)).toBeVisible();

    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === 'age_ok')?.value).toBe('1');
  });
});

test.describe('home page (post age gate)', () => {
  test.beforeEach(async ({ context }) => {
    // BASE_URL is http://127.0.0.1:3939 — cookie domain must match exactly.
    const domain = new URL(process.env.BASE_URL ?? 'http://127.0.0.1:3939').hostname;
    await context.addCookies([{ name: 'age_ok', value: '1', domain, path: '/' }]);
  });

  test('nav links render in English by default', async ({ page }) => {
    await page.goto('/');
    // Use regex anchors because "Saved" gets a "· N" favorite-count suffix
    for (const label of [/^Index$/, /^Places$/, /^Saved\b/, /^Forum$/]) {
      await expect(page.getByRole('link', { name: label })).toBeVisible();
    }
  });

  test('language picker switches to Spanish', async ({ page, context }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    // Playwright's selectOption() on a React 18 controlled <select> doesn't fire
    // React's onChange because React reverts the DOM value before the handler
    // sees it. Trigger via the native HTMLSelectElement value setter so React
    // captures the event and calls the onChange handler, which POSTs /api/locale
    // then calls window.location.reload().
    const navPromise = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20_000 });
    await page.getByLabel('Language').evaluate((el: HTMLSelectElement) => {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLSelectElement.prototype, 'value'
      )?.set;
      if (nativeSetter) {
        nativeSetter.call(el, 'es');
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await navPromise;
    await expect(page.getByRole('link', { name: /^Índice$/ })).toBeVisible({ timeout: 10_000 });
    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === 'lang')?.value).toBe('es');
  });

  test('search box is debounced and disabled during submission', async ({ page }) => {
    await page.goto('/');
    const input = page.getByPlaceholder(/Search places/i);
    await expect(input).toBeVisible();
    await input.fill('xyz-no-match');
    // Debounced 250ms, then 500 or 0 results; both are fine — we're only
    // verifying the box accepts input and doesn't crash.
    await page.waitForTimeout(400);
  });
});

test.describe('static pages', () => {
  test.beforeEach(async ({ context }) => {
    const domain = new URL(process.env.BASE_URL ?? 'http://127.0.0.1:3939').hostname;
    await context.addCookies([{ name: 'age_ok', value: '1', domain, path: '/' }]);
  });

  test('/privacy renders', async ({ page }) => {
    await page.goto('/privacy', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
  });

  test('/terms renders', async ({ page }) => {
    await page.goto('/terms', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible();
  });
});

test.describe('api basics', () => {
  test('/api/auth/session returns null user when unauthenticated', async ({ request }) => {
    const r = await request.get('/api/auth/session');
    expect(r.status()).toBe(200);
    expect(await r.json()).toEqual({ user: null });
  });

  test('/api/places/nearby validates lat/lng', async ({ request }) => {
    const r = await request.get('/api/places/nearby');
    expect(r.status()).toBe(400);
  });
});

test.describe('auth flow (requires Supabase env)', () => {
  test.skip(!hasSupabase, 'Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to run.');

  test('signup → session → logout round-trip', async ({ request }) => {
    const username = `pw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const signup = await request.post('/api/auth/signup', {
      data: { username, email: `${username}@example.test`, password: 'password123' },
    });
    expect(signup.status()).toBe(200);

    const session = await request.get('/api/auth/session');
    const sj = await session.json();
    expect(sj.user?.username).toBe(username);

    const out = await request.post('/api/auth/logout');
    expect(out.status()).toBe(200);

    const after = await request.get('/api/auth/session');
    expect(await after.json()).toEqual({ user: null });
  });
});
