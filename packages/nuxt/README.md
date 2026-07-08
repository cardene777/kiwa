# @kiwa/nuxt

Nuxt 3 Server Routes test adapter for [kiwa](https://github.com/cardene777/kiwa) — invoke `defineEventHandler` callbacks in isolation and capture redirect / cookies / response headers / status without a running Nitro server.

```bash
pnpm add -D @kiwa/nuxt
```

## Why

Nuxt 3's `defineEventHandler((event) => ...)` callbacks run inside the Nitro server runtime. Real-server tests are slow + flaky; testing the callback in Vitest with a simulated H3 event is fast + deterministic. `@kiwa/nuxt` provides the simulated event and captures all the side effects you'd normally have to inspect after a real HTTP round-trip.

## Quick start

```ts
import { describe, expect, it } from 'vitest';
import { invokeEventHandler, NUXT_REDIRECT_SYMBOL } from '@kiwa/nuxt';
import { handler } from '../server/api/secure.get.js';

describe('GET /api/secure', () => {
  it('redirects unauthed requests to /login', async () => {
    const { redirect } = await invokeEventHandler({
      handler,
      url: 'http://localhost:3000/api/secure',
    });
    expect(redirect?.url).toBe('/login');
    expect(redirect?.status).toBe(302);
  });

  it('returns user data when session cookie present', async () => {
    const { result } = await invokeEventHandler({
      handler,
      url: 'http://localhost:3000/api/secure',
      cookies: { session: 'sid_42' },
    });
    expect(result).toEqual({ id: 42 });
  });
});
```

## API

### `invokeEventHandler<TResult>(opts)`

| `opts` field | Type | Default | Meaning |
|---|---|---|---|
| `handler` | `EventHandlerFunction` | required | The defineEventHandler callback under test |
| `url` | `string` | required | Absolute URL (host doesn't matter; `path` + `query` extracted) |
| `method` | `string` | `'GET'` | HTTP method |
| `body` | `unknown` | `undefined` | Parsed JSON body (no serialization needed) |
| `headers` | `Record<string, string>` | `{}` | Request headers (case-insensitive) |
| `cookies` | `Record<string, string>` | `{}` | Initial cookie jar |
| `query` | `Record<string, string \| string[]>` | extracted from URL | Override / add query params |

Returns `{ result, redirect, error, env }` where `env` exposes `responseHeaders` / `responseCookies` / `status` Maps captured during the call. Redirects throw `NUXT_REDIRECT_SYMBOL`-branded objects which the helper normalizes into `result.redirect`.

## Route middleware (v1.1)

`setupNuxtMiddlewareEnv` is a higher-level wrapper around `invokeRouteMiddleware` that adds spy capture, a user-session fixture, and chain execution for `global` + route-specific middleware.

```ts
import { setupNuxtMiddlewareEnv } from '@kiwa/nuxt';
import { globalAuthGuard, adminRouteGuard } from '../middleware/_kiwa/route-guard.js';

it('admin route — non-admin user is forbidden', async () => {
  const env = await setupNuxtMiddlewareEnv({
    middleware: [globalAuthGuard, adminRouteGuard],
    to: { path: '/admin/users' },
    user: { state: 'authenticated', userId: 'u-1', role: 'user' },
  });
  expect(env.aborted).toBe(true);
  expect(env.outcome.abort?.statusCode).toBe(403);
  expect(env.outcome.executed).toEqual([0, 1]);
});
```

### `setupNuxtMiddlewareEnv(opts)`

| `opts` field | Type | Default | Meaning |
|---|---|---|---|
| `middleware` | `RouteMiddlewareFunction \| readonly RouteMiddlewareFunction[]` | required | Single middleware or ordered chain (global first, route-specific after). Halts at the first redirect / abort / `false` / non-signal throw. |
| `to` | `RouteLocationInput` | required | Navigation target (path + optional name / params / query / hash / meta) |
| `from` | `RouteLocationInput` | `{ path: '/' }` | Source route |
| `user` | `NuxtMiddlewareUserFixture` | omitted | Session fixture merged into `to.meta.userSession` (`'authenticated'` / `'expired'` / `'anonymous'`). Anonymous skips the meta write. |

Returns `{ outcome, navigateToCalls, abortNavigationCalls, redirectedTo, aborted }`. `outcome.executed` / `outcome.skipped` expose which middlewares in the chain ran or were halted. `navigateToCalls` / `abortNavigationCalls` aggregate every spy invocation across the chain.

## Out of scope (tracked separately)

- Nuxt composables (`useFetch` / `useState` / `useNuxtApp`) — covered by `@kiwa/ui` Vue mode for the client side
- Full HTTP round-trip — use Playwright + `@kiwa/e2e` for E2E coverage

## License

MIT
