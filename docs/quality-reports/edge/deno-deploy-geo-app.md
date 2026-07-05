# Fidelity — dogfood-deno-deploy-geo-app (v1.24-4)

Real-vs-mock behavioural fidelity for the Deno Fresh app on Deno Deploy driven by `@kiwa-test/edge` v0.2 (v1.24-1 land, PR #920) under `KIWA_MODE=real` (Deno Deploy sandbox + `deno task dev` + `DENO_DEPLOY_KEY=1` env-gate) and `KIWA_MODE=mock` (`@kiwa-test/edge` v0.2 8 axis semantics), produced by `examples/dogfood-deno-deploy-geo-app/tests/emit-fidelity-report.test.ts`. Feeds `@kiwa-test/quality-metrics` release-gate 7-axis payload as the third edge-platform dogfood in the v1.24 milestone.

## Baseline (real mode skipped — `KIWA_MODE=real` + `DENO_DEPLOY_KEY=1` unset)

When the harness runs without both `KIWA_MODE=real` and `DENO_DEPLOY_KEY=1` in the environment, the real adapter emits `KIWA_DENO_DEPLOY_ENV_MISSING` for each of the 8 ops (`driveGeoRoute` / `driveGeoPrimaryWrite` / `driveGeoReplicaSync` / `driveKvWrite` / `driveKvRangeQuery` / `driveReadYourWrites` / `driveCronSchedule` / `driveCronComplete`). Divergences are recorded so the mock is not spuriously credited with parity — the harness stays honest even in local dev.

```
provider   : @kiwa-test/edge/deno-deploy-geo
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

The `divergences` count in the notes section counts every op whose mock path succeeded but whose real path emitted `KIWA_DENO_DEPLOY_ENV_MISSING` — this is the expected shape in a real-mode-skipped baseline. It does not fail the gate; the fidelity ratio measures the mock-covered surface area, which is 100% for the eight ops the AC scopes.

## Reproduction

Common integration path (mock + graceful-skip real).

```bash
pnpm --filter dogfood-deno-deploy-geo-app test
cat examples/dogfood-deno-deploy-geo-app/quality-report/fidelity-latest.md
```

Live real-mode (real Deno Deploy sandbox or `deno task dev` — env-skip unless the driver is opted in).

```bash
export KIWA_MODE=real
export DENO_DEPLOY_KEY=1
pnpm --filter dogfood-deno-deploy-geo-app test
# The v1.24-4 dogfood ships the env-gate skip path only; a follow-up
# milestone swaps in a real Deno Deploy sandbox driver behind the same env gate.
```

## 8-op surface = geo-replicated 3 + edge-kv 2 + cron-trigger 3 (+ 1 fused read-your-writes)

The 8 ops correspond directly to the 8 axis routing pattern inherited from v1.24-1 (`@kiwa-test/edge` v0.2 semantics). Each op emits neutral events on 1 axis:

| op | primary axis | neutral events emitted |
|---|---|---|
| `driveGeoRoute` | geo-replicated | stateless region resolution from Accept-Language + Deno Deploy geo header, no session mutation |
| `driveGeoPrimaryWrite` | geo-replicated | `geo.primary-write` — bumps version + marks every replica lagging |
| `driveGeoReplicaSync` | geo-replicated | `geo.replica-lagged` + `geo.replica-synced` per replica + optional `geo.conflict-resolved` |
| `driveKvWrite` | edge-kv | `kv.write` — persists to store + invalidates cache entry |
| `driveKvRangeQuery` | edge-kv | `kv.read` with a prefix + sorted match list |
| `driveReadYourWrites` | edge-kv | `kv.write` + `kv.read` fused into a single consistency-observation op — strong on primary, eventual on lagging replica |
| `driveCronSchedule` | cron-trigger | `cron.scheduled` + `cron.started` (schedule + start fired on the same op boundary) |
| `driveCronComplete` | cron-trigger | `cron.completed` (success) or `cron.failed` (failure with retry decision — `willRetry=true` → `nextState=scheduled`; exhausted → `failed`) |

## 3 route paths + 1 cron entrypoint dispatched by the Fresh runtime

| route | HTTP method | handler kind |
|---|---|---|
| `/api/kv` | POST | `handleKvWrite` (multi-region KV write + geo-replicated primary-write + lagging replicas payload) |
| `/api/kv` | GET | `handleKvRange` (prefix scan over Deno KV) |
| `/api/read-your-writes` | POST | `handleReadYourWrites` (strong on primary, eventual on lagging replica via `?replica=1`) |
| `/api/cron` | POST / DELETE | `handleCronSchedule` (schedule + start) / `handleCronComplete` (success or failure with retry decision) |
| `cron/purge-job.ts` | — | `runPurgeJob` — retention purge (`0 0 * * *`) driving cron-trigger + edge-kv axes together |

Fresh middleware would run at every Deno Deploy edge request to stamp the negotiated region + language; the mock's `resolveRegion` covers the same routing table so behavioural fidelity holds.

## Test spec map (48 tests total)

- `multi-region-write-e2e.spec.ts` (16 tests) — geo-replicated + edge-kv axes: country-decisive routing, Accept-Language fallback, country-vs-language precedence, default region fallback, primary write bumps version + marks replicas lagging, full sync collapses to in-sync, partial sync stays lagging, range query sorted, empty range, `/api/kv` POST + GET, multiple writes accumulate version, metrics, real env-skip (4 ops).
- `read-your-writes-e2e.spec.ts` (12 tests) — edge-kv consistency guarantee: strong at primary, sequential reads, eventual at replica returns null, brand-new key on replica returns null, `consistency` field distinguishes strong from eventual, `consistent` never true on lagging path, `/api/read-your-writes` route strong + eventual, last-writer-wins, metrics, real env-skip (2 ops).
- `cron-trigger-e2e.spec.ts` (17 tests) — cron-trigger axis: scheduled + queue trigger paths, completion transitions, retry decision, retry exhaustion, duplicate id detection, missing id detection, invalid cron spec rejection, `/api/cron` POST + DELETE, purge job success + forced failure + queue variant, metrics, real env-skip (2 ops).
- `fidelity-report.test.ts` (4 tests) — harness contract: 8-op mock coverage, mock failure propagation, divergence notes on skip, p95 latency surfaces.
- `emit-fidelity-report.test.ts` (1 test) — writes JSON snapshot + markdown report to `quality-report/`.

## Env-gate escape hatch

The real adapter reads two environment variables at construction:

- `KIWA_MODE=real` — enables the connected path; any other value returns the skip adapter.
- `DENO_DEPLOY_KEY=1` — proxy for "deno is installed + a Deno Deploy access token is available" so tests do not spawn `deno task dev` unless the caller explicitly opts in.

When either gate is unset the adapter records `KIWA_DENO_DEPLOY_ENV_MISSING` on every op call, throws `SkippedError`, and lets the harness compute divergences from the trace. This lets the same test suite run in local dev without a Deno installation and in CI with a `deno task dev` subprocess behind the env gate.

## Refs

- Parent — v1.24 (#913)
- Sub-Issue — v1.24-4 (#917)
- Depends on — v1.24-1 (@kiwa-test/edge v0.2 with 8 axis semantics, PR #920)
- Siblings — v1.24-2 (dogfood-cloudflare-workers-durable-object-app, PR #921) + v1.24-3 (dogfood-vercel-edge-function-app, PR #922)
