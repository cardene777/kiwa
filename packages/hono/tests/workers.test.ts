import { describe, expect, it } from 'vitest';
import {
  createWorkersEnv,
  createExecutionContext,
  mockKVNamespace,
  mockD1Database,
  mockR2Bucket,
  isWorkersEnv,
  isExecutionContextMock,
  isKVNamespaceMock,
  isD1DatabaseMock,
  isR2BucketMock,
  WORKERS_ENV_SYMBOL,
  EXECUTION_CTX_SYMBOL,
} from '../src/workers.js';
import { createHonoApp, invokeRoute } from '../src/app.js';

describe('mockKVNamespace', () => {
  it('T-H-200 put + get roundtrip returns the stored value', async () => {
    const kv = mockKVNamespace();
    await kv.put('key', 'value');
    expect(await kv.get('key')).toBe('value');
    expect(isKVNamespaceMock(kv)).toBe(true);
  });

  it('T-H-201 missing key returns null', async () => {
    const kv = mockKVNamespace();
    expect(await kv.get('nope')).toBeNull();
  });

  it('T-H-202 delete removes the key', async () => {
    const kv = mockKVNamespace();
    await kv.put('k', 'v');
    await kv.delete('k');
    expect(await kv.get('k')).toBeNull();
  });

  it('T-H-203 getWithMetadata returns the metadata that was written', async () => {
    const kv = mockKVNamespace<{ tag: string }>();
    await kv.put('k', 'v', { metadata: { tag: 'a' } });
    const { value, metadata } = await kv.getWithMetadata('k');
    expect(value).toBe('v');
    expect(metadata).toEqual({ tag: 'a' });
  });

  it('T-H-204 getWithMetadata returns nulls for missing key', async () => {
    const kv = mockKVNamespace();
    const { value, metadata } = await kv.getWithMetadata('missing');
    expect(value).toBeNull();
    expect(metadata).toBeNull();
  });

  it('T-H-205 list returns keys filtered by prefix', async () => {
    const kv = mockKVNamespace();
    await kv.put('user:1', '');
    await kv.put('user:2', '');
    await kv.put('other:1', '');
    const listed = await kv.list({ prefix: 'user:' });
    expect(listed.keys.map((k) => k.name).sort()).toEqual(['user:1', 'user:2']);
  });

  it('T-H-206 expirationTtl expires the key after wall-clock time passes', async () => {
    const kv = mockKVNamespace();
    const originalNow = Date.now;
    let now = 1_000_000;
    Date.now = () => now;
    try {
      await kv.put('temp', 'v', { expirationTtl: 60 }); // 60s
      expect(await kv.get('temp')).toBe('v');
      now += 61 * 1000;
      expect(await kv.get('temp')).toBeNull();
    } finally {
      Date.now = originalNow;
    }
  });

  it('T-H-207 expiration (unix seconds) is honored', async () => {
    const kv = mockKVNamespace();
    const originalNow = Date.now;
    let now = 2_000_000;
    Date.now = () => now;
    try {
      const expireAt = Math.floor(now / 1000) + 10; // 10s in the future
      await kv.put('t', 'v', { expiration: expireAt });
      expect(await kv.get('t')).toBe('v');
      now += 11 * 1000;
      expect(await kv.get('t')).toBeNull();
    } finally {
      Date.now = originalNow;
    }
  });

  it('T-H-208 __snapshot returns the whole store', async () => {
    const kv = mockKVNamespace();
    await kv.put('a', '1');
    await kv.put('b', '2');
    const snap = kv.__snapshot();
    expect(Object.keys(snap).sort()).toEqual(['a', 'b']);
  });

  it('T-H-209 list respects limit', async () => {
    const kv = mockKVNamespace();
    for (let i = 0; i < 5; i += 1) await kv.put(`k${i}`, '');
    const listed = await kv.list({ limit: 3 });
    expect(listed.keys.length).toBe(3);
  });
});

describe('mockD1Database', () => {
  it('T-H-220 prepare + all returns canned response rows', async () => {
    const d1 = mockD1Database();
    d1.__setResponse('SELECT * FROM users', [{ id: 1 }, { id: 2 }]);
    const { results } = await d1.prepare('SELECT * FROM users').all();
    expect(results).toEqual([{ id: 1 }, { id: 2 }]);
    expect(isD1DatabaseMock(d1)).toBe(true);
  });

  it('T-H-221 prepare + first returns the first row', async () => {
    const d1 = mockD1Database();
    d1.__setResponse('SELECT * FROM users LIMIT 1', [{ id: 42 }]);
    const row = await d1.prepare('SELECT * FROM users LIMIT 1').first<{ id: number }>();
    expect(row).toEqual({ id: 42 });
  });

  it('T-H-222 prepare + first(col) returns just that column', async () => {
    const d1 = mockD1Database();
    d1.__setResponse('SELECT name FROM users LIMIT 1', [{ name: 'alice' }]);
    const name = await d1.prepare('SELECT name FROM users LIMIT 1').first<string>('name');
    expect(name).toBe('alice');
  });

  it('T-H-223 first() with no rows returns null', async () => {
    const d1 = mockD1Database();
    d1.__setResponse('SELECT * FROM empty', []);
    expect(await d1.prepare('SELECT * FROM empty').first()).toBeNull();
  });

  it('T-H-224 bind + all logs bindings + query', async () => {
    const d1 = mockD1Database();
    d1.__setResponse('SELECT * FROM users WHERE id = ?', [{ id: 7 }]);
    await d1.prepare('SELECT * FROM users WHERE id = ?').bind(7).all();
    const log = d1.__log();
    expect(log[log.length - 1]).toEqual({ query: 'SELECT * FROM users WHERE id = ?', bindings: [7] });
  });

  it('T-H-225 run() returns success meta and no results', async () => {
    const d1 = mockD1Database();
    const { success, meta, results } = await d1.prepare('INSERT INTO users VALUES (?)').bind(1).run();
    expect(success).toBe(true);
    expect(meta.changes).toBe(1);
    expect(results).toEqual([]);
  });

  it('T-H-226 batch runs every prepared statement', async () => {
    const d1 = mockD1Database();
    const results = await d1.batch([
      d1.prepare('UPDATE u SET x=1'),
      d1.prepare('UPDATE u SET x=2'),
    ]);
    expect(results.length).toBe(2);
    expect(results.every((r) => r.success)).toBe(true);
  });

  it('T-H-227 exec runs a raw query and hits canned response', async () => {
    const d1 = mockD1Database();
    d1.__setResponse('PRAGMA foreign_keys = ON', []);
    const { success } = await d1.exec('PRAGMA foreign_keys = ON');
    expect(success).toBe(true);
  });
});

describe('mockR2Bucket', () => {
  it('T-H-240 put + get roundtrip returns the stored object', async () => {
    const r2 = mockR2Bucket();
    await r2.put('logo.png', 'binary-goes-here');
    const obj = await r2.get('logo.png');
    expect(obj?.key).toBe('logo.png');
    expect(obj?.value).toBe('binary-goes-here');
    expect(isR2BucketMock(r2)).toBe(true);
  });

  it('T-H-241 size is set correctly for string + ArrayBuffer values', async () => {
    const r2 = mockR2Bucket();
    await r2.put('a.txt', 'hello');
    const buf = new Uint8Array([1, 2, 3, 4]).buffer;
    await r2.put('b.bin', buf);
    expect((await r2.get('a.txt'))?.size).toBe(5);
    expect((await r2.get('b.bin'))?.size).toBe(4);
  });

  it('T-H-242 customMetadata + httpMetadata round-trip', async () => {
    const r2 = mockR2Bucket();
    await r2.put('m.txt', 'x', { httpMetadata: { contentType: 'text/plain' }, customMetadata: { tag: 't1' } });
    const obj = await r2.get('m.txt');
    expect(obj?.httpMetadata?.contentType).toBe('text/plain');
    expect(obj?.customMetadata?.tag).toBe('t1');
  });

  it('T-H-243 missing key returns null', async () => {
    const r2 = mockR2Bucket();
    expect(await r2.get('nope')).toBeNull();
  });

  it('T-H-244 delete removes the object', async () => {
    const r2 = mockR2Bucket();
    await r2.put('gone', 'v');
    await r2.delete('gone');
    expect(await r2.get('gone')).toBeNull();
  });

  it('T-H-245 list returns objects with prefix', async () => {
    const r2 = mockR2Bucket();
    await r2.put('img/a.png', 'a');
    await r2.put('img/b.png', 'b');
    await r2.put('doc/a.pdf', 'x');
    const { objects } = await r2.list({ prefix: 'img/' });
    expect(objects.map((o) => o.key).sort()).toEqual(['img/a.png', 'img/b.png']);
  });
});

describe('createExecutionContext', () => {
  it('T-H-260 waitUntil captures promises and waitUntilAll flushes them', async () => {
    const ctx = createExecutionContext();
    let flag = false;
    ctx.waitUntil(new Promise<void>((resolve) => setTimeout(() => { flag = true; resolve(); }, 5)));
    await ctx.waitUntilAll();
    expect(flag).toBe(true);
    expect(isExecutionContextMock(ctx)).toBe(true);
    expect((ctx as unknown as { [EXECUTION_CTX_SYMBOL]: true })[EXECUTION_CTX_SYMBOL]).toBe(true);
  });

  it('T-H-261 passThroughOnException toggles didPassThrough()', () => {
    const ctx = createExecutionContext();
    expect(ctx.didPassThrough()).toBe(false);
    ctx.passThroughOnException();
    expect(ctx.didPassThrough()).toBe(true);
  });

  it('T-H-262 pendingCount reflects registered promises', () => {
    const ctx = createExecutionContext();
    expect(ctx.pendingCount()).toBe(0);
    ctx.waitUntil(Promise.resolve());
    ctx.waitUntil(Promise.resolve());
    expect(ctx.pendingCount()).toBe(2);
  });

  it('T-H-263 waitUntilAll drains until no new promises are added', async () => {
    const ctx = createExecutionContext();
    const step1 = new Promise<void>((resolve) => {
      setTimeout(() => {
        ctx.waitUntil(new Promise<void>((r) => setTimeout(r, 5)));
        resolve();
      }, 5);
    });
    ctx.waitUntil(step1);
    await ctx.waitUntilAll();
    expect(ctx.pendingCount()).toBe(0);
  });
});

describe('createWorkersEnv', () => {
  it('T-H-280 empty spec still produces a branded env', () => {
    const env = createWorkersEnv();
    expect(isWorkersEnv(env)).toBe(true);
    expect((env as unknown as { [WORKERS_ENV_SYMBOL]: true })[WORKERS_ENV_SYMBOL]).toBe(true);
  });

  it('T-H-281 kv / d1 / r2 bindings are spread onto env under their names', () => {
    const KV = mockKVNamespace();
    const DB = mockD1Database();
    const BUCKET = mockR2Bucket();
    const env = createWorkersEnv({ kv: { KV }, d1: { DB }, r2: { BUCKET } });
    expect(env.KV).toBe(KV);
    expect(env.DB).toBe(DB);
    expect(env.BUCKET).toBe(BUCKET);
  });

  it('T-H-282 vars + secrets are copied as plain strings', () => {
    const env = createWorkersEnv({ vars: { ENV: 'prod' }, secrets: { API_KEY: 'sk' } });
    expect(env.ENV).toBe('prod');
    expect(env.API_KEY).toBe('sk');
  });

  it('T-H-283 handler receives env through invokeRoute', async () => {
    const app = createHonoApp<{ USERS: { get: (k: string) => Promise<string | null> } }>();
    app.get('/kv/:k', async (c) => {
      const val = await c.env.USERS.get(c.req.param('k') ?? '');
      return c.json({ val });
    });
    const KV = mockKVNamespace();
    await KV.put('alice', 'admin');
    const env = createWorkersEnv({ kv: { USERS: KV } }) as unknown as { USERS: { get: (k: string) => Promise<string | null> } };
    const { response } = await invokeRoute({ app, method: 'GET', path: '/kv/alice', env });
    expect(response.body).toEqual({ val: 'admin' });
  });

  it('T-H-284 execution context flows through invokeRoute + waitUntil captures side-effect', async () => {
    const app = createHonoApp();
    const KV = mockKVNamespace();
    app.post('/log', (c) => {
      c.executionCtx?.waitUntil(KV.put('audit', c.req.header('x-user') ?? ''));
      return c.json({ queued: true });
    });
    const ctx = createExecutionContext();
    const { response } = await invokeRoute({
      app,
      method: 'POST',
      path: '/log',
      headers: { 'x-user': 'alice' },
      executionCtx: ctx,
    });
    expect(response.body).toEqual({ queued: true });
    await ctx.waitUntilAll();
    expect(await KV.get('audit')).toBe('alice');
  });
});
