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

  it('T-H-134 client proxy returns undefined for `then` so Promise-detection short-circuits', async () => {
    // Closes rpc.js:57 — `if (prop === 'then') return undefined;`. Awaiting a
    // proxy would otherwise unwrap it as a thenable and burn a request; the
    // short-circuit guards against that.
    const app = createHonoApp();
    app.get('/x', (c) => c.text('y'));
    const client = createRpcClient(app);
    // Reach into the terminal-less client node and probe `.then` — TS types
    // pretend it does not exist so we cast to a permissive shape.
    const probe = client as unknown as { then?: unknown; users: { then?: unknown } };
    expect(probe.then).toBeUndefined();
    expect(probe.users.then).toBeUndefined();
    // Sanity: awaiting the client (used to be an anti-pattern) yields the
    // proxy itself — because `then` is undefined, Promise-detection short-
    // circuits and the value is returned as-is.
    const awaited = await (client as unknown as Promise<unknown>);
    expect(awaited).toBe(client);
  });

  it('T-H-136 invoking the proxy node as a function returns the noop target', () => {
    // Closes rpc.js:49 — the `function noop() {}` inner target that the
    // Proxy wraps. Calling the proxy directly (rare in practice, but Hono
    // hc supports `client(...)` as a route-typed builder) executes the
    // wrapped no-op so the runtime does not error.
    const app = createHonoApp();
    app.get('/x', (c) => c.text('y'));
    const client = createRpcClient(app);
    // The proxy target is `function noop() {}`; calling the proxy directly
    // triggers the target invocation and yields `undefined`.
    const result = (client as unknown as () => unknown)();
    expect(result).toBeUndefined();
  });

  it('T-H-135 rpc terminal forwards env + executionCtx into invokeRoute options', async () => {
    // Closes rpc.js:89-90 — `env !== undefined ? { env } : {}` and
    // `executionCtx !== undefined ? { executionCtx } : {}` in the terminal
    // options builder. The receiving handler observes both fields.
    const app = createHonoApp<{ TAG: string }>();
    const captured: { tag?: string; waitUntilCalled: boolean } = { waitUntilCalled: false };
    app.get('/tag', (c) => {
      captured.tag = c.env.TAG;
      c.executionCtx?.waitUntil(Promise.resolve());
      return c.json({ tag: c.env.TAG });
    });
    const executionCtx = {
      waitUntil: () => {
        captured.waitUntilCalled = true;
      },
      passThroughOnException: () => {
        /* no-op */
      },
    };
    const client = createRpcClient<{ TAG: string }>(app) as {
      tag: {
        $get: (o: { env: { TAG: string }; executionCtx: typeof executionCtx }) => Promise<{
          json: () => Promise<{ tag: string }>;
        }>;
      };
    };
    const res = await client.tag.$get({ env: { TAG: 'x' }, executionCtx });
    expect(await res.json()).toEqual({ tag: 'x' });
    expect(captured.tag).toBe('x');
    expect(captured.waitUntilCalled).toBe(true);
  });

  it('T-H-133 hc response body helpers return the fallback when the response has bodyKind neither json nor text', async () => {
    // Closes rpc.js:120 (json() → undefined) and rpc.js:127 (text() → '') where the
    // response bodyKind is anything other than json/text (createContext() populates
    // bodyKind='empty' for a void-returning handler).
    const app = createHonoApp();
    app.get('/empty', () => {
      /* no-op — handler returns void, spec receives bodyKind='empty' */
    });
    const client = createRpcClient(app) as {
      empty: { $get: () => Promise<{ json: () => Promise<unknown>; text: () => Promise<string> }> };
    };
    const res = await client.empty.$get();
    expect(await res.json()).toBeUndefined();
    expect(await res.text()).toBe('');
  });
});
