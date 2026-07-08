# HonoJS + hc RPC type-safe client + Workers env (KV / D1 / R2) in 12 min

## What you'll build

A vitest suite for a Cloudflare Workers-shaped Hono app that exercises the three v1.19 primitives — `createHonoApp` + middleware chain for the route surface, `createRpcClient` for the hc type-safe RPC client, and `mockKVNamespace` + `mockD1Database` + `mockR2Bucket` for the Workers env bindings. The suite never boots wrangler or miniflare; it drives the request contract through `@kiwa/hono` v0.1's brand-symbol-guarded stubs so the same tests run in Node.js in under a second.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn — the tutorial uses pnpm)
- An empty directory to work in

## Step-by-step build

```bash
mkdir kiwa-hono-first && cd kiwa-hono-first
pnpm init
pnpm add -D @kiwa/hono@0.1 vitest typescript @types/node
```

Add the vitest script + ESM configuration in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run"
  }
}
```

Ship a `tsconfig.json` compatible with the ESM shape `@kiwa/hono` exports.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

Add the app + RPC test at `tests/app.test.ts`. The three sections walk exactly the shape Workers teams hit — the route dispatches to a handler through the middleware chain, the RPC client generates typed calls at compile time, and the KV binding round-trips a value.

```ts
import { describe, expect, it } from 'vitest';
import {
  createHonoApp,
  invokeRoute,
  createRpcClient,
  mockKVNamespace,
  mockD1Database,
  isKVNamespaceMock,
  isD1DatabaseMock,
} from '@kiwa/hono';

describe('createHonoApp — route + middleware chain', () => {
  it('middleware runs before the handler and trace records both entries', async () => {
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

describe('createRpcClient — type-safe hc client', () => {
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

describe('Workers env — KV + D1 bindings', () => {
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
    d1.__setResponse('SELECT * FROM users', [{ id: 1, name: 'a' }, { id: 2, name: 'b' }]);
    const { results } = await d1.prepare('SELECT * FROM users').all();
    expect(results).toEqual([{ id: 1, name: 'a' }, { id: 2, name: 'b' }]);
    expect(isD1DatabaseMock(d1)).toBe(true);
  });
});
```

## Run

```bash
pnpm test
```

Vitest picks up the file, runs the 6 tests in a single Node.js process, and exits green in under a second. No wrangler, no miniflare, no `deno` — `createHonoApp` / `createRpcClient` / `mockKVNamespace` / `mockD1Database` deliver the observable contract that a real Workers deployment enforces, without booting the runtime.

## Why hc RPC needs its own testing contract

Hono's `hc` client is a proxy that reflects the app's route tree back at the caller as a typed object graph. Instead of `fetch('/users/42')` with a stringly typed URL, the caller writes `client.users[':id'].$get({ param: { id: '42' } })` and the TypeScript compiler catches param name typos, missing body fields, and method mismatches at compile time.

That means Hono bugs look like "the RPC client sent an unexpected header" or "the middleware trace missed the auth entry". The shape of the assertion becomes "the trace array records `['middleware', 'handler']` in order, and the response body deserializes to the expected shape".

`@kiwa/hono` records that trace on every `invokeRoute` and `createRpcClient` call. The `result.trace` array carries a `{ kind, pattern }` entry per hop — one for each `use()` middleware that matches, plus one for the terminal handler. When a downstream harness catches a regression the assertion surfaces the exact hop sequence, so the test names the hop that changed.

```ts
import { createHonoApp, invokeRoute } from '@kiwa/hono';

const app = createHonoApp();
app.use('/api/*', async (_c, next) => {
  await next();
});
app.get('/api/users/:id', (c) => c.json({ id: c.req.param('id') }));

const { trace } = await invokeRoute({ app, method: 'GET', path: '/api/users/42' });
expect(trace.map((e) => e.kind)).toEqual(['middleware', 'handler']);
expect(trace[0]?.pattern).toBe('/api/*');
expect(trace[1]?.pattern).toBe('/api/users/:id');
```

Three properties are load-bearing.

- **Middleware short-circuits when it does not call `next()`.** A test asserting on `handlerRan` catches an auth middleware that returned early but forgot to record the reason.
- **Pattern-scoped middleware.** `app.use('/admin/*', ...)` does not run for `/public` requests. The trace records only the middleware whose pattern matched.
- **Error surfacing.** A handler throw surfaces on `result.error`; the response spec stays unchanged so the test can assert on both the error and the fallback body.

## Why Workers env bindings need dedicated mocks

Cloudflare Workers apps read state through env bindings — `env.KV.get(key)`, `env.DB.prepare(sql).all()`, `env.BUCKET.put(key, body)`. In production those bindings are backed by KV / D1 / R2 primitives; in tests they need to behave the same way without a network round-trip.

`mockKVNamespace()` / `mockD1Database()` / `mockR2Bucket()` deliver the same 6-op surface — put / get / delete / list / expire / snapshot. The mocks even honour `expirationTtl` by wrapping `Date.now`, so a test asserting "the session expires after 60 seconds" walks the wall-clock semantics.

```ts
import { mockKVNamespace } from '@kiwa/hono';

const kv = mockKVNamespace();
const originalNow = Date.now;
let now = 1_000_000;
Date.now = () => now;
try {
  await kv.put('session', 'v', { expirationTtl: 60 });
  expect(await kv.get('session')).toBe('v');
  now += 61 * 1000;
  expect(await kv.get('session')).toBeNull();
} finally {
  Date.now = originalNow;
}
```

The `__snapshot()` escape hatch on every mock returns the whole store as a plain object. That means a test can assert on the exact key set after a batch of puts, catching leaked keys that a real KV would silently accept.

## Related

- Concept doc — [Modern web framework testing (Signal reactivity / Islands architecture / edge runtime + RPC type-safety SSOT)](../concepts/modern-web-framework-testing)
- v1.19-1c [#815](https://github.com/cardene777/kiwa/issues/815) — `@kiwa/hono` v0.1 landing
- v1.19-4 [#810](https://github.com/cardene777/kiwa/issues/810) — `dogfood-hono-workers-rpc` (the full 3-layer dogfood this tutorial cuts down)
