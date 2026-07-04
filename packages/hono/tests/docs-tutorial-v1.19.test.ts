/**
 * v1.19-5 docs 補強 (Issue #811) — tutorial 30 code snippet 検証。
 *
 * `docs/tutorials/30-hono-workers-rpc.md` に載っている
 * code snippet が実際に動作することを behavior test で担保する。
 *
 * tutorial の code snippet が drift すると読者が「動かない」 体験をする
 * ため、 snippet と実 API の乖離を CI で検知する。
 */
import { describe, expect, it } from 'vitest';
import { createHonoApp, invokeRoute } from '../src/app.js';
import { createRpcClient } from '../src/rpc.js';
import {
  mockKVNamespace,
  mockD1Database,
  isKVNamespaceMock,
  isD1DatabaseMock,
} from '../src/workers.js';

describe('tutorial 30 — createHonoApp route + middleware chain snippet', () => {
  it('middleware runs before the handler + trace records both entries', async () => {
    const app = createHonoApp();
    const order: string[] = [];
    app.use('/*', async (_c, next) => {
      order.push('mw:before');
      await next();
      order.push('mw:after');
    });
    app.get('/hello', (c) => {
      order.push('handler');
      return c.text('world');
    });
    const result = await invokeRoute({ app, method: 'GET', path: '/hello' });
    expect(result.response.status).toBe(200);
    expect(result.response.body).toBe('world');
    expect(order).toEqual(['mw:before', 'handler', 'mw:after']);
    expect(result.trace.map((e) => e.kind)).toEqual(['middleware', 'handler']);
  });

  it(':param captures show up in c.req.param()', async () => {
    const app = createHonoApp();
    app.get('/users/:id', (c) => c.json({ id: c.req.param('id') }));
    const result = await invokeRoute({ app, method: 'GET', path: '/users/42' });
    expect(result.response.body).toEqual({ id: '42' });
  });
});

describe('tutorial 30 — createRpcClient type-safe hc client snippet', () => {
  it('$get terminal returns an HcResponse with matching JSON', async () => {
    const app = createHonoApp();
    app.get('/health', (c) => c.json({ ok: 1 }));
    const client = createRpcClient(app) as {
      health: { $get: () => Promise<{ status: number; json: () => Promise<{ ok: number }> }> };
    };
    const res = await client.health.$get();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: 1 });
  });

  it('$post sends a JSON body and receives 201', async () => {
    const app = createHonoApp();
    app.post('/users', async (c) => c.json({ received: await c.req.json() }, 201));
    const client = createRpcClient(app) as {
      users: {
        $post: (o: { json: { name: string } }) => Promise<{
          status: number;
          json: () => Promise<{ received: { name: string } }>;
        }>;
      };
    };
    const res = await client.users.$post({ json: { name: 'alice' } });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ received: { name: 'alice' } });
  });
});

describe('tutorial 30 — Workers env KV + D1 bindings snippet', () => {
  it('mockKVNamespace round-trips put + get + delete', async () => {
    const kv = mockKVNamespace();
    await kv.put('session:abc', JSON.stringify({ userId: 7 }));
    expect(await kv.get('session:abc')).toBe('{"userId":7}');
    await kv.delete('session:abc');
    expect(await kv.get('session:abc')).toBeNull();
    expect(isKVNamespaceMock(kv)).toBe(true);
  });

  it('mockD1Database returns canned rows for a prepared statement', async () => {
    const d1 = mockD1Database();
    d1.__setResponse('SELECT * FROM users', [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ]);
    const { results } = await d1.prepare('SELECT * FROM users').all();
    expect(results).toEqual([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ]);
    expect(isD1DatabaseMock(d1)).toBe(true);
  });

  it('mockKVNamespace expirationTtl honours Date.now (advanced snippet)', async () => {
    const kv = mockKVNamespace();
    const originalNow = Date.now;
    let now = 1_000_000;
    Date.now = () => now;
    try {
      await kv.put('temp', 'v', { expirationTtl: 60 });
      expect(await kv.get('temp')).toBe('v');
      now += 61 * 1000;
      expect(await kv.get('temp')).toBeNull();
    } finally {
      Date.now = originalNow;
    }
  });
});
