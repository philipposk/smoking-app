import { test, expect } from '@playwright/test';

// Theme: follows the device until the person taps the toggle; the tap is saved.
test.describe('theme', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    const domain = new URL(baseURL ?? 'http://localhost:3939').hostname;
    await context.addCookies([{ name: 'age_ok', value: '1', domain, path: '/' }]);
  });

  test('new visitor on a dark device gets dark, nothing saved', async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ colorScheme: 'dark', baseURL });
    const domain = new URL(baseURL ?? 'http://localhost:3939').hostname;
    await ctx.addCookies([{ name: 'age_ok', value: '1', domain, path: '/' }]);
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull();
    await ctx.close();
  });

  test('tapping the toggle saves the choice and keeps it on reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.getByRole('button', { name: 'Toggle theme' }).first().click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});
