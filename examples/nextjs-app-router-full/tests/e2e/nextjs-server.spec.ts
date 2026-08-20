// Playwright e2e — real Next.js v15 dev server (next dev) を webServer config で auto 起動し、
// http://localhost:3070 経由で 4 layer (RSC page + Server Action + middleware + Route Handler) の
// 統合動作を end-to-end 確認する。

import { expect, test } from '@playwright/test';

test.describe('Next.js full PoC — real dev server', () => {
  test('T-E2E-001 Middleware: unauthenticated /items -> 307 redirect to /login?from=/items', async ({ page }) => {
    const response = await page.goto('/items', { waitUntil: 'load' });
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/login\?from=%2Fitems$/);
  });

  test('T-E2E-002 RSC: after login the items page renders 3 items', async ({ page, context }) => {
    await context.addCookies([
      { name: 'session', value: 'admin', url: 'http://localhost:3070' },
    ]);
    const response = await page.goto('/items', { waitUntil: 'load' });
    expect(response?.status()).toBe(200);

    await expect(page.locator('h1')).toHaveText('kiwa Next.js PoC');
    await expect(page.locator('li')).toHaveCount(3);
    await expect(page.locator('li').nth(0)).toContainText('kiwa');
    await expect(page.locator('li').nth(1)).toContainText('nextjs');
    await expect(page.locator('li').nth(2)).toContainText('app-router');
  });

  test('T-E2E-003 Middleware: banned -> 403 JSON for /items', async ({ page, context }) => {
    await context.addCookies([
      { name: 'session', value: 'banned', url: 'http://localhost:3070' },
    ]);
    const response = await page.goto('/items');
    expect(response?.status()).toBe(403);
  });

  test('T-E2E-004 Server Action: create form submit with valid name shows success message', async ({ page, context }) => {
    await context.addCookies([
      { name: 'session', value: 'admin', url: 'http://localhost:3070' },
    ]);
    await page.goto('/items');
    await page.locator('input[name="name"]').fill('hello');
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('[data-testid="create-success"]')).toContainText('id=105');
    await expect(page.locator('[data-testid="create-success"]')).toContainText('hello');
  });

  test('T-E2E-005 Route Handler: GET /api/items unauthenticated -> 302 redirect', async ({ request }) => {
    const response = await request.get('/api/items', { maxRedirects: 0 });
    expect(response.status()).toBe(302);
    expect(response.headers()['location']).toBe('/login?from=%2Fapi%2Fitems');
  });

  test('T-E2E-006 Route Handler: GET /api/items with session=admin returns 200 + JSON + cache-control', async ({ request }) => {
    const response = await request.get('/api/items', {
      headers: { cookie: 'session=admin' },
    });
    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toBe('public, max-age=60');
    const body = await response.json();
    expect(body.count).toBe(3);
    expect(body.user).toBe('u1');
  });

  test('T-E2E-007 Middleware: x-request-id header echoed via x-kiwa-request-id (Route Handler matcher 経路)', async ({ request }) => {
    const response = await request.get('/api/items', {
      headers: { cookie: 'session=admin', 'x-request-id': 'req-e2e-7' },
    });
    expect(response.status()).toBe(200);
    expect(response.headers()['x-kiwa-request-id']).toBe('req-e2e-7');
  });
});
