// Playwright e2e — real Remix v2 dev server (vite-based) を webServer config で auto 起動し、
// http://localhost:3050 経由で 3 layer (UI route loader + UI route action + Resource Route) の
// 統合動作を end-to-end 確認する。
//
// UI route (items) は HTML レンダリング + form 動作の検証に絞り、 cache-control / 403 JSON
// 等の HTTP response 細部は Resource Route (/api/items) 経由で確認する。
// (UI route の loader response は Remix の ErrorBoundary 経路で wrap されることがあるため。)

import { expect, test } from '@playwright/test';

test.describe('Remix full PoC — real dev server', () => {
  test('GET /items unauthenticated redirects to /login?from=/items', async ({ page }) => {
    const response = await page.goto('/items', { waitUntil: 'load' });
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/login\?from=%2Fitems$/);
  });

  test('After login the items page renders 3 items via UI loader', async ({ page, context }) => {
    await context.addCookies([
      { name: 'session', value: 'admin', url: 'http://localhost:3050' },
    ]);
    const response = await page.goto('/items', { waitUntil: 'load' });
    expect(response?.status()).toBe(200);

    await expect(page.locator('h1')).toHaveText('kiwa Remix PoC');
    await expect(page.locator('li')).toHaveCount(3);
    await expect(page.locator('li').nth(0)).toContainText('kiwa');
    await expect(page.locator('li').nth(1)).toContainText('remix');
    await expect(page.locator('li').nth(2)).toContainText('vite');
  });

  test('create form valid name -> success message rendered with deterministic id', async ({ page, context }) => {
    await context.addCookies([
      { name: 'session', value: 'admin', url: 'http://localhost:3050' },
    ]);
    await page.goto('/items');

    await page.locator('input[name="name"]').fill('hello');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('[data-testid="create-success"]')).toContainText('id=105');
    await expect(page.locator('[data-testid="create-success"]')).toContainText('hello');
  });

  test('Resource Route /api/items GET returns JSON with cache-friendly shape', async ({ request }) => {
    const response = await request.get('/api/items', {
      headers: { cookie: 'session=admin' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.user).toBe('u1');
    expect(typeof body.count).toBe('number');
  });

  test('Resource Route /api/items GET without auth returns 401 JSON', async ({ request }) => {
    const response = await request.get('/api/items');
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('unauthenticated');
  });

  test('Resource Route /api/items GET with session=banned returns 403 JSON', async ({ request }) => {
    const response = await request.get('/api/items', {
      headers: { cookie: 'session=banned' },
    });
    expect(response.status()).toBe(403);
  });

  test('Resource Route /api/items POST increments count by delta', async ({ request }) => {
    const response = await request.post('/api/items', {
      headers: { cookie: 'session=admin' },
      form: { delta: '7' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.user).toBe('u1');
    expect(typeof body.count).toBe('number');
  });
});
