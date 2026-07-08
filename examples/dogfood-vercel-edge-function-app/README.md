# dogfood-vercel-edge-function-app

Dogfood app v1.24-3 — a Next.js 15 middleware + edge runtime app on Vercel that exercises the `geo-replicated` + `edge-kv` + `streaming-response` axes of `@kiwa/edge` v0.2 end-to-end. Drivable in both `KIWA_MODE=real` (Vercel Edge sandbox + `VERCEL_KEY=1` env-gate) and `KIWA_MODE=mock` (`@kiwa/edge` v0.2 8 axis semantics) so behavioural fidelity feeds the release gate 7 axis.

Sub-Issue #916, land-order 3/6 in the v1.24 milestone.

## Two run modes

- `KIWA_MODE=real` — Vercel Edge sandbox + `vercel dev` behind `VERCEL_KEY=1` env-gate. Runs a real Vercel Edge runtime + Vercel KV Redis + streaming Response stack against a local sandbox. Skipped when the environment cannot reach a working sandbox (no `VERCEL_KEY=1`, no vercel install, no local port).
- `KIWA_MODE=mock` — `@kiwa/edge` v0.2 `createGeoReplicatedSession` / `geoPrimaryWrite` / `markReplicaLagged` / `syncReplica` / `createEdgeKvSession` / `kvRead` / `kvWrite` / `kvRangeQuery` / `openStream` / `sendChunk` / `closeStream` deterministic mocks. Always runs.

`makeMockAdapter` (`src/lib/mock.ts`) drives the mock path; `makeRealAdapter` (`src/lib/real.ts`) drives the real path or falls back to the env-gate skip.

## 8-op surface = geo-replicated 3 + edge-kv 3 + streaming-response 2

| op | axis | neutral events emitted |
|---|---|---|
| `driveGeoRoute` | geo-replicated | stateless region resolution from Accept-Language + `x-vercel-ip-country` |
| `driveGeoPrimaryWrite` | geo-replicated | `geo.primary-write` (bumps version + marks every replica lagging) |
| `driveGeoReplicaSync` | geo-replicated | `geo.replica-lagged` + `geo.replica-synced` per replica + optional `geo.conflict-resolved` |
| `driveKvRead` | edge-kv | `kv.read` / `kv.cache-hit` / `kv.cache-miss` |
| `driveKvWrite` | edge-kv | `kv.write` (persists to store + invalidates cache entry) |
| `driveKvRangeQuery` | edge-kv | `kv.read` with a prefix + sorted matches |
| `driveSseOpen` | streaming-response | `stream.opened` + `stream.chunk-sent` (initial event) |
| `driveSseBackpressure` | streaming-response | `stream.chunk-sent` per follow-up + `stream.backpressure` when byte total exceeds high-water + `stream.closed` |

The 8 ops feed the fidelity harness (`src/lib/fidelity.ts`) which diffs mock-vs-real traces, computes the 7-axis release gate verdict, and emits a JSON + markdown report under `quality-report/`.

## Layout

```
src/
  middleware.ts               — edge-runtime middleware: parses geo IP + Accept-Language
  app/
    api/
      geo/route.ts            — /api/geo route: echoes resolved region metadata
      kv/route.ts              — /api/kv route: GET (read) + POST (write) + range
      stream/route.ts          — /api/stream route: SSE Response with backpressure
  lib/
    vercel-adapter.ts         — VercelEdgeAdapter interface (8 ops) + REGION_CATALOG
    mock.ts                   — makeMockAdapter (backed by @kiwa/edge v0.2 semantics)
    real.ts                   — makeRealAdapter (env-gate skip via KIWA_MODE + VERCEL_KEY)
    fidelity.ts               — runFidelityHarness + runAdapterMatrix
tests/
  geo-routing-e2e.spec.ts           — geo-replicated axis end-to-end
  cache-invalidation-e2e.spec.ts    — edge-kv axis: read-through + invalidation + range
  sse-stream-e2e.spec.ts            — streaming-response axis + backpressure
  fidelity-report.test.ts           — harness contract
  emit-fidelity-report.test.ts      — emit JSON + markdown to quality-report/
```

## Region catalog

The routing table mirrors a real Vercel deployment.

| POP | region key | matching countries | matching Accept-Language |
|---|---|---|---|
| Washington D.C. (default) | `iad1` | US | en |
| Tokyo | `hnd1` | JP / KR | ja / ko |
| San Francisco | `sfo1` | CA | — |
| Frankfurt | `fra1` | GB / DE / FR | de / fr |

When both signals disagree the country wins (Accept-Language is easier to rewrite than geo IP). Unknown country + unknown language fall back to `iad1`.

## Reproduction

Mock-only (default local dev):

```bash
pnpm --filter dogfood-vercel-edge-function-app test
cat examples/dogfood-vercel-edge-function-app/quality-report/fidelity-latest.md
```

Real Vercel Edge sandbox (env-gated):

```bash
export KIWA_MODE=real
export VERCEL_KEY=1
pnpm --filter dogfood-vercel-edge-function-app test
# The v1.24-3 dogfood ships the env-gate skip path only; a follow-up
# lands the vercel sandbox driver behind the same env gate.
```

## Refs

- Parent — v1.24 (#913)
- Sub-Issue — v1.24-3 (#916)
- Depends on — v1.24-1 (@kiwa/edge v0.2 with 8 axis semantics, PR #920)
- Sibling — v1.24-2 (dogfood-cloudflare-workers-durable-object-app, PR #921)
