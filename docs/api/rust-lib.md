# @kiwa-lab/rust-lib API reference

## Overview

`@kiwa-lab/rust-lib` は axum / actix-web / tower-http / rocket 4 framework を統一 interface で mock する Rust web framework test infra。 handler invoke + middleware trace を real Rust runtime 不要で叩ける。

## Supported frameworks

| framework | handler signature | extractor | middleware |
|---|---|---|---|
| axum | `async fn(...) -> impl IntoResponse` | typed extractor | tower Layer |
| actix-web | `async fn(...) -> impl Responder` | typed extractor | Middleware trait |
| tower-http | Service (Layer) | tower::Service | tower Layer |
| rocket | `#[get("/path")]` fn | request guard | Fairing |

## Main API

### `createRustAppEnv(options): RustAppEnv`

`{ framework, routes? }` で mock env 生成。 `routes` に `{ method, path, handler }` を宣言。

### `invokeAxumHandler(env, options: InvokeAxumOptions): InvokeAxumResult`

axum handler を invoke、 `{ status, body, headers, extractedParams }` を返す。 `IntoResponse` 相当の status / body 変換。

### `invokeActixHandler(env, options: InvokeActixOptions): InvokeActixResult`

Actix-web handler 用 invoke、 middleware chain 通過 + Responder 変換。

### `invokeRocketRoute(env, options: InvokeRocketOptions): InvokeRocketResult`

Rocket route を invoke、 request guard + response conversion 済 result を返す。

### `captureTowerMiddleware(env): TowerTrace[]`

tower Service layer の invoke trace を snapshot、 `[{ layer, request, response, elapsedMs }]`。

## Types

- `RustFramework = 'axum' | 'actix-web' | 'tower-http' | 'rocket'`
- `RustRoute` = `{ method, path, handler, middleware? }`
- `RustResponse` = `{ status, body, headers }`
- `TowerRequest` = `{ method, uri, headers, body }`
- `TowerTrace` = `{ layer, request, response, elapsedMs }`

## Usage examples

### axum handler invoke

```typescript
import { createRustAppEnv, invokeAxumHandler } from '@kiwa-lab/rust-lib';
import { describe, expect, it } from 'vitest';

describe('GET /users/:id (axum)', () => {
  it('200 + JSON body を返す', () => {
    const env = createRustAppEnv({
      framework: 'axum',
      routes: [
        {
          method: 'GET',
          path: '/users/:id',
          handler: (params) => ({ status: 200, body: JSON.stringify({ id: params.id, name: 'kiwa' }) }),
        },
      ],
    });
    const res = invokeAxumHandler(env, { method: 'GET', path: '/users/1' });
    expect(res.status).toBe(200);
    expect(JSON.parse(res.body).id).toBe('1');
  });
});
```

### tower middleware trace

```typescript
import { createRustAppEnv, captureTowerMiddleware, invokeAxumHandler } from '@kiwa-lab/rust-lib';

const env = createRustAppEnv({
  framework: 'axum',
  routes: [{ method: 'GET', path: '/api', handler: () => ({ status: 200, body: 'ok' }), middleware: ['AuthLayer', 'TracingLayer'] }],
});
invokeAxumHandler(env, { method: 'GET', path: '/api' });
const trace = captureTowerMiddleware(env);
expect(trace.map((t) => t.layer)).toEqual(['AuthLayer', 'TracingLayer']);
```

## Related skills

- [`/kiwa-rust-lib`](../skills/kiwa-rust-lib) — Rust framework test 生成 skill
- [`/kiwa-rust`](../skills/kiwa-rust) — Rust language-level test guide (related)
