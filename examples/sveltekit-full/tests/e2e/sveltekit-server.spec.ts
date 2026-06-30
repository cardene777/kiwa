// Playwright e2e — real `vite dev` (SvelteKit) server を webServer config で auto 起動し、
// http://localhost:3040 経由で 3 layer (load + actions + hooks.server) の統合動作を
// end-to-end 確認する。

import { expect, test } from '@playwright/test';

test.describe('SvelteKit full PoC — real dev server', () => {
  test('GET /items unauthenticated redirects to /login?from=/items', async ({ page }) => {
    const response = await page.goto('/items', { waitUntil: 'load' });
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/login\?from=%2Fitems$/);
  });

  test('After login the items page renders 3 items and x-kiwa-handle header', async ({ page, context }) => {
    await context.addCookies([
      { name: 'session', value: 'admin', url: 'http://localhost:3040' },
    ]);
    const response = await page.goto('/items', { waitUntil: 'load' });
    expect(response?.status()).toBe(200);
    expect(response?.headers()['x-kiwa-handle']).toBe('passed');

    await expect(page.locator('h1')).toHaveText('kiwa SvelteKit PoC');
    await expect(page.locator('li')).toHaveCount(3);
    await expect(page.locator('li').nth(0)).toContainText('kiwa');
    await expect(page.locator('li').nth(1)).toContainText('sveltekit');
    await expect(page.locator('li').nth(2)).toContainText('vite');
  });

  test('GET /items with session=banned returns 403 from hooks.server', async ({ page, context }) => {
    await context.addCookies([
      { name: 'session', value: 'banned', url: 'http://localhost:3040' },
    ]);
    const response = await page.goto('/items');
    expect(response?.status()).toBe(403);
  });

  test('create form valid name -> success message rendered with deterministic id', async ({ page, context }) => {
    await context.addCookies([
      { name: 'session', value: 'admin', url: 'http://localhost:3040' },
    ]);
    await page.goto('/items');

    await page.locator('input[name="name"]').fill('hello');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('[data-testid="create-success"]')).toContainText('id=105');
    await expect(page.locator('[data-testid="create-success"]')).toContainText('hello');
  });
});
