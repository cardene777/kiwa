// kiwa unit test for app/lib/_kiwa/items-resource.ts
// — invokes the Resource Route module through @kiwa-test/remix's invokeResourceRoute,
// covering GET / POST dispatch + 401 / 403 / 400 / method-not-allowed (405) paths.

import { beforeEach, describe, expect, it } from 'vitest';
import { invokeResourceRoute } from '@kiwa-test/remix';
import { itemsResourceRoute, readonlyItemsResource, resetItemsResourceCount } from '../app/lib/_kiwa/items-resource.js';

async function readJson(response: Response | null): Promise<unknown> {
  if (response === null) return undefined;
  return await response.clone().json();
}

describe('itemsResourceRoute via @kiwa-test/remix invokeResourceRoute', () => {
  beforeEach(() => {
    resetItemsResourceCount(0);
  });

  it('T-RF-201: GET dispatch — loader を呼出し count=0 返却', async () => {
    const r = await invokeResourceRoute({
      route: itemsResourceRoute,
      url: 'http://localhost/api/items',
      method: 'GET',
      headers: { cookie: 'session=admin' },
    });
    expect(r.dispatch).toBe('loader');
    expect(r.response?.status).toBe(200);
    expect(await readJson(r.response)).toEqual({ count: 0, user: 'u1' });
  });

  it('T-RF-202: GET 認証なし → 401', async () => {
    const r = await invokeResourceRoute({
      route: itemsResourceRoute,
      url: 'http://localhost/api/items',
      method: 'GET',
    });
    expect(r.response?.status).toBe(401);
    expect(await readJson(r.response)).toEqual({ error: 'unauthenticated' });
  });

  it('T-RF-203: GET banned → 403', async () => {
    const r = await invokeResourceRoute({
      route: itemsResourceRoute,
      url: 'http://localhost/api/items',
      method: 'GET',
      headers: { cookie: 'session=banned' },
    });
    expect(r.response?.status).toBe(403);
  });

  it('T-RF-204: POST dispatch — action を呼出し delta=5 で count=5', async () => {
    const r = await invokeResourceRoute({
      route: itemsResourceRoute,
      url: 'http://localhost/api/items',
      method: 'POST',
      headers: { cookie: 'session=admin' },
      formData: { delta: '5' },
    });
    expect(r.dispatch).toBe('action');
    expect(r.response?.status).toBe(200);
    expect(await readJson(r.response)).toEqual({ count: 5, user: 'u1' });
  });

  it('T-RF-205: POST 不正 delta=abc → 400 + field error', async () => {
    const r = await invokeResourceRoute({
      route: itemsResourceRoute,
      url: 'http://localhost/api/items',
      method: 'POST',
      headers: { cookie: 'session=admin' },
      formData: { delta: 'abc' },
    });
    expect(r.response?.status).toBe(400);
    expect(await readJson(r.response)).toEqual({ field: 'delta', message: 'delta must be an integer' });
  });

  it('T-RF-206: readonly resource に POST すると method-not-allowed (405) + allow header に GET, HEAD のみ', async () => {
    const r = await invokeResourceRoute({
      route: readonlyItemsResource,
      url: 'http://localhost/api/items',
      method: 'POST',
      headers: { cookie: 'session=admin' },
    });
    expect(r.dispatch).toBe('method-not-allowed');
    expect(r.methodNotAllowed?.method).toBe('POST');
    expect(r.methodNotAllowed?.allow).toEqual(['GET', 'HEAD']);
    expect(r.response?.status).toBe(405);
    expect(r.response?.headers.get('allow')).toBe('GET, HEAD');
  });
});
