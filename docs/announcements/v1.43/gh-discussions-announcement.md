# kiwa v1.43 released — Edge / Serverless 深化 milestone + 縦深化 pair 第 12 新規 base pair 導入

## Summary

kiwa v1.43 is out. **The 12th 縦深化 pair is introduced** — Edge / Serverless base at v1.43, the first new pair base since v1.37 Security (5 milestones ago). This matches the 5-milestone new-base cadence established after 3 depth-4 records (v1.40 AI/LLM + v1.41 Payment + v1.42 Observability).

## What's new

### `@kiwa/edge` v1.2.0

v1.1.0 → v1.2.0 minor bump. 8 new advanced axes added on top of the existing 8-axis base.

- **cold-start** — Serverless function warm/cold path + provisioned concurrency modeling. `startColdStartPool` + `invokeColdStart` + `preWarmInstance` + `evictExpired`.
- **middleware-chain** — Edge middleware pipeline (auth → rewrite → cache → transform + short-circuit). `startMiddlewareChain` + `enterMiddleware` + `rewriteRequest` + `shortCircuit` + `completeMiddleware`.
- **kv-eventual-consistency** — Read-your-writes + monotonic-reads consistency detection. `startKvConsistency` + `recordWriteQuorum` + `observeRead` + `forceConvergence`.
- **r2-multipart** — Resumable multipart upload with per-part checksum verification. `initiateMultipart` + `uploadPart` + `verifyChecksum` + `completeMultipart`.
- **d1-read-replica** — Primary-replica database routing with lag detection + failover. `startD1` + `writeToPrimary` + `readFromReplica` + `reportLag`.
- **do-state-migration** — DurableObject schema versioning + zero-downtime rollout + rollback. `initiateMigration` + `bumpSchema` + `migrateInstance` + `completeRollout` + `rollbackMigration`.
- **websocket-hibernation** — Cloudflare Workers / Vercel Edge WebSocket hibernation model. `startHibernationSession` + `hibernate` + `resume` + `restoreState` + `completeReconnect`.
- **global-routing** — Anycast + geo + latency-based failover routing. `startRoutingPool` + `receiveAnycast` + `matchGeo` + `selectByLatency` + `markUnhealthy`.

3 platform (cloudflare / vercel / deno) × 16 axis (8 v0.2 base + 8 v1.2 advanced) = 48-cell fidelity grid.

### 3 new dogfood apps

- `examples/dogfood-edge-serverless-cold-start-app` — 64 tests. cold / warm / provisioned 3 axis × 3 platform mock/real adapter + fidelity harness.
- `examples/dogfood-edge-durable-object-migration-app` — 60 tests. schema-bump / data-migrate / rollout 3 axis × 3 platform mock/real adapter + fidelity harness.
- `examples/dogfood-edge-global-routing-app` — 60 tests. anycast-routing / geo-matching / replica-affinity 3 axis × 3 platform mock/real adapter + fidelity harness.

Each dogfood ships with real-driver env-gate (`KIWA_MODE=real` + `EDGE_*_STACK_READY=1` + `KIWA_EDGE_*_URL`) so the fidelity harness can sweep against real Cloudflare Workers + Vercel Edge + AWS Lambda + Deno Deploy backends.

### 3 new tutorials

- **[Tutorial 94 — Serverless cold-start](https://cardene777.github.io/kiwa/tutorials/94-serverless-cold-start)** — cold path + warm pool + provisioned concurrency + latency observability walkthrough.
- **[Tutorial 95 — DurableObject state migration](https://cardene777.github.io/kiwa/tutorials/95-durable-object-migration)** — schema versioning + data migrate + zero-downtime rollout + rollback walkthrough.
- **[Tutorial 96 — Global routing](https://cardene777.github.io/kiwa/tutorials/96-global-routing)** — Anycast + geo matching + latency-based failover + D1 read replica affinity walkthrough.

### 21-milestone consecutive snippet validation streak

v1.23 → v1.43 = 21 milestones with tutorial code snippet validation tests. Each milestone's tutorials ship with an in-repo test that executes every code block, so drift between docs and API is caught at merge time.

### 縦深化 pair pattern grid

12 pairs now on record.

| Pair # | Domain | Path | Depth |
|---|---|---|---|
| 1 | Auth | v1.21→v1.22 | 2 |
| 2 | Realtime | v1.13→v1.28 | 2 |
| 3 | Streaming | v1.20→v1.31 | 2 |
| 4 | Database | v1.14→v1.32 | 2 |
| 5 | Payment | v1.14→v1.19→v1.33→v1.41 | 4 |
| 6 | Frontend | v1.16→v1.34 | 2 |
| 7 | Observability | v1.14→v1.17→v1.35→v1.42 | 4 |
| 8 | Search | v1.14→v1.15→v1.36 | 3 |
| 9 | Security | v1.37→v1.39 | 2 |
| 10 | AI/LLM | v1.12→v1.15→v1.38→v1.40 | 4 |
| 11 | Security base | v1.37 | 1 (introduced v1.37) |
| **12** | **Edge / Serverless** | **v1.43 (new base)** | **1** |

## Install

```bash
pnpm add -D @kiwa/edge@^1.2
```

Additive-only. No breaking changes.

## Migration guide

[v1.42 → v1.43 migration guide](https://cardene777.github.io/kiwa/migrations/v1.42-to-v1.43)

## What's next

v1.44+ will introduce new pair bases at ~5-milestone cadence. The next expected III depth for Edge / Serverless is around v1.62±, following the 4-段拡張 pattern established by pair 9-11.
