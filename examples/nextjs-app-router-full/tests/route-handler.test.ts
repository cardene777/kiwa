// kiwa unit test for app/api/items/_kiwa/route-handler.ts
// — Route Handler は pure Request → Response 関数なので Vitest で direct invoke。

import { describe, expect, it } from 'vitest';
import { itemsGetHandler } from '../app/api/items/_kiwa/route-handler.js';

async function readJson(response: Response): Promise<unknown> {
  return await response.clone().json();
}

function buildRequest(url: string, cookie?: string): Request {
  return new Request(url, cookie ? { headers: { cookie } } : undefined);
}

describe('itemsGetHandler (Route Handler) direct invoke', () => {
  it('T-NF-301: session 不在で 302 redirect to /login?from=/api/items', async () => {
    const response = await itemsGetHandler(buildRequest('http://localhost/api/items'));
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/login?from=%2Fapi%2Fitems');
  });

  it('T-NF-302: session=admin で 200 + 全 items + cache-control', async () => {
    const response = await itemsGetHandler(buildRequest('http://localhost/api/items', 'session=admin'));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('public, max-age=60');
    const body = (await readJson(response)) as { count: number; user: string };
    expect(body.count).toBe(3);
    expect(body.user).toBe('u1');
  });

  it('T-NF-303: session=banned で 403 + error JSON', async () => {
    const response = await itemsGetHandler(buildRequest('http://localhost/api/items', 'session=banned'));
    expect(response.status).toBe(403);
    expect(await readJson(response)).toEqual({ error: 'banned' });
  });

  it('T-NF-304: tag=framework で filter (2 件)', async () => {
    const response = await itemsGetHandler(buildRequest('http://localhost/api/items?tag=framework', 'session=admin'));
    const body = (await readJson(response)) as { count: number; items: Array<{ name: string }> };
    expect(body.count).toBe(2);
    expect(body.items.map((i) => i.name).sort()).toEqual(['kiwa', 'nextjs']);
  });

  it('T-NF-305: limit=1 で 1 件のみ返却', async () => {
    const response = await itemsGetHandler(buildRequest('http://localhost/api/items?limit=1', 'session=admin'));
    const body = (await readJson(response)) as { count: number };
    expect(body.count).toBe(1);
  });
});
