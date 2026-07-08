// kiwa unit test for server/api/_kiwa/items-handler.ts
// — invokes the pure handler through @kiwa/nuxt's invokeEventHandler.
// Nitro / h3 / Nuxt の runtime 一切起動せず、 simulated H3 event だけで side-effect
// (response headers / status code / branded redirect signal) を全捕捉する。

import { describe, expect, it } from 'vitest';
import { invokeEventHandler } from '@kiwa/nuxt';
import { itemsHandler } from '../server/api/_kiwa/items-handler.js';

describe('itemsHandler via @kiwa/nuxt invokeEventHandler', () => {
  it('T-NF-001: 認証成功時に全 items を返す + cache-control header 注入', async () => {
    const { result, env } = await invokeEventHandler({
      handler: itemsHandler,
      url: 'http://localhost/api/items',
      headers: { authorization: 'Bearer kiwa-poc-token' },
    });
    expect(result).toEqual({
      items: [
        { id: 1, name: 'kiwa', tags: ['test', 'framework'] },
        { id: 2, name: 'nuxt', tags: ['framework', 'vue'] },
        { id: 3, name: 'nitro', tags: ['runtime', 'server'] },
      ],
      count: 3,
    });
    expect(env.status).toBe(200);
    expect(env.responseHeaders.get('cache-control')).toBe('public, max-age=60');
  });

  it('T-NF-002: 認証 token なしは 401 + error JSON', async () => {
    const { result, env } = await invokeEventHandler({
      handler: itemsHandler,
      url: 'http://localhost/api/items',
    });
    expect(result).toEqual({ error: 'unauthorized' });
    expect(env.status).toBe(401);
    expect(env.responseHeaders.has('cache-control')).toBe(false);
  });

  it('T-NF-003: 不正 token (Bearer junk) も 401', async () => {
    const { result, env } = await invokeEventHandler({
      handler: itemsHandler,
      url: 'http://localhost/api/items',
      headers: { authorization: 'Bearer junk' },
    });
    expect((result as { error: string }).error).toBe('unauthorized');
    expect(env.status).toBe(401);
  });

  it('T-NF-004: tag=framework で filter (2 件)', async () => {
    const { result } = await invokeEventHandler({
      handler: itemsHandler,
      url: 'http://localhost/api/items?tag=framework',
      headers: { authorization: 'Bearer kiwa-poc-token' },
    });
    const body = result as unknown as { items: Array<{ name: string }>; count: number };
    expect(body.count).toBe(2);
    expect(body.items.map((i) => i.name).sort()).toEqual(['kiwa', 'nuxt']);
  });

  it('T-NF-005: tag 配列 (vue + runtime) で OR filter', async () => {
    const { result } = await invokeEventHandler({
      handler: itemsHandler,
      url: 'http://localhost/api/items?tag=vue&tag=runtime',
      headers: { authorization: 'Bearer kiwa-poc-token' },
    });
    const body = result as unknown as { items: Array<{ name: string }>; count: number };
    expect(body.count).toBe(2);
    expect(body.items.map((i) => i.name).sort()).toEqual(['nitro', 'nuxt']);
  });

  it('T-NF-006: limit=1 で 1 件のみ返却', async () => {
    const { result } = await invokeEventHandler({
      handler: itemsHandler,
      url: 'http://localhost/api/items?limit=1',
      headers: { authorization: 'Bearer kiwa-poc-token' },
    });
    expect((result as unknown as { count: number }).count).toBe(1);
  });

  it('T-NF-007: tag + limit 組合せ', async () => {
    const { result } = await invokeEventHandler({
      handler: itemsHandler,
      url: 'http://localhost/api/items?tag=framework&limit=1',
      headers: { authorization: 'Bearer kiwa-poc-token' },
    });
    const body = result as unknown as { items: Array<{ name: string }>; count: number };
    expect(body.count).toBe(1);
    expect(['kiwa', 'nuxt']).toContain(body.items[0]?.name);
  });

  it('T-NF-008: 不正 limit (limit=abc) は無視して全件返却', async () => {
    const { result } = await invokeEventHandler({
      handler: itemsHandler,
      url: 'http://localhost/api/items?limit=abc',
      headers: { authorization: 'Bearer kiwa-poc-token' },
    });
    expect((result as unknown as { count: number }).count).toBe(3);
  });
});
