---
'@kiwa-test/hono': minor
---

New package `@kiwa-test/hono` v0.1 — HonoJS Cloudflare Workers + hc RPC type-safe client + middleware chain test adapter (Issue #815, v1.19-1c). Provides `createHonoApp` + `invokeRoute` + `createContext` + `buildRequest` + `compileRoute` + `matchRoute` + `createRpcClient` + `defineRpcApp` + `createWorkersEnv` + `createExecutionContext` + `mockKVNamespace` + `mockD1Database` + `mockR2Bucket` + type guards (`isHonoApp` / `isHonoContext` / `isHcResponse` / `isWorkersEnv` / `isExecutionContextMock` / `isKVNamespaceMock` / `isD1DatabaseMock` / `isR2BucketMock`) + brand symbols (`HONO_APP_SYMBOL` / `HONO_CONTEXT_SYMBOL` / `HONO_ROUTE_SYMBOL` / `HC_CLIENT_SYMBOL` / `HC_REQUEST_SYMBOL` / `WORKERS_ENV_SYMBOL` / `EXECUTION_CTX_SYMBOL` / `KV_NAMESPACE_SYMBOL` / `D1_DATABASE_SYMBOL` / `R2_BUCKET_SYMBOL`). 89 unit tests passing (app 39 + rpc 17 + workers 33), coverage 97.91% lines / 88.47% branches / 97.75% functions, release gate 7 軸 pass.
