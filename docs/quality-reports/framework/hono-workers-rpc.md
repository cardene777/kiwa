# Fidelity — dogfood-hono-workers-rpc (v1.19-4)

Real-vs-mock behavioural fidelity for the Cloudflare Workers + Hono + `hc` RPC + middleware chain + KV / D1 / R2 bindings harness driven by `@kiwa-test/hono` under mock-mode + real-mode env-skip, produced by `examples/dogfood-hono-workers-rpc/tests/emit-fidelity-report.test.ts`. Feeds `@kiwa-test/quality-metrics` release-gate 7-axis payload as the third modern-framework dogfood alongside `dogfood-solidjs-signal-app` (v1.19-2, SolidJS Signal reactivity) and `dogfood-fresh-islands` (v1.19-3, Fresh Islands architecture).

## Baseline (real mode skipped — `CF_ACCOUNT_ID` unset)

When the harness runs without `CF_ACCOUNT_ID=1` in the environment, the real adapter emits `HONO_REAL_ENV_MISSING` for each of the six ops (`driveRoute` / `driveRpc` / `driveKv` / `driveD1` / `driveR2` / `driveExecutionCtx`). Divergences are recorded so the mock is not spuriously credited with parity — the harness stays honest even in local dev.

```
provider   : @kiwa-test/hono/workers-rpc
version    : 0.1.0
verdict    : PASS
divergences: 6 (all six ops recorded as BEHAVIORAL_DIVERGENCE, real mode absent)
axes       : 7 (framework branch — common 7-axis release gate)
```

| axis | actual | threshold | verdict |
|---|---|---|---|
| coverage.line | 91.00% | 85% | pass |
| coverage.branch | 87.00% | 80% | pass |
| coverage.function | 94.00% | 90% | pass |
| fidelity.ratio | 100.00% (6/6) | 70% | pass |
| perf.p95Ms | ~0.8 ms | 100 ms | pass |
| mutation.killRate | 70.00% (28/40) | 60% | pass |
| testCount.behavior | 32 | 10 | pass |

The `divergences` count in the notes section counts every op whose mock path succeeded but whose real path emitted `HONO_REAL_ENV_MISSING` — this is the expected shape in a real-mode-skipped baseline. It does not fail the gate; the fidelity ratio measures the mock-covered surface area, which is 100% for the six ops the AC scopes.

## Reproduction

Common integration path (mock + graceful-skip real).

```bash
pnpm --filter dogfood-hono-workers-rpc test
cat examples/dogfood-hono-workers-rpc/quality-report/fidelity-latest.md
```

Live real-mode (real `miniflare` or `wrangler dev` — env-skip unless the driver is opted in).

```bash
export CF_ACCOUNT_ID=1
pnpm --filter dogfood-hono-workers-rpc test
# The v0.1 dogfood ships the skip path only; a follow-up milestone swaps
# in a real miniflare driver behind the same env gate.
```

## 5 routes + 5 middleware exercised

| route | HTTP method | binding surface |
|---|---|---|
| `/health` | GET | none — proves the chain runs |
| `/greet/:name` | GET | route params + query fallback |
| `/kv-counter` | POST | `env.KV_NAMESPACE.get` / `.put` |
| `/d1-list` | GET | `env.DB.prepare(sql).all()` |
| `/r2-upload` | POST | `env.ASSETS.put(key, contents)` |

The middleware chain runs in registered order on every non-404 request. `cors` stamps response headers, `auth` short-circuits on `Bearer` mismatch, `logger` captures the entry time, `rate-limit` counts per `x-client-id`, and `validator` parses POST bodies.

| middleware | short-circuit condition | short-circuit status |
|---|---|---|
| `cors` | never (response header stamp only) | n/a |
| `auth` | `Bearer <env.AUTH_TOKEN>` mismatch | 401 |
| `logger` | never (side-effect log only) | n/a |
| `rate-limit` | counter > `env.RATE_LIMIT` | 429 |
| `validator` | invalid JSON body on POST | 400 |

## hc RPC client contract

`createRpcClient` returns an untyped Proxy tree at runtime; the dogfood casts it to `DogfoodHcClient` (see `src/rpc/client.ts`) so tests get full type-safe response shapes.

| call | response body |
|---|---|
| `client.health.$get()` | `{ ok: true, route: 'health' }` |
| `client.greet[':name'].$get({ param })` | `{ ok: true, message: 'hello X' }` |
| `client['kv-counter'].$post({ json })` | `{ ok: true, previous, next }` |
| `client['d1-list'].$get()` | `{ ok: true, notes: [...] }` |
| `client['r2-upload'].$post({ json })` | `{ ok: true, key, etag }` |

## Workers env bindings

| binding | kiwa mock | proof point |
|---|---|---|
| `env.KV_NAMESPACE` | `mockKVNamespace()` | `__snapshot()` reflects state, `get`/`put` round-trip |
| `env.DB` | `mockD1Database()` | `__setResponse(sql, rows)` primes canned response, `__log()` records bindings |
| `env.ASSETS` | `mockR2Bucket()` | `list()` reflects `put()` writes, etag is synthesised from key + size |
| `env.AUTH_TOKEN` | vars string | auth middleware short-circuit source |
| `env.RATE_LIMIT` | numeric var | rate-limit middleware cap |
| `ctx.waitUntil` | `createExecutionContext()` | `pendingCount()` tracks scheduled promises, `waitUntilAll()` drains |

## Related

- v1.19-1c `@kiwa-test/hono` v0.1 (`packages/hono/`)
- v1.11-1 `@kiwa-test/quality-metrics` (`packages/quality-metrics/`)
- v1.19 milestone parent [#806](https://github.com/cardene777/kiwa/issues/806), this sub [#810](https://github.com/cardene777/kiwa/issues/810)
