import { describe, expect, it } from 'vitest';
import { invokeRoute } from '@kiwa-test/hono';
import {
  buildDogfoodApp,
  resetRateLimit,
  ROUTE_PATHS,
  type DogfoodEnv,
} from '../src/routes/app.js';
import { createDogfoodBindings } from '../src/workers/bindings.js';

describe('workers env bindings (KV + D1 + R2 + ExecutionContext)', () => {
  it('T-DHW-WE-001 KV binding round-trips get/put through /kv-counter', async () => {
    resetRateLimit();
    const app = buildDogfoodApp();
    const bindings = createDogfoodBindings();
    await invokeRoute<DogfoodEnv, Record<string, unknown>>({
      app,
      method: 'POST',
      path: ROUTE_PATHS.kvCounter,
      headers: {
        authorization: `Bearer ${bindings.env.AUTH_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({}),
      env: bindings.env,
      executionCtx: bindings.ctx,
    });
    const stored = await bindings.kv.get('dogfood');
    expect(stored).toBe('1');
  });

  it('T-DHW-WE-002 D1 binding returns rows registered via __setResponse', async () => {
    resetRateLimit();
    const app = buildDogfoodApp();
    const bindings = createDogfoodBindings();
    const sql = 'SELECT id, title FROM notes ORDER BY id ASC';
    bindings.d1.__setResponse(sql, [{ id: 1, title: 'first' }, { id: 2, title: 'second' }]);
    const result = await invokeRoute<DogfoodEnv, Record<string, unknown>>({
      app,
      method: 'GET',
      path: ROUTE_PATHS.d1List,
      headers: { authorization: `Bearer ${bindings.env.AUTH_TOKEN}` },
      env: bindings.env,
      executionCtx: bindings.ctx,
    });
    expect(result.response.status).toBe(200);
    const body = result.response.body as { notes: Array<{ id: number; title: string }> };
    expect(body.notes.length).toBe(2);
    expect(body.notes[0]?.title).toBe('first');
    expect(bindings.d1.__log()[0]?.query).toBe(sql);
  });

  it('T-DHW-WE-003 R2 binding writes body via /r2-upload + surfaces etag', async () => {
    resetRateLimit();
    const app = buildDogfoodApp();
    const bindings = createDogfoodBindings();
    const result = await invokeRoute<DogfoodEnv, Record<string, unknown>>({
      app,
      method: 'POST',
      path: ROUTE_PATHS.r2Upload,
      headers: {
        authorization: `Bearer ${bindings.env.AUTH_TOKEN}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ key: 'a.txt', contents: 'hello' }),
      env: bindings.env,
      executionCtx: bindings.ctx,
    });
    expect(result.response.status).toBe(200);
    const body = result.response.body as { etag: string; key: string };
    expect(body.key).toBe('a.txt');
    expect(body.etag).toContain('a.txt');
    const stored = await bindings.r2.get('a.txt');
    expect(stored).not.toBeNull();
  });

  it('T-DHW-WE-004 ExecutionContext.waitUntil accumulates then drains', async () => {
    const bindings = createDogfoodBindings();
    bindings.ctx.waitUntil(Promise.resolve('a'));
    bindings.ctx.waitUntil(Promise.resolve('b'));
    expect(bindings.ctx.pendingCount()).toBe(2);
    await bindings.ctx.waitUntilAll();
    expect(bindings.ctx.pendingCount()).toBe(0);
  });

  it('T-DHW-WE-005 R2 binding survives 3 concurrent uploads + lists them', async () => {
    resetRateLimit();
    const app = buildDogfoodApp();
    const bindings = createDogfoodBindings({ rateLimit: 10 });
    for (const key of ['a', 'b', 'c']) {
      await invokeRoute<DogfoodEnv, Record<string, unknown>>({
        app,
        method: 'POST',
        path: ROUTE_PATHS.r2Upload,
        headers: {
          authorization: `Bearer ${bindings.env.AUTH_TOKEN}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ key, contents: `body-${key}` }),
        env: bindings.env,
        executionCtx: bindings.ctx,
      });
    }
    const listing = await bindings.r2.list();
    const keys = listing.objects.map((o) => o.key);
    expect(keys).toContain('a');
    expect(keys).toContain('b');
    expect(keys).toContain('c');
  });

  it('T-DHW-WE-006 D1 binding logs bindings passed via prepare().bind()', async () => {
    const bindings = createDogfoodBindings();
    const stmt = bindings.d1.prepare('SELECT * FROM notes WHERE id = ?').bind(42);
    await stmt.first();
    const log = bindings.d1.__log();
    expect(log.length).toBe(1);
    expect(log[0]?.query).toContain('WHERE id = ?');
    expect(log[0]?.bindings).toEqual([42]);
  });
});
