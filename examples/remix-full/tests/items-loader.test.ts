// kiwa unit test for app/lib/_kiwa/items-loader.ts
// — invokes the pure loader through @kiwa-test/remix's invokeLoader.

import { describe, expect, it } from 'vitest';
import { invokeLoader } from '@kiwa-test/remix';
import { itemsLoader } from '../app/lib/_kiwa/items-loader.js';
import type { ItemsLoaderData } from '../app/lib/_kiwa/items-loader.js';

async function readJson(response: Response | null): Promise<unknown> {
  if (response === null) return undefined;
  return await response.clone().json();
}

describe('itemsLoader via @kiwa-test/remix invokeLoader', () => {
  it('T-RF-001: session=admin で 200 + 全 items + cache-control header 注入', async () => {
    const { response, redirect } = await invokeLoader({
      loader: itemsLoader,
      url: 'http://localhost/items',
      headers: { cookie: 'session=admin' },
    });
    expect(redirect).toBeNull();
    expect(response).not.toBeNull();
    expect(response?.status).toBe(200);
    expect(response?.headers.get('cache-control')).toBe('public, max-age=60');
    const body = (await readJson(response)) as ItemsLoaderData;
    expect(body.count).toBe(3);
    expect(body.user).toBe('u1');
    expect(body.items.map((i) => i.name)).toEqual(['kiwa', 'remix', 'vite']);
  });

  it('T-RF-002: session 不在で /login に 302 redirect (from クエリ付き)', async () => {
    const { redirect, response } = await invokeLoader({
      loader: itemsLoader,
      url: 'http://localhost/items',
    });
    expect(redirect).not.toBeNull();
    expect(redirect?.status).toBe(302);
    expect(redirect?.location).toBe('/login?from=%2Fitems');
    expect(response?.status).toBe(302);
  });

  it('T-RF-003: session=banned で 403 + error JSON', async () => {
    const { response } = await invokeLoader({
      loader: itemsLoader,
      url: 'http://localhost/items',
      headers: { cookie: 'session=banned' },
    });
    expect(response?.status).toBe(403);
    expect(await readJson(response)).toEqual({ error: 'banned' });
  });

  it('T-RF-004: tag=framework で filter (2 件)', async () => {
    const { response } = await invokeLoader({
      loader: itemsLoader,
      url: 'http://localhost/items?tag=framework',
      headers: { cookie: 'session=admin' },
    });
    const body = (await readJson(response)) as ItemsLoaderData;
    expect(body.count).toBe(2);
    expect(body.items.map((i) => i.name).sort()).toEqual(['kiwa', 'remix']);
  });

  it('T-RF-005: tag 配列 (react + runtime) で OR filter', async () => {
    const { response } = await invokeLoader({
      loader: itemsLoader,
      url: 'http://localhost/items?tag=react&tag=runtime',
      headers: { cookie: 'session=admin' },
    });
    const body = (await readJson(response)) as ItemsLoaderData;
    expect(body.count).toBe(2);
    expect(body.items.map((i) => i.name).sort()).toEqual(['remix', 'vite']);
  });

  it('T-RF-006: limit=1 で 1 件のみ返却', async () => {
    const { response } = await invokeLoader({
      loader: itemsLoader,
      url: 'http://localhost/items?limit=1',
      headers: { cookie: 'session=admin' },
    });
    const body = (await readJson(response)) as ItemsLoaderData;
    expect(body.count).toBe(1);
  });

  it('T-RF-007: tag + limit 組合せ', async () => {
    const { response } = await invokeLoader({
      loader: itemsLoader,
      url: 'http://localhost/items?tag=framework&limit=1',
      headers: { cookie: 'session=admin' },
    });
    const body = (await readJson(response)) as ItemsLoaderData;
    expect(body.count).toBe(1);
    expect(['kiwa', 'remix']).toContain(body.items[0]?.name);
  });

  it('T-RF-008: 不正 limit (limit=abc) は無視して全件返却', async () => {
    const { response } = await invokeLoader({
      loader: itemsLoader,
      url: 'http://localhost/items?limit=abc',
      headers: { cookie: 'session=admin' },
    });
    const body = (await readJson(response)) as ItemsLoaderData;
    expect(body.count).toBe(3);
  });
});
