# Edge / Serverless advanced testing — v1.2 8 axis SSOT

## What this covers

`@kiwa-test/edge` v1.2 layers 8 advanced axes on top of the v1.1 8-axis base (durable-object / websocket-edge / edge-kv / geo-replicated / cron-trigger / subrequest-limit / cpu-time-limit / streaming-response) to give kiwa the full 16-axis Edge / Serverless testing surface. Each new axis pins a semantic that a real production edge platform exposes differently — cold-start latency profile, middleware chain execution order, KV eventual consistency guarantees, R2 multipart integrity, D1 read replica routing, DurableObject state migration, WebSocket hibernation, and Global routing. This document is the SSOT for the 8 axes, the 3-platform fidelity grid (`cloudflare` / `vercel` / `deno`), and the pair 第 12 新規 base pair introduction.

## Pair 第 12 縦深化 pair introduction

v1.43 introduces the 12th 縦深化 pair — Edge / Serverless 深化 base at v1.43. Under the 4-段拡張 pattern established by pair 第 9 (AI/LLM, v1.12→v1.15→v1.38→v1.40), pair 第 10 (Payment, v1.14→v1.19→v1.33→v1.41), and pair 第 11 (Observability, v1.14→v1.17→v1.35→v1.42), the next expected III depth for Edge / Serverless is around v1.62±.

## The 8 v1.2 advanced axes

### cold-start axis

`startColdStartPool` + `invokeColdStart` + `preWarmInstance` + `evictExpired`. Models serverless function warm/cold path + provisioned concurrency. Cloudflare Workers, Vercel Edge, and AWS Lambda expose different `cold` / `warm` / `provisioned` cost profiles — the axis classifies each invocation deterministically so tests can assert on the class without wall-clock measurement.

### middleware-chain axis

`startMiddlewareChain` + `enterMiddleware` + `rewriteRequest` + `shortCircuit` + `completeMiddleware`. Models the edge middleware pipeline (auth → rewrite → cache → transform). Each middleware can pass, rewrite the URL, short-circuit (auth reject / cache hit), or complete. Preserves stage order so tests can assert the exact sequence executed.

### kv-eventual-consistency axis

`startKvConsistency` + `recordWriteQuorum` + `observeRead` + `forceConvergence`. Models the read-your-writes / monotonic-reads subset of consistency guarantees. Writes converge across quorum, but reads from a lagging replica return stale data. Detects `stale-read`, `read-your-writes`, and `monotonic-violation`.

### r2-multipart axis

`initiateMultipart` + `uploadPart` + `verifyChecksum` + `completeMultipart`. Models R2 / S3-compatible multipart upload with per-part checksum verification. Tracks per-part state and aggregate integrity so failed uploads can be resumed from the last verified part.

### d1-read-replica axis

`startD1` + `writeToPrimary` + `readFromReplica` + `reportLag`. Models primary-replica database routing. Writes always land on primary, reads route to nearest replica unless lag exceeds threshold. Tracks per-replica lag and routing decisions.

### do-state-migration axis

`initiateMigration` + `bumpSchema` + `migrateInstance` + `completeRollout` + `rollbackMigration`. Models DurableObject class migration + state schema versioning + zero-downtime rollout across DO instances. Tracks per-instance schema version so tests can assert atomic migration + safe rollback.

### websocket-hibernation axis

`startHibernationSession` + `hibernate` + `resume` + `restoreState` + `completeReconnect`. Models the Cloudflare Workers / Vercel Edge WebSocket hibernation model where an idle connection is hibernated (freed from memory), then resumed on next inbound message with restored state.

### global-routing axis

`startRoutingPool` + `receiveAnycast` + `matchGeo` + `selectByLatency` + `markUnhealthy`. Models Anycast + geo routing + latency-based failover. Requests hit Anycast IPs and route to the closest healthy POP based on geo match, then latency probe, then failover if the primary POP is unhealthy.

## 3-platform × 16-axis fidelity grid

The `collectFidelityCoverage(['cloudflare', 'vercel', 'deno'])` output produces 48 rows (3 platform × 16 axis). Each row carries the neutral event list and the platform-specific dialect map. Tests assert on both the neutral event names and the platform dialect strings for full round-trip verification.

Example — cold-start axis Cloudflare dialect.

- `cold-start.invoked` → `worker.cold_start.invoked`
- `cold-start.cache-hit` → `worker.cold_start.warm_hit`
- `cold-start.provisioned-hit` → `worker.cold_start.always_on`
- `cold-start.warmed` → `worker.cold_start.warmed`

Same axis on Vercel.

- `cold-start.invoked` → `serverless.cold_start.invoked`
- `cold-start.cache-hit` → `serverless.cold_start.warm_hit`
- `cold-start.provisioned-hit` → `serverless.cold_start.provisioned`
- `cold-start.warmed` → `serverless.cold_start.warmed`

Same axis on Deno.

- `cold-start.invoked` → `deploy.cold_start.invoked`
- `cold-start.cache-hit` → `deploy.cold_start.warm_hit`
- `cold-start.provisioned-hit` → `deploy.cold_start.provisioned`
- `cold-start.warmed` → `deploy.cold_start.warmed`

## Dogfood app real-driver env-gate

3 dogfood apps ship in v1.43.

- `examples/dogfood-edge-serverless-cold-start-app` — 3 axis (cold / warm / provisioned) × 3 platform × 4 op = 12-op adapter contract. `KIWA_MODE=real` + `EDGE_COLD_START_STACK_READY=1` + `KIWA_EDGE_FN_URL` triggers real Cloudflare Workers + Vercel Edge + AWS Lambda backend calls. Otherwise reports `KIWA_EDGE_COLD_START_ENV_MISSING`.
- `examples/dogfood-edge-durable-object-migration-app` — 3 axis (schema-bump / data-migrate / rollout) × 3 platform × 4 op = 12-op adapter contract. `KIWA_MODE=real` + `EDGE_DO_MIGRATION_STACK_READY=1` + `KIWA_EDGE_DO_URL` triggers real Cloudflare Workers Durable Objects backend calls.
- `examples/dogfood-edge-global-routing-app` — 3 axis (anycast / geo / replica) × 3 platform × 4 op = 12-op adapter contract. `KIWA_MODE=real` + `EDGE_GLOBAL_ROUTING_STACK_READY=1` + `KIWA_EDGE_ANYCAST_URL` triggers real Cloudflare Anycast + D1 read replica backend calls.

Each dogfood app runs the fidelity harness across 9 scenario (3 platform × 3 stage) and reports mock-vs-real trace drift for per-op behavior verification.

## Related concepts

- `observability-advanced-III-testing.md` (v1.42 pair 第 11 depth-4 achievement documentation)
- `payment-advanced-III-testing.md` (v1.41 pair 第 10 depth-4 achievement documentation)
- `real-driver-testing.md` (SSOT for `KIWA_MODE=real` env-gate pattern across all dogfood apps)
- `release-invariants.md` (v1.29 3-layer defensive structure that gates v1.43 publish)
