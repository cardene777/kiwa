// kiwa unit test for src/routes/items/_kiwa/items-load.ts
// — invokes the pure load function through @kiwa/sveltekit's invokeLoad.
// SvelteKit / Vite runtime は一切起動せず、 simulated load event だけで
// data / redirect / error / responseHeaders / cookies を全捕捉する。

import { describe, expect, it } from 'vitest';
import { invokeLoad } from '@kiwa/sveltekit';
import { itemsLoad } from '../src/routes/items/_kiwa/items-load.js';

describe('itemsLoad via @kiwa/sveltekit invokeLoad', () => {
  it('T-SF-001: session=admin で全 items + cache-control header 注入', async () => {
    const { data, env, redirect, error } = await invokeLoad({
      load: itemsLoad,
      url: 'http://localhost/items',
      cookies: { session: 'admin' },
    });
    expect(redirect).toBeNull();
    expect(error).toBeUndefined();
    expect(data).toEqual({
      items: [
        { id: 1, name: 'kiwa', tags: ['test', 'framework'] },
        { id: 2, name: 'sveltekit', tags: ['framework', 'svelte'] },
        { id: 3, name: 'vite', tags: ['runtime', 'bundler'] },
      ],
      count: 3,
      user: 'admin',
    });
    expect(env.responseHeaders.get('cache-control')).toBe('public, max-age=60');
  });

  it('T-SF-002: session 不在で /login へ 302 redirect (from クエリ付き)', async () => {
    const { redirect, data } = await invokeLoad({
      load: itemsLoad,
      url: 'http://localhost/items',
    });
    expect(redirect).not.toBeNull();
    expect(redirect?.status).toBe(302);
    expect(redirect?.location).toBe('/login?from=%2Fitems');
    expect(data).toBeUndefined();
  });

  it('T-SF-003: session=banned で 403 error throw', async () => {
    const { error, data } = await invokeLoad({
      load: itemsLoad,
      url: 'http://localhost/items',
      cookies: { session: 'banned' },
    });
    expect(data).toBeUndefined();
    expect(error).not.toBeUndefined();
    const err = error as { status: number; body: { message: string } };
    expect(err.status).toBe(403);
    expect(err.body.message).toBe('banned');
  });

  it('T-SF-004: tag=framework で filter (2 件)', async () => {
    const { data } = await invokeLoad({
      load: itemsLoad,
      url: 'http://localhost/items?tag=framework',
      cookies: { session: 'admin' },
    });
    expect(data?.count).toBe(2);
    expect(data?.items.map((i) => i.name).sort()).toEqual(['kiwa', 'sveltekit']);
  });

  it('T-SF-005: tag 配列 (svelte + runtime) で OR filter', async () => {
    const { data } = await invokeLoad({
      load: itemsLoad,
      url: 'http://localhost/items?tag=svelte&tag=runtime',
      cookies: { session: 'admin' },
    });
    expect(data?.count).toBe(2);
    expect(data?.items.map((i) => i.name).sort()).toEqual(['sveltekit', 'vite']);
  });

  it('T-SF-006: limit=1 で 1 件のみ返却', async () => {
    const { data } = await invokeLoad({
      load: itemsLoad,
      url: 'http://localhost/items?limit=1',
      cookies: { session: 'admin' },
    });
    expect(data?.count).toBe(1);
  });

  it('T-SF-007: tag + limit 組合せ', async () => {
    const { data } = await invokeLoad({
      load: itemsLoad,
      url: 'http://localhost/items?tag=framework&limit=1',
      cookies: { session: 'admin' },
    });
    expect(data?.count).toBe(1);
    expect(['kiwa', 'sveltekit']).toContain(data?.items[0]?.name);
  });

  it('T-SF-008: 不正 limit (limit=abc) は無視して全件返却', async () => {
    const { data } = await invokeLoad({
      load: itemsLoad,
      url: 'http://localhost/items?limit=abc',
      cookies: { session: 'admin' },
    });
    expect(data?.count).toBe(3);
  });
});
