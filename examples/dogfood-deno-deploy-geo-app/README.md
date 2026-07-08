# dogfood-deno-deploy-geo-app

Dogfood app v1.24-4 — a Deno Fresh app on Deno Deploy that exercises the `geo-replicated` + `edge-kv` + `cron-trigger` axes of `@kiwa/edge` v0.2 end-to-end. Drivable in both `KIWA_MODE=real` (Deno Deploy sandbox + `DENO_DEPLOY_KEY=1` env-gate) and `KIWA_MODE=mock` (`@kiwa/edge` v0.2 8 axis semantics) so behavioural fidelity feeds the release gate 7 axis.

Sub-Issue #917, land-order 4/6 in the v1.24 milestone.

## Two run modes

- `KIWA_MODE=real` — Deno Deploy sandbox + `deno task dev` behind `DENO_DEPLOY_KEY=1` env-gate. Runs a real Deno Deploy runtime + Deno KV + Deno Deploy Cron against a local sandbox. Skipped when the environment cannot reach a working sandbox (no `DENO_DEPLOY_KEY=1`, no deno install, no local port).
- `KIWA_MODE=mock` — `@kiwa/edge` v0.2 `createGeoReplicatedSession` / `geoPrimaryWrite` / `markReplicaLagged` / `syncReplica` / `createEdgeKvSession` / `kvRead` / `kvWrite` / `kvRangeQuery` / `scheduleCron` / `startCron` / `completeCron` / `failCron` deterministic mocks. Always runs.

`makeMockAdapter` (`src/lib/mock.ts`) drives the mock path; `makeRealAdapter` (`src/lib/real.ts`) drives the real path or falls back to the env-gate skip.

## 8-op surface = geo-replicated 3 + edge-kv 2 + cron-trigger 3

| op | axis | neutral events emitted |
|---|---|---|
| `driveGeoRoute` | geo-replicated | stateless region resolution from Accept-Language + Deno Deploy geo header |
| `driveGeoPrimaryWrite` | geo-replicated | `geo.primary-write` (bumps version + marks every replica lagging) |
| `driveGeoReplicaSync` | geo-replicated | `geo.replica-lagged` + `geo.replica-synced` per replica + optional `geo.conflict-resolved` |
| `driveKvWrite` | edge-kv | `kv.write` (persists to store + invalidates cache entry) |
| `driveKvRangeQuery` | edge-kv | `kv.read` with a prefix + sorted matches |
| `driveReadYourWrites` | edge-kv | `kv.write` + `kv.read` fused into a single consistency-observation op (strong on primary, eventual on lagging replica) |
| `driveCronSchedule` | cron-trigger | `cron.scheduled` + `cron.started` (fires schedule + start on the same op boundary) |
| `driveCronComplete` | cron-trigger | `cron.completed` (success) or `cron.failed` (failure with retry decision) |

The 8 ops feed the fidelity harness (`src/lib/fidelity.ts`) which diffs mock-vs-real traces, computes the 7-axis release gate verdict, and emits a JSON + markdown report under `quality-report/`.

## Layout

```
src/
  routes/api/
    kv.ts                       — /api/kv POST (multi-region write) + GET range
    read-your-writes.ts         — /api/read-your-writes: strong / eventual paths
    cron.ts                     — /api/cron POST (schedule) + DELETE (complete)
  cron/
    purge-job.ts                — 24-h retention purge job (scheduled + queue variants)
  lib/
    deno-adapter.ts             — DenoDeployAdapter interface (8 ops) + REGION_CATALOG
    mock.ts                     — makeMockAdapter (backed by @kiwa/edge v0.2 semantics)
    real.ts                     — makeRealAdapter (env-gate skip via KIWA_MODE + DENO_DEPLOY_KEY)
    fidelity.ts                 — runFidelityHarness + runAdapterMatrix
tests/
  multi-region-write-e2e.spec.ts     — geo-replicated + edge-kv axes end-to-end
  read-your-writes-e2e.spec.ts       — read-your-writes consistency guarantee
  cron-trigger-e2e.spec.ts           — cron-trigger axis + queue trigger + purge job
  fidelity-report.test.ts            — harness contract
  emit-fidelity-report.test.ts       — emit JSON + markdown to quality-report/
```

## Region catalog

The routing table mirrors a real Deno Deploy deployment.

| POP | region key | matching countries | matching Accept-Language |
|---|---|---|---|
| Washington D.C. (default) | `us-east1` | US | en |
| San Francisco | `us-west1` | CA | — |
| Tokyo | `asia-northeast1` | JP / KR | ja / ko |
| Frankfurt | `europe-west3` | GB / DE / FR | de / fr |

When both signals disagree the country wins (Accept-Language is easier to rewrite than the Deno Deploy geo header). Unknown country + unknown language fall back to `us-east1`.

## Reproduction

Mock-only (default local dev):

```bash
pnpm --filter dogfood-deno-deploy-geo-app test
cat examples/dogfood-deno-deploy-geo-app/quality-report/fidelity-latest.md
```

Real Deno Deploy sandbox (env-gated):

```bash
export KIWA_MODE=real
export DENO_DEPLOY_KEY=1
pnpm --filter dogfood-deno-deploy-geo-app test
# The v1.24-4 dogfood ships the env-gate skip path only; a follow-up
# lands the Deno Deploy sandbox driver behind the same env gate.
```

## Refs

- Parent — v1.24 (#913)
- Sub-Issue — v1.24-4 (#917)
- Depends on — v1.24-1 (@kiwa/edge v0.2 with 8 axis semantics, PR #920)
- Siblings — v1.24-2 (dogfood-cloudflare-workers-durable-object-app, PR #921) + v1.24-3 (dogfood-vercel-edge-function-app, PR #922)
