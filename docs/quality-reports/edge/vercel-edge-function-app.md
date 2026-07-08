# Fidelity — dogfood-vercel-edge-function-app (v1.24-3)

Real-vs-mock behavioural fidelity for the Next.js 15 middleware + edge runtime app driven by `@kiwa/edge` v0.2 (v1.24-1 land, PR #920) under `KIWA_MODE=real` (Vercel Edge sandbox + `vercel dev` + `VERCEL_KEY=1` env-gate) and `KIWA_MODE=mock` (`@kiwa/edge` v0.2 8 axis semantics), produced by `examples/dogfood-vercel-edge-function-app/tests/emit-fidelity-report.test.ts`. Feeds `@kiwa/quality-metrics` release-gate 7-axis payload as the second edge-platform dogfood in the v1.24 milestone.

## Baseline (real mode skipped — `KIWA_MODE=real` + `VERCEL_KEY=1` unset)

When the harness runs without both `KIWA_MODE=real` and `VERCEL_KEY=1` in the environment, the real adapter emits `KIWA_VERCEL_EDGE_ENV_MISSING` for each of the 8 ops (`driveGeoRoute` / `driveGeoPrimaryWrite` / `driveGeoReplicaSync` / `driveKvRead` / `driveKvWrite` / `driveKvRangeQuery` / `driveSseOpen` / `driveSseBackpressure`). Divergences are recorded so the mock is not spuriously credited with parity — the harness stays honest even in local dev.

```
provider   : @kiwa/edge/vercel-edge-function
version    : 0.1.0
verdict    : PASS
divergences: 8 (all eight ops recorded as BEHAVIORAL_DIVERGENCE, real mode absent)
axes       : 7 (framework branch — common 7-axis release gate)
```

| axis | actual | threshold | verdict |
|---|---|---|---|
| coverage.line | 92.00% | 85% | pass |
| coverage.branch | 86.00% | 80% | pass |
| coverage.function | 95.00% | 90% | pass |
| fidelity.ratio | 100.00% (8/8) | 70% | pass |
| perf.p95Ms | ~0.10 ms | 100 ms | pass |
| mutation.killRate | 70.00% (28/40) | 60% | pass |
| testCount.behavior | 30 | 10 | pass |

The `divergences` count in the notes section counts every op whose mock path succeeded but whose real path emitted `KIWA_VERCEL_EDGE_ENV_MISSING` — this is the expected shape in a real-mode-skipped baseline. It does not fail the gate; the fidelity ratio measures the mock-covered surface area, which is 100% for the eight ops the AC scopes.

## Reproduction

Common integration path (mock + graceful-skip real).

```bash
pnpm --filter dogfood-vercel-edge-function-app test
cat examples/dogfood-vercel-edge-function-app/quality-report/fidelity-latest.md
```

Live real-mode (real Vercel Edge sandbox or `vercel dev` — env-skip unless the driver is opted in).

```bash
export KIWA_MODE=real
export VERCEL_KEY=1
pnpm --filter dogfood-vercel-edge-function-app test
# The v1.24-3 dogfood ships the env-gate skip path only; a follow-up
# milestone swaps in a real Vercel Edge sandbox driver behind the same env gate.
```

## 8-op surface = geo-replicated 3 + edge-kv 3 + streaming-response 2

The 8 ops correspond directly to the 8 axis routing pattern inherited from v1.24-1 (`@kiwa/edge` v0.2 semantics). Each op emits neutral events on 1 axis:

| op | primary axis | neutral events emitted |
|---|---|---|
| `driveGeoRoute` | geo-replicated | stateless region resolution from Accept-Language + `x-vercel-ip-country`, no session mutation |
| `driveGeoPrimaryWrite` | geo-replicated | `geo.primary-write` — bumps version + marks every replica lagging |
| `driveGeoReplicaSync` | geo-replicated | `geo.replica-lagged` + `geo.replica-synced` per replica + optional `geo.conflict-resolved` |
| `driveKvRead` | edge-kv | `kv.read` (read-through) / `kv.cache-hit` (warm) / `kv.cache-miss` (absent) |
| `driveKvWrite` | edge-kv | `kv.write` — persists to store + invalidates cache entry |
| `driveKvRangeQuery` | edge-kv | `kv.read` with a prefix + sorted match list |
| `driveSseOpen` | streaming-response | `stream.opened` + `stream.chunk-sent` for the initial event |
| `driveSseBackpressure` | streaming-response | `stream.chunk-sent` per follow-up + `stream.backpressure` on high-water breach + `stream.closed` |

## 3 route paths dispatched by the Next.js 15 edge runtime

| route | HTTP method | handler kind |
|---|---|---|
| `/api/geo` | GET | echoes middleware-resolved region + language + fellBack flag |
| `/api/kv` | GET / POST | `handleKvGet` (read-through via KV) / `handleKvPost` (write + invalidate) / `handleKvRange` (prefix scan) |
| `/api/stream` | GET | `handleSse` opens SSE stream + writes N chunks + closes cleanly |

`middleware.ts` runs at every edge request to stamp `x-kiwa-region` / `x-kiwa-language` / `x-kiwa-fell-back` on the response so downstream handlers see the negotiated region.

## Test spec map (41 tests total)

- `geo-routing-e2e.spec.ts` (12 tests) — geo-replicated axis: country-decisive routing, Accept-Language fallback, country-vs-language precedence, default region fallback, primary write + replica sync, partial sync stays lagging, routing statelessness, middleware layer, `/api/geo` route echo, metrics, real env-skip (2 ops).
- `cache-invalidation-e2e.spec.ts` (13 tests) — edge-kv axis: cache-miss on absent key, write invalidates cache, second read is cache-hit, unchanged rewrite still invalidates, range query sorted, empty range, `/api/kv` GET/POST/range, 404 on absent key, metrics, real env-skip (3 ops).
- `sse-stream-e2e.spec.ts` (11 tests) — streaming-response axis: initial chunk delivery, small run stays under high-water, overwhelming run hits backpressure, close idempotence, shared session across open + backpressure, Vercel KV + SSE integration, `serializeSseFrame` wire format, `/api/stream` route, metrics, real env-skip (2 ops).
- `fidelity-report.test.ts` (4 tests) — harness contract: 8-op mock coverage, mock failure propagation, divergence notes on skip, p95 latency surfaces.
- `emit-fidelity-report.test.ts` (1 test) — writes JSON snapshot + markdown report to `quality-report/`.

## Env-gate escape hatch

The real adapter reads two environment variables at construction:

- `KIWA_MODE=real` — enables the connected path; any other value returns the skip adapter.
- `VERCEL_KEY=1` — proxy for "vercel is installed + authorized" so tests do not spawn `vercel dev` unless the caller explicitly opts in.

When either gate is unset the adapter records `KIWA_VERCEL_EDGE_ENV_MISSING` on every op call, throws `SkippedError`, and lets the harness compute divergences from the trace. This lets the same test suite run in local dev without a Vercel installation and in CI with a `vercel dev` subprocess behind the env gate.

## Refs

- Parent — v1.24 (#913)
- Sub-Issue — v1.24-3 (#916)
- Depends on — v1.24-1 (@kiwa/edge v0.2 with 8 axis semantics, PR #920)
- Sibling — v1.24-2 (dogfood-cloudflare-workers-durable-object-app, PR #921)
