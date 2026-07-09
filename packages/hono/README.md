# @kiwa-lab/hono

HonoJS Cloudflare Workers + hc RPC type-safe client + middleware chain test adapter for [kiwa](https://github.com/cardene777/kiwa) — model Hono's fetch-shaped request / response contract, its middleware chain, and its Workers bindings in Vitest without a real Workers runtime.

```bash
pnpm add -D @kiwa-lab/hono
```

## Why

HonoJS is a fast, edge-first web framework whose apps compose from
`app.get(path, handler)` + `app.use(pattern, mw)` + `app.route(prefix, sub)`,
run inside a Cloudflare Workers runtime, and speak type-safe RPC to their
clients via `hc<AppType>(baseUrl)`. `@kiwa-lab/hono` gives you standalone
mocks that model the same observable contract so tests can assert on route
dispatch + middleware chain order + hc client typing + Workers env / KV / D1
/ R2 / ExecutionContext without spinning up a real Workers runtime.

## Quick start

### App + route + middleware chain

```ts
import { describe, expect, it } from 'vitest';
import { createHonoApp } from '@kiwa-lab/hono';

describe('api', () => {
  it('runs middleware before the handler', async () => {
    const app = createHonoApp();
    const order: string[] = [];
    app.use('/*', async (c, next) => {
      order.push('mw');
      await next();
    });
    app.get('/hello', (c) => {
      order.push('handler');
      return c.json({ ok: 1 });
    });
    const res = await app.request('/hello');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: 1 });
    expect(order).toEqual(['mw', 'handler']);
  });
});
```

### hc RPC type-safe client

```ts
import { expect, it } from 'vitest';
import { createHonoApp, createRpcClient } from '@kiwa-lab/hono';

it('type-safe RPC request + response', async () => {
  const app = createHonoApp();
  app.get('/users/:id', (c) => c.json({ id: c.req.param('id') }));

  type AppType = {
    users: { ':id': { $get: (o: { param: { id: string } }) => Promise<{ json: () => Promise<{ id: string }> }> } };
  };
  const client = createRpcClient(app) as AppType;
  const res = await client.users[':id'].$get({ param: { id: '42' } });
  expect(await res.json()).toEqual({ id: '42' });
});
```

### Cloudflare Workers env

```ts
import { expect, it } from 'vitest';
import {
  createHonoApp,
  createWorkersEnv,
  createExecutionContext,
  mockKVNamespace,
  mockD1Database,
  mockR2Bucket,
} from '@kiwa-lab/hono';

it('KV binding is reachable through env', async () => {
  const KV = mockKVNamespace();
  await KV.put('alice', 'admin');

  const app = createHonoApp<{ USERS: typeof KV }>();
  app.get('/kv/:k', async (c) => {
    const val = await c.env.USERS.get(c.req.param('k') ?? '');
    return c.json({ val });
  });

  const env = createWorkersEnv({ kv: { USERS: KV } });
  const ctx = createExecutionContext();
  const res = await app.request('/kv/alice', undefined, env as never, ctx);
  expect(res.body).toEqual({ val: 'admin' });
});
```

### ExecutionContext waitUntil + drain

```ts
import { expect, it } from 'vitest';
import {
  createHonoApp,
  createExecutionContext,
  mockKVNamespace,
} from '@kiwa-lab/hono';

it('waitUntil side-effect is observable after drain', async () => {
  const KV = mockKVNamespace();
  const app = createHonoApp();
  app.post('/log', (c) => {
    c.executionCtx?.waitUntil(KV.put('audit', c.req.header('x-user') ?? ''));
    return c.json({ queued: true });
  });
  const ctx = createExecutionContext();
  await app.request('/log', { method: 'POST', headers: { 'x-user': 'alice' } }, undefined, ctx);
  await ctx.waitUntilAll();
  expect(await KV.get('audit')).toBe('alice');
});
```

## API

| Export | Purpose |
|---|---|
| `createHonoApp<TEnv>()` | Hono-shaped app builder with `.get()` / `.post()` / `.put()` / `.delete()` / `.patch()` / `.all()` / `.use()` / `.route()` / `.request()` |
| `invokeRoute({ app, method, path, ... })` | Single-request driver with middleware trace + response spec |
| `createContext({ req, env })` | Standalone `c` object for handler unit tests |
| `buildRequest({ method, url, headers, body })` | Standalone `c.req` shape |
| `compileRoute(pattern)` / `matchRoute(m, path)` | Route pattern matcher (`:param` + `*` wildcard) |
| `createRpcClient(app, { baseUrl })` | Proxy-based hc client — `client.users[':id'].$get({ param })` |
| `defineRpcApp({ configure })` | App + client pair in one call |
| `createWorkersEnv({ kv, d1, r2, vars, secrets })` | Cloudflare Workers `env` object |
| `createExecutionContext()` | `waitUntil` / `passThroughOnException` / `waitUntilAll()` |
| `mockKVNamespace()` | `get` / `put` / `delete` / `list` / `getWithMetadata` + TTL expiry |
| `mockD1Database()` | `prepare(query).bind(...).first()` / `.all()` / `.run()` + `__setResponse` |
| `mockR2Bucket()` | `get` / `put` / `delete` / `list` + `customMetadata` / `httpMetadata` |
| `isHonoApp` / `isHonoContext` / `isHcResponse` / `isWorkersEnv` / ... | Type guards for every branded export |

Brand symbols: `HONO_APP_SYMBOL` / `HONO_CONTEXT_SYMBOL` / `HONO_ROUTE_SYMBOL` / `HC_CLIENT_SYMBOL` / `HC_REQUEST_SYMBOL` / `WORKERS_ENV_SYMBOL` / `EXECUTION_CTX_SYMBOL` / `KV_NAMESPACE_SYMBOL` / `D1_DATABASE_SYMBOL` / `R2_BUCKET_SYMBOL`.

## Limits

- Real Hono runtime binding (`hono` package integration) is **not** in scope for v0.1. Tests use standalone mocks with the same brand symbols.
- Route matching supports `:param` + `*` wildcard segments. Full Hono `TrieRouter` (regex constraints, multiple wildcards per pattern) is out of scope.
- `mockD1Database` matches queries by exact string (no SQL parsing). Tests register canned responses per query text.
- Streaming responses (SSE / chunked) and websockets are out of scope for v0.1; responses are always fully buffered.
- Real Cloudflare Workers Durable Objects / Queues / Analytics Engine bindings are out of scope; supply a fake object under the same env binding name if a test needs them.

Companion: v1.19-1c of the [kiwa test framework](https://github.com/cardene777/kiwa) — released alongside `@kiwa-lab/solidjs` (#813) + `@kiwa-lab/fresh` (#814) as part of the v1.19 modern framework depth-drive.
