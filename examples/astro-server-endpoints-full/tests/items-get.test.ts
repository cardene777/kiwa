// kiwa unit test for src/pages/api/_kiwa/items-endpoint.ts (GET)
// — invokes the pure APIRoute through @kiwa/astro's invokeEndpoint.

import { describe, expect, it } from 'vitest';
import { invokeEndpoint } from '@kiwa/astro';
import { itemsGetEndpoint } from '../src/pages/api/_kiwa/items-endpoint.js';

async function readJson(response: Response): Promise<unknown> {
  return await response.clone().json();
}

describe('itemsGetEndpoint via @kiwa/astro invokeEndpoint', () => {
  it('T-AF-001: session=admin で 200 + 全 items + cache-control header 注入', async () => {
    const { response, redirect } = await invokeEndpoint({
      endpoint: itemsGetEndpoint,
      url: 'http://localhost/api/items',
      cookies: { session: 'admin' },
    });
    expect(redirect).toBeNull();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('public, max-age=60');
    const body = (await readJson(response)) as { count: number; user: string; items: Array<{ name: string }> };
    expect(body.count).toBe(3);
    expect(body.user).toBe('u1');
    expect(body.items.map((i) => i.name)).toEqual(['kiwa', 'astro', 'vite']);
  });

  it('T-AF-002: session 不在で /login に 302 redirect (from クエリ付き)', async () => {
    const { redirect, response } = await invokeEndpoint({
      endpoint: itemsGetEndpoint,
      url: 'http://localhost/api/items',
    });
    expect(redirect).not.toBeNull();
    expect(redirect?.status).toBe(302);
    expect(redirect?.url).toBe('/login?from=%2Fapi%2Fitems');
    expect(response.status).toBe(302);
  });

  it('T-AF-003: session=banned で 403 + error JSON', async () => {
    const { response } = await invokeEndpoint({
      endpoint: itemsGetEndpoint,
      url: 'http://localhost/api/items',
      cookies: { session: 'banned' },
    });
    expect(response.status).toBe(403);
    expect(await readJson(response)).toEqual({ error: 'banned' });
  });

  it('T-AF-004: tag=framework で filter (2 件)', async () => {
    const { response } = await invokeEndpoint({
      endpoint: itemsGetEndpoint,
      url: 'http://localhost/api/items?tag=framework',
      cookies: { session: 'admin' },
    });
    const body = (await readJson(response)) as { count: number; items: Array<{ name: string }> };
    expect(body.count).toBe(2);
    expect(body.items.map((i) => i.name).sort()).toEqual(['astro', 'kiwa']);
  });

  it('T-AF-005: tag 配列 (ssr + runtime) で OR filter', async () => {
    const { response } = await invokeEndpoint({
      endpoint: itemsGetEndpoint,
      url: 'http://localhost/api/items?tag=ssr&tag=runtime',
      cookies: { session: 'admin' },
    });
    const body = (await readJson(response)) as { count: number; items: Array<{ name: string }> };
    expect(body.count).toBe(2);
    expect(body.items.map((i) => i.name).sort()).toEqual(['astro', 'vite']);
  });

  it('T-AF-006: limit=1 で 1 件のみ返却', async () => {
    const { response } = await invokeEndpoint({
      endpoint: itemsGetEndpoint,
      url: 'http://localhost/api/items?limit=1',
      cookies: { session: 'admin' },
    });
    const body = (await readJson(response)) as { count: number };
    expect(body.count).toBe(1);
  });

  it('T-AF-007: tag + limit 組合せ', async () => {
    const { response } = await invokeEndpoint({
      endpoint: itemsGetEndpoint,
      url: 'http://localhost/api/items?tag=framework&limit=1',
      cookies: { session: 'admin' },
    });
    const body = (await readJson(response)) as { count: number; items: Array<{ name: string }> };
    expect(body.count).toBe(1);
    expect(['kiwa', 'astro']).toContain(body.items[0]?.name);
  });

  it('T-AF-008: 不正 limit (limit=abc) は無視して全件返却', async () => {
    const { response } = await invokeEndpoint({
      endpoint: itemsGetEndpoint,
      url: 'http://localhost/api/items?limit=abc',
      cookies: { session: 'admin' },
    });
    const body = (await readJson(response)) as { count: number };
    expect(body.count).toBe(3);
  });
});
