// Playwright e2e — real `astro dev` server を webServer config で auto 起動し、
// http://localhost:3060 経由で 3 endpoint (items GET / items POST / counter) の
// 統合動作を end-to-end 確認する。

import { expect, test } from '@playwright/test';

test.describe('Astro full PoC — real dev server', () => {
  test('GET /api/items unauthenticated -> 302 redirect to /login?from=/api/items', async ({ request }) => {
    const response = await request.get('/api/items', { maxRedirects: 0 });
    expect(response.status()).toBe(302);
    expect(response.headers()['location']).toBe('/login?from=%2Fapi%2Fitems');
  });

  test('GET /api/items with session=admin returns 200 + items JSON + cache-control', async ({ request }) => {
    const response = await request.get('/api/items', {
      headers: { cookie: 'session=admin' },
    });
    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toBe('public, max-age=60');
    const body = await response.json();
    expect(body.count).toBe(3);
    expect(body.user).toBe('u1');
    expect(body.items.map((i: { name: string }) => i.name)).toEqual(['kiwa', 'astro', 'vite']);
  });

  test('GET /api/items with session=banned returns 403 JSON', async ({ request }) => {
    const response = await request.get('/api/items', {
      headers: { cookie: 'session=banned' },
    });
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.error).toBe('banned');
  });

  test('POST /api/items with valid name returns deterministic id + set-cookie', async ({ request }) => {
    const response = await request.post('/api/items?seed=200', {
      headers: { cookie: 'session=admin' },
      form: { name: 'astro' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ id: 205, name: 'astro' });
    expect(response.headers()['set-cookie']).toContain('last-created=205');
  });

  test('POST /api/items with empty name returns 400 + field error', async ({ request }) => {
    const response = await request.post('/api/items', {
      headers: { cookie: 'session=admin' },
      form: { name: '' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.field).toBe('name');
  });

  test('GET /api/counter — x-request-id middleware echo', async ({ request }) => {
    const response = await request.get('/api/counter', {
      headers: { 'x-request-id': 'req-from-e2e' },
    });
    expect(response.status()).toBe(200);
    expect(response.headers()['x-request-id']).toBe('req-from-e2e');
    const body = await response.json();
    expect(typeof body.count).toBe('number');
  });

  test('POST /api/counter delta=3 returns updated count + x-request-id echo', async ({ request }) => {
    const response = await request.post('/api/counter', {
      headers: { 'x-request-id': 'req-post-1' },
      form: { delta: '3' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body.count).toBe('number');
    expect(response.headers()['x-request-id']).toBe('req-post-1');
  });
});
