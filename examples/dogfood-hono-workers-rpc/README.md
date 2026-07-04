# dogfood-hono-workers-rpc

Dogfood app (v1.19-4) — a Cloudflare Workers + Hono + `hc` RPC + middleware chain + KV / D1 / R2 bindings harness that exercises **4 flows** (route invoke through middleware chain / hc client request / Workers env KV+D1+R2 access / ExecutionContext waitUntil scheduling) inside 5 routes (`/health`, `/greet/:name`, `/kv-counter`, `/d1-list`, `/r2-upload`) with a 5-layer middleware chain (`cors` + `auth` + `logger` + `rate-limit` + `validator`). Drivable in both `KIWA_MODE=real` (spawns real `miniflare` through env-skip when `CF_ACCOUNT_ID=1`) and `KIWA_MODE=mock` (`@kiwa-test/hono` `createHonoApp` + `invokeRoute` + `createRpcClient` + `createWorkersEnv` + `createExecutionContext`). Behavioural fidelity feeds `@kiwa-test/quality-metrics` 7-axis release gate.

## Modes

- `KIWA_MODE=mock` (default) — driven by `makeMockAdapter()` (`@kiwa-test/hono` `createHonoApp` + `invokeRoute` + `createRpcClient` + `createWorkersEnv` + `createExecutionContext` + `mockKVNamespace` + `mockD1Database` + `mockR2Bucket`).
- `KIWA_MODE=real` — driven by `makeRealAdapter()`, which detects `CF_ACCOUNT_ID=1`. Without the env var each method reports `HONO_REAL_ENV_MISSING` and throws `SkippedError`; with the env var each method reports `HONO_LIVE_NOT_IMPLEMENTED` (a placeholder trace that keeps the divergence shape stable for follow-up work that swaps in a real `miniflare` driver).

Real-mode envs.

- `CF_ACCOUNT_ID` — set to `1` to enable real mode (requires a workspace where `miniflare` or `wrangler dev` is actually available)

## Layout

```
src/
  routes/
    app.ts                    -- buildDogfoodApp() + 5 routes + 5 middleware chain
  rpc/
    client.ts                 -- DogfoodHcClient wrapper on createRpcClient
  workers/
    bindings.ts               -- createDogfoodBindings() (env + kv + d1 + r2 + ctx)
  adapters/
    interface.ts              -- provider-neutral 6-op contract
    mock.ts                   -- kiwa mock adapter (@kiwa-test/hono)
    real.ts                   -- real Cloudflare Workers adapter with env-skip when CF_ACCOUNT_ID is unset
  flows/
    hono-flows.ts             -- 5 user-facing flows (route/rpc / kv / d1 / r2 / exec-ctx)
    fidelity.ts               -- trace-diffing harness feeding @kiwa-test/quality-metrics
tests/
  app-route.test.ts             -- 6 route + middleware chain invariants
  rpc-client.test.ts            -- 5 hc RPC client tests
  workers-env.test.ts           -- 6 KV / D1 / R2 / ExecutionContext bindings tests
  hono-flows.test.ts            -- 5 end-to-end flow tests
  adapter-contract.test.ts      -- 5 adapter contract tests
  fidelity-report.test.ts       -- 3 harness contract tests
  emit-fidelity-report.test.ts  -- writes the JSON + markdown snapshot (1)
  e2e-mock-mode.test.ts         -- 5 end-to-end mock-mode flows
  perf/
    dogfood-hono-workers-rpc.perf.ts -- 3-layer perf (serial + concurrent + memory)
```

## Emit a fidelity report

```bash
pnpm --filter dogfood-hono-workers-rpc test
cat examples/dogfood-hono-workers-rpc/quality-report/fidelity-latest.md
cat examples/dogfood-hono-workers-rpc/quality-report/fidelity-latest.json
```

The `quality-report/` directory is git-ignored — promote snapshots to `docs/quality-reports/framework/hono-workers-rpc.md` when they become canonical for a release.

## The 6-op Hono / Workers surface

The whole point of the hono-workers-rpc dogfood is to exercise the mock's Hono + CF Workers surface in the exact shape a real `miniflare` + `hc` runtime implements.

1. `driveRoute` — invoke `app.request(path, init, env, ctx)` and capture the response spec + middleware trace.
2. `driveRpc` — invoke the same path through a typed hc client (`client.health.$get`, `client.greet[':name'].$get`, ...) and capture the response wrapper.
3. `driveKv` — invoke `/kv-counter` N times and observe the KV namespace state via `__snapshot()`.
4. `driveD1` — seed a canned response on the D1 mock, invoke `/d1-list`, and observe the returned rows.
5. `driveR2` — invoke `/r2-upload` for N objects and observe the R2 bucket via `list()`.
6. `driveExecutionCtx` — schedule N promises via `ctx.waitUntil(...)` and observe `pendingCount()` before / after `waitUntilAll()`.

Every method emits at least 1 trace event, so the fidelity harness can diff the mock vs the real Cloudflare Workers runtime without adding shape-level noise.

## Release gate (7 axes)

Because the provider string is `@kiwa-test/hono/workers-rpc`, `evaluateReleaseGate` includes the common 7 axes (coverage 3 / fidelity / perf p95 / mutation / behavior tests). The AI-LLM 4 axes (cost / latency / token / accuracy) do not apply — route dispatch and CF bindings are not token-priced generative surfaces.

- coverage — line >= 85%, branch >= 80%, function >= 90%
- fidelity — ratio >= 70% (mock covered ops / real total ops, penalised by behavioural divergences)
- perf — p95 <= 100 ms for the route + binding round-trip
- mutation — kill rate >= 60%
- behavior tests — >= 10 (this dogfood ships 32+)

## Route + middleware chain invariants

Each of the 5 middleware layers exercises 1 specific contract so the fidelity harness can compare the mock's behaviour against a real Hono chain.

| middleware | invariant |
|---|---|
| `cors` | stamps `access-control-allow-origin` / `-allow-methods` on every response |
| `auth` | `Bearer <env.AUTH_TOKEN>` mismatch → 401 short-circuit, no downstream middleware |
| `logger` | appends `startedAt` to context vars + records call site in middleware log |
| `rate-limit` | counter keyed by `x-client-id`, exceeds `env.RATE_LIMIT` → 429 short-circuit |
| `validator` | POST bodies parsed as JSON, invalid → 400 short-circuit |

## hc RPC client contract

| call | invariant |
|---|---|
| `client.health.$get({ headers, env })` | 200 + `{ ok, route: 'health' }` |
| `client.greet[':name'].$get({ param: { name } })` | 200 + `{ message: 'hello X' }` |
| `client['kv-counter'].$post({ json })` | 200 + `{ previous, next }` (monotonic) |
| `client['d1-list'].$get()` | 200 + `{ notes: [...] }` from canned D1 response |
| `client['r2-upload'].$post({ json: { key, contents } })` | 200 + `{ key, etag }` |

## Workers env bindings

| binding | shape | proof point |
|---|---|---|
| `env.KV_NAMESPACE` | `mockKVNamespace()` | `get` returns latest `put`, `__snapshot()` reflects state |
| `env.DB` | `mockD1Database()` | `prepare(sql).all()` returns `__setResponse` canned rows |
| `env.ASSETS` | `mockR2Bucket()` | `put` returns object with etag surrogate, `list()` reflects writes |
| `env.AUTH_TOKEN` | `vars` string | auth middleware compares against `Bearer <token>` |
| `env.RATE_LIMIT` | numeric var | rate-limit middleware short-circuits over the cap |

## Related

- v1.19-1c `@kiwa-test/hono` v0.1 (`packages/hono/`)
- v1.11-1 `@kiwa-test/quality-metrics` (`packages/quality-metrics/`)
- v1.19 milestone parent [#806](https://github.com/cardene777/kiwa/issues/806), this sub [#810](https://github.com/cardene777/kiwa/issues/810)
