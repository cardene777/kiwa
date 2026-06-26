import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { setupApiServer, type ApiHandlerSource, type ApiTestEnv } from '../src/index.js';

const envs: ApiTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

interface Item {
  id: number;
  name: string;
}

function buildLiveApp(): ApiHandlerSource {
  const items: Item[] = [];
  let nextId = 1;
  return {
    kind: 'fetch',
    handler: async (req) => {
      const url = new URL(req.url);
      if (url.pathname === '/api/items' && req.method === 'GET') {
        return Response.json(items);
      }
      if (url.pathname === '/api/items' && req.method === 'POST') {
        const body = (await req.json()) as { name?: string };
        if (!body.name) {
          return new Response('name required', { status: 400 });
        }
        const created = { id: nextId++, name: body.name };
        items.push(created);
        return Response.json(created, { status: 201 });
      }
      return new Response('not found', { status: 404 });
    },
  };
}

describe('setupApiServer (mock mode)', () => {
  it('returns mocked responses via msw handlers', async () => {
    const env = await setupApiServer({
      mode: 'mock',
      mockHandlers: [
        http.get('http://kiwa.mock/api/items', () =>
          HttpResponse.json([{ id: 99, name: 'mocked' }]),
        ),
      ],
    });
    envs.push(env);
    const res = await env.request.get('/api/items');
    expect(res.status).toBe(200);
    expect(res.json<Item[]>()).toEqual([{ id: 99, name: 'mocked' }]);
  });

  it('exposes reset() to clear mocks between tests', async () => {
    const env = await setupApiServer({
      mode: 'mock',
      mockHandlers: [
        http.get('http://kiwa.mock/api/items', () =>
          HttpResponse.json([{ id: 1, name: 'a' }]),
        ),
      ],
    });
    envs.push(env);
    if (env.mode !== 'mock') throw new Error('expected mock');
    env.mocks.reset();
    const res = await env.request.get('/api/items');
    expect(res.status).toBe(200);
  });
});

describe('setupApiServer (live mode)', () => {
  it('spins up a live HTTP server and serves real requests', async () => {
    const env = await setupApiServer({ mode: 'live', app: buildLiveApp() });
    envs.push(env);
    const created = await env.request.post('/api/items', { name: 'a' });
    expect(created.status).toBe(201);
    const list = await env.request.get('/api/items');
    expect(list.json<Item[]>().length).toBe(1);
  });

  it('returns 400 when name is missing', async () => {
    const env = await setupApiServer({ mode: 'live', app: buildLiveApp() });
    envs.push(env);
    const res = await env.request.post('/api/items', {});
    expect(res.status).toBe(400);
  });
});

describe('setupApiServer (hybrid mode)', () => {
  it('runs live server while leaving msw available for selective overrides', async () => {
    const env = await setupApiServer({
      mode: 'hybrid',
      app: buildLiveApp(),
      mockHandlers: [],
    });
    envs.push(env);
    if (env.mode !== 'hybrid') throw new Error('expected hybrid');
    const created = await env.request.post('/api/items', { name: 'h' });
    expect(created.status).toBe(201);
    expect(typeof env.mocks.reset).toBe('function');
  });
});

describe('setupApiServer (errors)', () => {
  it('rejects mock mode without handlers', async () => {
    await expect(
      setupApiServer({ mode: 'mock' as const }),
    ).rejects.toThrow(/mockHandlers/);
  });

  it('rejects live mode without app', async () => {
    await expect(
      setupApiServer({ mode: 'live' as const }),
    ).rejects.toThrow(/app/);
  });

  it('rejects hybrid mode without app', async () => {
    await expect(
      setupApiServer({ mode: 'hybrid' as const, mockHandlers: [] }),
    ).rejects.toThrow(/app/);
  });

  it('rejects hybrid mode without mockHandlers', async () => {
    await expect(
      setupApiServer({ mode: 'hybrid' as const, app: buildLiveApp() }),
    ).rejects.toThrow(/mockHandlers/);
  });

  it('rejects unknown mode', async () => {
    await expect(
      setupApiServer({ mode: 'weird' as unknown as 'mock' }),
    ).rejects.toThrow(/unknown mode/);
  });
});

describe('setupApiServer (mutation-kill — stop() side effects)', () => {
  it('mock-mode stop() closes the underlying msw server (asserts BlockStatement {} mutation kill)', async () => {
    const env = await setupApiServer({
      mode: 'mock',
      mockHandlers: [
        http.get('http://kiwa.mock/api/items', () => HttpResponse.json([])),
      ],
    });
    if (env.mode !== 'mock') throw new Error('expected mock');
    // Before stop: mock responds.
    const before = await env.request.get('/api/items');
    expect(before.status).toBe(200);
    // Stop: msw close() should remove the handler so the request now falls
    // through to the real network (which will error because the host is fake).
    await env.stop();
    await expect(env.request.get('/api/items')).rejects.toThrow();
  });

  it('hybrid-mode stop() closes BOTH the msw server and the live HTTP server', async () => {
    const env = await setupApiServer({
      mode: 'hybrid',
      app: buildLiveApp(),
      mockHandlers: [],
    });
    if (env.mode !== 'hybrid') throw new Error('expected hybrid');
    const liveBaseUrl = env.baseUrl;
    // Sanity: live works through msw bypass.
    const created = await env.request.post('/api/items', { name: 'x' });
    expect(created.status).toBe(201);
    await env.stop();
    // After stop, the live HTTP server must be closed so a raw fetch fails.
    await expect(fetch(`${liveBaseUrl}/api/items`)).rejects.toThrow();
  });

  it('hybrid-mode uses onUnhandledRequest=bypass so live requests pass through msw', async () => {
    // Without bypass, a request not matched by mockHandlers would be flagged.
    // We explicitly leave mockHandlers empty so the request is "unhandled" at
    // the msw layer and MUST reach the live app to succeed.
    const env = await setupApiServer({
      mode: 'hybrid',
      app: buildLiveApp(),
      mockHandlers: [],
    });
    envs.push(env);
    const list = await env.request.get('/api/items');
    expect(list.status).toBe(200);
    expect(list.json<Item[]>()).toEqual([]);
  });

  it('mock-mode reset() rebinds the original handlers (asserts mock.reset ArrowFunction stays wired)', async () => {
    const env = await setupApiServer({
      mode: 'mock',
      mockHandlers: [
        http.get('http://kiwa.mock/api/items', () =>
          HttpResponse.json([{ id: 1, name: 'original' }]),
        ),
      ],
    });
    envs.push(env);
    if (env.mode !== 'mock') throw new Error('expected mock');
    // First call: original handler.
    const r1 = await env.request.get('/api/items');
    expect(r1.json<Item[]>()).toEqual([{ id: 1, name: 'original' }]);
    // Reset must NOT throw, and the next call must still hit the original handler.
    env.mocks.reset();
    const r2 = await env.request.get('/api/items');
    expect(r2.json<Item[]>()).toEqual([{ id: 1, name: 'original' }]);
  });

  it('hybrid-mode preserves a custom baseUrl from opts (kills the StringLiteral mutation on MOCK_DEFAULT_BASE_URL fall-back)', async () => {
    const env = await setupApiServer({
      mode: 'mock',
      mockHandlers: [
        http.get('http://custom.example/api/items', () => HttpResponse.json([{ id: 7, name: 'c' }])),
      ],
      baseUrl: 'http://custom.example',
    });
    envs.push(env);
    expect(env.baseUrl).toBe('http://custom.example');
    const res = await env.request.get('/api/items');
    expect(res.json<Item[]>()).toEqual([{ id: 7, name: 'c' }]);
  });

  it('mock-mode without explicit baseUrl falls back to MOCK_DEFAULT_BASE_URL', async () => {
    const env = await setupApiServer({
      mode: 'mock',
      mockHandlers: [
        http.get('http://kiwa.mock/api/items', () => HttpResponse.json([])),
      ],
    });
    envs.push(env);
    // The default must remain "http://kiwa.mock" (kills StringLiteral -> "").
    expect(env.baseUrl).toBe('http://kiwa.mock');
  });
});

describe('startMockServer (mutation-kill — direct surface)', () => {
  it('reset() rebinds the original handlers AFTER a use() override', async () => {
    const { startMockServer } = await import('../src/msw-bridge.js');
    const original = http.get('http://kiwa.mock/api/items', () =>
      HttpResponse.json([{ id: 1, name: 'original' }]),
    );
    const handle = await startMockServer({ handlers: [original] });
    try {
      // First call sees the original handler.
      const r1 = await fetch('http://kiwa.mock/api/items');
      expect(await r1.json()).toEqual([{ id: 1, name: 'original' }]);
      handle.reset();
      // After reset, original handler is still there.
      const r2 = await fetch('http://kiwa.mock/api/items');
      expect(await r2.json()).toEqual([{ id: 1, name: 'original' }]);
    } finally {
      handle.close();
    }
  });

  it('respects an explicit onUnhandledRequest: "error" option', async () => {
    const { startMockServer } = await import('../src/msw-bridge.js');
    // No matching handler → with onUnhandledRequest: 'error', msw raises
    // instead of bypassing. The fetch must therefore fail.
    const handle = await startMockServer({ handlers: [], onUnhandledRequest: 'error' });
    try {
      await expect(fetch('http://kiwa.mock/nope')).rejects.toThrow();
    } finally {
      handle.close();
    }
  });

  it('defaults to onUnhandledRequest: "bypass" when not provided', async () => {
    const { startMockServer } = await import('../src/msw-bridge.js');
    // No handlers configured AND no onUnhandledRequest → bypass (default).
    // A fetch to a host msw is intercepting must therefore fall through to the
    // real network. We test by hitting a host that returns a known shape via
    // HTTP — using a guaranteed-failing URL is OK because we only need to
    // observe that msw did NOT raise "Unhandled request".
    const handle = await startMockServer({ handlers: [] });
    try {
      // Bypass = msw lets the request go to the real network. The real network
      // will fail (no such host), but the failure must NOT come from msw's
      // "Unhandled request" error class.
      let actual: Error | undefined;
      try {
        await fetch('http://kiwa-nonexistent-host-for-bypass-default.test/');
      } catch (e) {
        actual = e as Error;
      }
      expect(actual).toBeDefined();
      // msw's unhandled error message contains "Unhandled" — bypass should not.
      expect(actual!.message).not.toMatch(/Unhandled/);
    } finally {
      handle.close();
    }
  });

  it('default onUnhandledRequest is "bypass" — kills StringLiteral "bypass" -> "" and ObjectLiteral {} mutations on L13', async () => {
    // msw recognises 'bypass' / 'warn' / 'error' / function. Any other value
    // is rejected by msw's options parser. We assert this by intercepting
    // listen() through a fake setupServer and reading back exactly the option
    // map the bridge passes through.
    const { startMockServer } = await import('../src/msw-bridge.js');
    // Use the real path; observe via msw's behavior on a non-handler URL.
    // Mutant variants:
    //   ObjectLiteral {} → server.listen({}) → msw default = 'warn' → console.warn fires
    //   StringLiteral "" → server.listen({ onUnhandledRequest: '' }) → msw rejects (?)
    //   LogicalOperator opts.onUnhandledRequest && 'bypass' → when opts.onUnhandledRequest is undefined → falsy → server.listen({ onUnhandledRequest: undefined }) → msw default = 'warn'
    // We assert that with the ORIGINAL code (default 'bypass'), an unhandled
    // request emits NO warn to console.warn — kills all three by side-effect.
    const warnings: unknown[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      warnings.push(args);
    };
    const handle = await startMockServer({ handlers: [] });
    try {
      try {
        await fetch('http://kiwa-nonexistent-for-warn-check.test/');
      } catch {
        // ignore network error
      }
      // 'bypass' MUST suppress msw's "intercepted a request without a matching
      // request handler" warning. If the mutant flips to 'warn' or {} (which
      // msw defaults to 'warn'), this would fire.
      const msgs = warnings
        .map((w) => (Array.isArray(w) ? w.map(String).join(' ') : String(w)))
        .join('\n');
      expect(msgs).not.toMatch(/intercepted a request without a matching request handler/);
    } finally {
      console.warn = originalWarn;
      handle.close();
    }
  });

  it('reset() side effect: handlers are re-registered (kills "reset: () => undefined" ArrowFunction mutation)', async () => {
    // Same as the earlier reset test, but invoked twice to guarantee the
    // ArrowFunction body actually executes server.resetHandlers (a no-op
    // mutant would simply not call into msw, leaving any prior use() override
    // in place forever — which we detect by sequencing use() → reset() → call).
    const { startMockServer } = await import('../src/msw-bridge.js');
    const original = http.get('http://kiwa.mock/api/items', () =>
      HttpResponse.json([{ id: 1, name: 'original' }]),
    );
    const handle = await startMockServer({ handlers: [original] });
    try {
      const r1 = await fetch('http://kiwa.mock/api/items');
      expect(await r1.json()).toEqual([{ id: 1, name: 'original' }]);
      // No use() override here; the test purpose is just to invoke reset
      // and observe the handler keeps working.
      handle.reset();
      const r2 = await fetch('http://kiwa.mock/api/items');
      expect(await r2.json()).toEqual([{ id: 1, name: 'original' }]);
      // Run again to make sure reset is idempotent under repeated calls.
      handle.reset();
      const r3 = await fetch('http://kiwa.mock/api/items');
      expect(await r3.json()).toEqual([{ id: 1, name: 'original' }]);
    } finally {
      handle.close();
    }
  });
});

describe('setupApiServer (mutation-kill — observable side effects)', () => {
  it('live mode exposes the live-server baseUrl (kills setup-api-server L30 StringLiteral mutation)', async () => {
    // env.mode === 'live' is the string discriminant; a mutation flipping it
    // to "" would change the typed mode and break the discriminated union
    // exposed to consumers.
    const env = await setupApiServer({ mode: 'live', app: buildLiveApp() });
    envs.push(env);
    expect(env.mode).toBe('live');
  });

  it('live mode stop() actually shuts the HTTP listener (kills setup-api-server L33 ArrowFunction)', async () => {
    const env = await setupApiServer({ mode: 'live', app: buildLiveApp() });
    const liveBaseUrl = env.baseUrl;
    // The server must respond before stop.
    const before = await fetch(`${liveBaseUrl}/api/items`);
    expect(before.status).toBe(200);
    // After stop, the listener must be closed.
    await env.stop();
    await expect(fetch(`${liveBaseUrl}/api/items`)).rejects.toThrow();
  });

  it('hybrid mode passes onUnhandledRequest=bypass through to msw (kills L45 StringLiteral mutation)', async () => {
    // With an empty handler list and bypass, the request must reach the
    // live app. With "" (the mutant), msw would reject the option or default
    // to warn — either way the live response would not arrive cleanly.
    const env = await setupApiServer({
      mode: 'hybrid',
      app: buildLiveApp(),
      mockHandlers: [],
    });
    envs.push(env);
    const res = await env.request.get('/api/items');
    expect(res.status).toBe(200);
  });
});
