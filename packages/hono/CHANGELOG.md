# @kiwa-lab/hono

## 0.2.0

### Minor Changes

- d297fee: New package `@kiwa-lab/hono` v0.1 — HonoJS Cloudflare Workers + hc RPC type-safe client + middleware chain test adapter (Issue #815, v1.19-1c). Provides `createHonoApp` + `invokeRoute` + `createContext` + `buildRequest` + `compileRoute` + `matchRoute` + `createRpcClient` + `defineRpcApp` + `createWorkersEnv` + `createExecutionContext` + `mockKVNamespace` + `mockD1Database` + `mockR2Bucket` + type guards (`isHonoApp` / `isHonoContext` / `isHcResponse` / `isWorkersEnv` / `isExecutionContextMock` / `isKVNamespaceMock` / `isD1DatabaseMock` / `isR2BucketMock`) + brand symbols (`HONO_APP_SYMBOL` / `HONO_CONTEXT_SYMBOL` / `HONO_ROUTE_SYMBOL` / `HC_CLIENT_SYMBOL` / `HC_REQUEST_SYMBOL` / `WORKERS_ENV_SYMBOL` / `EXECUTION_CTX_SYMBOL` / `KV_NAMESPACE_SYMBOL` / `D1_DATABASE_SYMBOL` / `R2_BUCKET_SYMBOL`). 89 unit tests passing (app 39 + rpc 17 + workers 33), coverage 97.91% lines / 88.47% branches / 97.75% functions, release gate 7 軸 pass.

## 0.1.0

### Minor Changes

- 🎉 New package `@kiwa-lab/hono` v0.1 — HonoJS Cloudflare Workers + hc RPC type-safe client + middleware chain test adapter (Issue #815, v1.19-1c).

  ## What's in the box

  - `createHonoApp<TEnv>()` — Hono-shaped app builder with `.get()` / `.post()` / `.put()` / `.delete()` / `.patch()` / `.all()` route methods + `.use(pattern, mw)` middleware + `.route(prefix, sub)` sub-app composition + `.request(url, init, env, ctx)` fetch-shaped dispatch.
  - `invokeRoute({ app, method, path, headers, body, env, executionCtx })` — single-request driver returning `{ matched, response, trace, error }`. `trace` records the exact `middleware` → `handler` chain with `enteredAt` / `exitedAt` counters for order assertions.
  - `createContext({ req, env, executionCtx })` — standalone `c` object (`c.req`, `c.env`, `c.executionCtx`, `c.status()`, `c.header()`, `c.json()`, `c.text()`, `c.set()`, `c.get()`, `c.response`) for handler unit tests without spinning up the app.
  - `buildRequest({ method, url, headers, body, params })` — standalone `HonoRequest` shape with lazy `json()` / `text()` body parsing + lowercase header lookup + `queryValue()` / `param()` accessors.
  - `compileRoute(pattern)` + `matchRoute(matcher, path)` — Hono-shaped `/users/:id` + `/blog/*` matcher used internally for both route dispatch and `use()` scope checks.
  - `createRpcClient(app, { baseUrl })` — Proxy-based hc client. `client.users[':id'].$get({ param: { id: '42' } })` walks a dotted route path, substitutes `:name` params, and dispatches through `invokeRoute`. Returns an `HcResponse` with `.ok` / `.status` / `.headers` / `.trace` / `.matched` / `.json()` / `.text()`.
  - `defineRpcApp({ configure })` — build an app + client pair in one call.
  - `createWorkersEnv({ kv, d1, r2, vars, secrets })` — Cloudflare Workers `env` object. Spreads bindings under their names + string vars / secrets as plain properties.
  - `createExecutionContext()` — Workers-shaped `ExecutionContext` with `waitUntil` / `passThroughOnException` + test helpers `waitUntilAll()` / `didPassThrough()` / `pendingCount()`. `waitUntilAll` drains recursively so promises registered inside other awaited promises are also flushed.
  - `mockKVNamespace()` — full KV surface with `get` / `getWithMetadata` / `put` (with `expirationTtl` / `expiration` / `metadata`) / `delete` / `list(prefix, limit)` + `__snapshot()` escape hatch. Expiration is evaluated against `Date.now()` on read (matches Workers behavior).
  - `mockD1Database()` — D1 stub with `prepare(query).bind(...).first(col?)` / `.all()` / `.run()` + `.batch()` + `.exec()` + `__setResponse(query, rows)` for canned responses + `__log()` for asserting on executed queries + bindings.
  - `mockR2Bucket()` — R2 bucket with `get` / `put` (with `httpMetadata` / `customMetadata`) / `delete` / `list(prefix, limit)` + `__snapshot()`.
  - Brand symbols: `HONO_APP_SYMBOL` / `HONO_CONTEXT_SYMBOL` / `HONO_ROUTE_SYMBOL` / `HC_CLIENT_SYMBOL` / `HC_REQUEST_SYMBOL` / `WORKERS_ENV_SYMBOL` / `EXECUTION_CTX_SYMBOL` / `KV_NAMESPACE_SYMBOL` / `D1_DATABASE_SYMBOL` / `R2_BUCKET_SYMBOL` + matching type-guards.

  ## Coverage

  89 unit tests passing (app 39 + rpc 17 + workers 33)、 coverage `lines / functions / statements` 97.91 / 97.75 / 97.91、 branches 88.47。 release gate 7 軸 pass (build ESM + CJS + DTS clean、 typecheck clean、 coverage above 80%).

  ## Out of scope (separate Issues)

  - real Hono runtime binding (`hono` package integration) → tests use standalone mocks with the same brand symbols
  - full `TrieRouter` (regex constraints, multi-wildcard per pattern) → subset `:param` + `*` wildcard
  - streaming responses / SSE / websockets → responses are always fully buffered
  - real Cloudflare Durable Objects / Queues / Analytics Engine bindings → supply a fake object under the same env binding name if a test needs one
  - real D1 SQLite semantics → canned responses per exact query string

  ## Companion

  - v1.19-1 (#807) は SolidJS (#813) + Fresh (#814) + 本 pkg (#815) の 3 分割で 1 pkg = 1 PR 化.
  - `packages/hono/{stryker.config.mjs,vitest.stryker.config.mjs}` 配置で mutation gate 統合準備.
  - `scripts/check-coverage-gates.mjs` + `scripts/check-mutation-gates.mjs` に `@kiwa-lab/hono` 行追加.
  - `tests/release-smoke/tests/import-surface.test.ts` に new export block 追加.
  - root README Limitations 表に HonoJS ✅ 行追加、 Roadmap v1.19 行に 3/3 resolved 記載.

  関連: GitHub #815 (本 sub) / 親 #807 v1.19-1 / v1.19 milestone #806.
