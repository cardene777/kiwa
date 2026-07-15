# @kiwa-lab/go-lib API reference

## Overview

`@kiwa-lab/go-lib` は gin / echo / fiber / chi 4 framework を統一 interface で mock する Go web framework test infra。 real Go runtime 不要で TypeScript から Go framework 相当の handler dispatch + middleware chain を叩ける。

## Supported frameworks

| framework | handler signature | context type | middleware |
|---|---|---|---|
| gin | `func(*gin.Context)` | `*gin.Context` | `gin.HandlerFunc` |
| echo | `func(echo.Context) error` | `echo.Context` | `echo.MiddlewareFunc` |
| fiber | `func(*fiber.Ctx) error` | `*fiber.Ctx` | `fiber.Handler` |
| chi | `http.HandlerFunc` | `http.ResponseWriter, *http.Request` | `chi.Middleware` |

## Main API

### `createGoAppEnv(options): GoAppEnv`

`{ framework, routes? }` で mock env 生成。 `routes = [{ method, path, handler, middleware? }]`。

### `invokeGinHandler(env, options): InvokeGinHandlerResult`

gin handler を invoke、 `GinContext` (Params / Query / Body / Headers / Set / Get) を mock、 `{ status, body, headers, contextKeys }` を返す。

### `invokeEchoHandler / invokeFiberHandler`

echo / fiber の handler invoke、 各 framework 固有 context を mock。

### `captureChiRoute(env, options): CaptureChiRouteResult`

chi router の pattern matching + middleware chain 履歴を trace、 `{ matched, params, middlewareChain, response }`。

## Types

- `GoFramework = 'gin' | 'echo' | 'fiber' | 'chi'`
- `GoRouteDefinition` = `{ method, path, handler, middleware? }`
- `GoRequest` = `{ method, path, headers?, body?, params?, query? }`
- `GoResponse` = `{ status, body, headers }`
- `GoMiddlewareTraceEntry` = `{ name, before?, after? }`

## Usage examples

### gin handler + middleware

```typescript
import { createGoAppEnv, invokeGinHandler } from '@kiwa-lab/go-lib';
import { describe, expect, it } from 'vitest';

describe('POST /orders (gin)', () => {
  it('json body 受信 + 201 + Location header', () => {
    const env = createGoAppEnv({
      framework: 'gin',
      routes: [
        {
          method: 'POST',
          path: '/orders',
          handler: (ctx) => ({
            status: 201,
            body: JSON.stringify({ id: 'o-1' }),
            headers: { Location: '/orders/o-1' },
          }),
        },
      ],
    });
    const res = invokeGinHandler(env, {
      method: 'POST',
      path: '/orders',
      body: JSON.stringify({ total: 1000 }),
    });
    expect(res.status).toBe(201);
    expect(res.headers.Location).toBe('/orders/o-1');
  });
});
```

### chi router pattern matching

```typescript
import { createGoAppEnv, captureChiRoute } from '@kiwa-lab/go-lib';

const env = createGoAppEnv({
  framework: 'chi',
  routes: [{ method: 'GET', path: '/users/{id}/posts/{postId}', handler: () => ({ status: 200, body: 'ok' }) }],
});
const result = captureChiRoute(env, { method: 'GET', path: '/users/1/posts/42' });
expect(result.matched).toBe(true);
expect(result.params).toEqual({ id: '1', postId: '42' });
```

## Related skills

- [`/kiwa-go-lib`](../skills/kiwa-go-lib) — Go framework test 生成 skill
- [`/kiwa-go`](../skills/kiwa-go) — Go language-level test guide (related)
