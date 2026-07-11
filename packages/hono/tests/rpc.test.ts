import { describe, expect, it } from 'vitest';
import { createHonoApp } from '../src/app.js';
import { createRpcClient, defineRpcApp, isHcResponse, HC_REQUEST_SYMBOL, HC_CLIENT_SYMBOL } from '../src/rpc.js';

describe('createRpcClient', () => {
  it('T-H-100 GET terminal returns HcResponse with brand', async () => {
    const app = createHonoApp();
    app.get('/hello', (c) => c.json({ ok: 1 }));
    const client = createRpcClient(app) as {
      hello: { $get: () => Promise<{ status: number; ok: boolean; json: () => Promise<{ ok: number }> }> };
    };
    const res = await client.hello.$get();
    expect(isHcResponse(res)).toBe(true);
    expect((res as unknown as { [HC_REQUEST_SYMBOL]: true })[HC_REQUEST_SYMBOL]).toBe(true);
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
    expect(await res.json()).toEqual({ ok: 1 });
  });

  it('T-H-101 POST terminal sends json body + content-type', async () => {
    const app = createHonoApp();
    app.post('/create', async (c) => c.json({ received: await c.req.json() }, 201));
    const client = createRpcClient(app) as {
      create: {
        $post: (o: { json: { name: string } }) => Promise<{ status: number; json: () => Promise<{ received: { name: string } }> }>;
      };
    };
    const res = await client.create.$post({ json: { name: 'alice' } });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ received: { name: 'alice' } });
  });

  it('T-H-102 :param substitution builds correct URL path', async () => {
    const app = createHonoApp();
    app.get('/users/:id', (c) => c.json({ id: c.req.param('id') }));
    const client = createRpcClient(app) as {
      users: { ':id': { $get: (o: { param: { id: string } }) => Promise<{ json: () => Promise<{ id: string }> }> } };
    };
    const res = await client.users[':id'].$get({ param: { id: '7' } });
    expect(await res.json()).toEqual({ id: '7' });
  });

  it('T-H-103 missing param throws before request', async () => {
    const app = createHonoApp();
    app.get('/users/:id', (c) => c.text(''));
    const client = createRpcClient(app) as {
      users: { ':id': { $get: (o?: { param?: { id?: string } }) => Promise<unknown> } };
    };
    await expect(client.users[':id'].$get({})).rejects.toThrow(/missing param "id"/);
  });

  it('T-H-104 query params are appended to url', async () => {
    const app = createHonoApp();
    app.get('/search', (c) => c.json({ q: c.req.queryValue('q') }));
    const client = createRpcClient(app) as {
      search: { $get: (o: { query: { q: string } }) => Promise<{ json: () => Promise<{ q: string }> }> };
    };
    const res = await client.search.$get({ query: { q: 'foo' } });
    expect(await res.json()).toEqual({ q: 'foo' });
  });

  it('T-H-105 text() body option sends text/plain content-type', async () => {
    const app = createHonoApp();
    app.post('/raw', async (c) => c.text(`got:${await c.req.text()}`));
    const client = createRpcClient(app) as {
      raw: { $post: (o: { text: string }) => Promise<{ text: () => Promise<string> }> };
    };
    const res = await client.raw.$post({ text: 'ping' });
    expect(await res.text()).toBe('got:ping');
  });

  it('T-H-106 unmatched route → HcResponse with matched=false and status 404', async () => {
    const app = createHonoApp();
    const client = createRpcClient(app) as {
      nothing: { $get: () => Promise<{ status: number; matched: boolean }> };
    };
    const res = await client.nothing.$get();
    expect(res.status).toBe(404);
    expect(res.matched).toBe(false);
  });

  it('T-H-107 headers option is forwarded to the request', async () => {
    const app = createHonoApp();
    app.get('/auth', (c) => c.text(c.req.header('authorization') ?? 'none'));
    const client = createRpcClient(app) as {
      auth: { $get: (o: { headers: Record<string, string> }) => Promise<{ text: () => Promise<string> }> };
    };
    const res = await client.auth.$get({ headers: { Authorization: 'Bearer x' } });
    // Header keys are lowercased on receive.
    expect(await res.text()).toBe('Bearer x');
  });

  it('T-H-108 baseUrl is prepended to every request', async () => {
    const app = createHonoApp();
    app.get('/api/v1/health', (c) => c.text('ok'));
    const client = createRpcClient(app, { baseUrl: '/api/v1' }) as {
      health: { $get: () => Promise<{ status: number; text: () => Promise<string> }> };
    };
    const res = await client.health.$get();
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('ok');
  });

  it('T-H-109 client.trace exposes middleware chain', async () => {
    const app = createHonoApp();
    app.use('/*', async (_c, next) => {
      await next();
    });
    app.get('/x', (c) => c.text('y'));
    const client = createRpcClient(app) as { x: { $get: () => Promise<{ trace: ReadonlyArray<{ kind: string }> }> } };
    const res = await client.x.$get();
    expect(res.trace.map((e) => e.kind)).toEqual(['middleware', 'handler']);
  });

  it('T-H-110 unknown method terminal $upgrade returns undefined (does not build a request)', async () => {
    const app = createHonoApp();
    const client = createRpcClient(app) as { path: { $upgrade?: unknown } };
    expect(client.path.$upgrade).toBeUndefined();
  });

  it('T-H-111 hc response reports error surface when handler throws', async () => {
    const app = createHonoApp();
    app.get('/oops', () => {
      throw new Error('nope');
    });
    const client = createRpcClient(app) as { oops: { $get: () => Promise<{ error: unknown }> } };
    const res = await client.oops.$get();
    expect((res.error as Error).message).toBe('nope');
  });

  it('T-H-112 json() from a text response falls back to JSON.parse', async () => {
    const app = createHonoApp();
    app.get('/tj', (c) => c.text(JSON.stringify({ a: 1 })));
    const client = createRpcClient(app) as { tj: { $get: () => Promise<{ json: () => Promise<{ a: number }> }> } };
    const res = await client.tj.$get();
    expect(await res.json()).toEqual({ a: 1 });
  });

  it('T-H-113 text() from a json response returns JSON.stringify', async () => {
    const app = createHonoApp();
    app.get('/jt', (c) => c.json({ b: 2 }));
    const client = createRpcClient(app) as { jt: { $get: () => Promise<{ text: () => Promise<string> }> } };
    const res = await client.jt.$get();
    expect(await res.text()).toBe('{"b":2}');
  });
});

describe('defineRpcApp', () => {
  it('T-H-120 builds an app + client pair in one call', async () => {
    const { app, client } = defineRpcApp({
      configure(a) {
        a.get('/echo', (c) => c.json({ hi: 1 }));
      },
    });
    expect(app.routes.length).toBe(1);
    const typed = client as { echo: { $get: () => Promise<{ json: () => Promise<{ hi: number }> }> } };
    const res = await typed.echo.$get();
    expect(await res.json()).toEqual({ hi: 1 });
  });
});

describe('isHcResponse', () => {
  it('T-H-130 recognizes a real hc response', async () => {
    const app = createHonoApp();
    app.get('/x', (c) => c.text('y'));
    const client = createRpcClient(app) as { x: { $get: () => Promise<unknown> } };
    const res = await client.x.$get();
    expect(isHcResponse(res)).toBe(true);
  });

  it('T-H-131 rejects plain objects', () => {
    expect(isHcResponse({ ok: true })).toBe(false);
    expect(isHcResponse(null)).toBe(false);
    expect(isHcResponse('string')).toBe(false);
  });

  it('T-H-132 client Proxy exposes HC_CLIENT_SYMBOL brand and returns undefined for other symbols', () => {
    // Closes the symbol-arm at lines 51-55 in rpc.js: HC_CLIENT_SYMBOL → true, else undefined.
    const app = createHonoApp();
    app.get('/x', (c) => c.text('y'));
    const client = createRpcClient(app);
    const clientAsSymbolProbe = client as unknown as Record<symbol, unknown>;
    expect(clientAsSymbolProbe[HC_CLIENT_SYMBOL]).toBe(true);
    // any other symbol → undefined
    expect(clientAsSymbolProbe[Symbol.for('kiwa.hono.rpc.definitely-not-the-brand')]).toBeUndefined();
  });

  it('T-H-133 hc response body helpers return the fallback when the response has no matching bodyKind', async () => {
    // Closes rpc.js:120 (json() → undefined when bodyKind is neither json nor text) and
    // rpc.js:127 (text() → '' when bodyKind is neither text nor json). We exercise those
    // fallback returns via a route that responds with an empty Response (bodyKind='none').
    const app = createHonoApp();
    // A route that returns undefined (no HonoResponseSpec) creates a response with
    // no bodyKind, so both fallback arms in json()/text() run.
    app.get('/empty', () => {
      /* no-op — falls through to a bodyKind-less spec */
    });
    const client = createRpcClient(app) as {
      empty: { $get: () => Promise<{ json: () => Promise<unknown>; text: () => Promise<string> }> };
    };
    const res = await client.empty.$get();
    expect(await res.json()).toBeUndefined();
    expect(await res.text()).toBe('');
  });
});
