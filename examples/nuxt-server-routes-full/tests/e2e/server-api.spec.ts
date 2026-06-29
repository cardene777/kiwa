// Playwright e2e — real `nuxt dev` server を webServer config で auto 起動し、
// http://localhost:3030 経由で 3 layer (server/api + middleware + Nitro plugin) の
// 統合動作を end-to-end 確認する。

import { expect, test } from '@playwright/test';

test.describe('Nuxt full PoC — real dev server', () => {
  test('GET /api/items with valid auth returns full item list + cache-control', async ({ request }) => {
    const response = await request.get('/api/items', {
      headers: { authorization: 'Bearer kiwa-poc-token' },
    });
    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toBe('public, max-age=60');
    const body = await response.json();
    expect(body.count).toBe(3);
    expect(body.items.map((i: { name: string }) => i.name)).toEqual(['kiwa', 'nuxt', 'nitro']);
  });

  test('GET /api/items without auth returns 401', async ({ request }) => {
    const response = await request.get('/api/items');
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('unauthorized');
  });

  test('GET /api/items?tag=framework filters to 2 items', async ({ request }) => {
    const response = await request.get('/api/items?tag=framework', {
      headers: { authorization: 'Bearer kiwa-poc-token' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.count).toBe(2);
    expect(body.items.map((i: { name: string }) => i.name).sort()).toEqual(['kiwa', 'nuxt']);
  });

  test('GET / (page) renders kiwa Nuxt PoC heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('kiwa Nuxt PoC');
    await expect(page.locator('a[href="/api/items"]')).toBeVisible();
  });
});
