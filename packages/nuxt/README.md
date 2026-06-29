# @kiwa-test/nuxt

Nuxt 3 Server Routes test adapter for [kiwa](https://github.com/cardene777/kiwa) — invoke `defineEventHandler` callbacks in isolation and capture redirect / cookies / response headers / status without a running Nitro server.

```bash
pnpm add -D @kiwa-test/nuxt
```

## Why

Nuxt 3's `defineEventHandler((event) => ...)` callbacks run inside the Nitro server runtime. Real-server tests are slow + flaky; testing the callback in Vitest with a simulated H3 event is fast + deterministic. `@kiwa-test/nuxt` provides the simulated event and captures all the side effects you'd normally have to inspect after a real HTTP round-trip.

## Quick start

```ts
import { describe, expect, it } from 'vitest';
import { invokeEventHandler, NUXT_REDIRECT_SYMBOL } from '@kiwa-test/nuxt';
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

## Out of scope (tracked separately)

- Nuxt composables (`useFetch` / `useState` / `useNuxtApp`) — covered by `@kiwa-test/ui` Vue mode for the client side
- Nitro plugin lifecycle — file a separate issue if needed
- Route middleware (server-side prepass) — future Issue
- Full HTTP round-trip — use Playwright + `@kiwa-test/e2e` for E2E coverage

## License

MIT
