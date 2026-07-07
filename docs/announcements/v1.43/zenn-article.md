# kiwa v1.43 リリース — Edge / Serverless 深化 milestone + 縦深化 pair 第 12 新規 base pair 導入

## 概要

kiwa v1.43 をリリースしました。 **12 番目の縦深化 pair を新規導入** — Edge / Serverless base at v1.43、 v1.37 Security 以来 5 milestone ぶりの新規 pair base。 3 例目 depth-4 record 達成 (v1.40 AI/LLM + v1.41 Payment + v1.42 Observability) 後の 5-milestone new-base cadence が完成しました。

## 何が変わったか

### `@kiwa-test/edge` v1.2.0 (v1.1.0 → v1.2.0 minor bump)

既存の 8-axis base の上に、 8 個の advanced axis を追加しました。

- **cold-start** — Serverless 関数の warm/cold path + provisioned concurrency をモデル化。 `startColdStartPool` + `invokeColdStart` + `preWarmInstance` + `evictExpired`。
- **middleware-chain** — Edge middleware pipeline (auth → rewrite → cache → transform + short-circuit)。 `startMiddlewareChain` + `enterMiddleware` + `rewriteRequest` + `shortCircuit` + `completeMiddleware`。
- **kv-eventual-consistency** — Read-your-writes + monotonic-reads の consistency 検知。 `startKvConsistency` + `recordWriteQuorum` + `observeRead` + `forceConvergence`。
- **r2-multipart** — Resumable multipart upload with per-part checksum verification。 `initiateMultipart` + `uploadPart` + `verifyChecksum` + `completeMultipart`。
- **d1-read-replica** — Primary-replica DB routing with lag detection + failover。 `startD1` + `writeToPrimary` + `readFromReplica` + `reportLag`。
- **do-state-migration** — DurableObject schema versioning + zero-downtime rollout + rollback。 `initiateMigration` + `bumpSchema` + `migrateInstance` + `completeRollout` + `rollbackMigration`。
- **websocket-hibernation** — Cloudflare Workers / Vercel Edge の WebSocket hibernation model。 `startHibernationSession` + `hibernate` + `resume` + `restoreState` + `completeReconnect`。
- **global-routing** — Anycast + geo + latency-based failover routing。 `startRoutingPool` + `receiveAnycast` + `matchGeo` + `selectByLatency` + `markUnhealthy`。

3 platform (cloudflare / vercel / deno) × 16 axis (8 v0.2 base + 8 v1.2 advanced) = 48 cell の fidelity grid。

### 3 dogfood app を新規追加

- `examples/dogfood-edge-serverless-cold-start-app` — 64 tests。 cold / warm / provisioned 3 axis × 3 platform mock/real adapter + fidelity harness。
- `examples/dogfood-edge-durable-object-migration-app` — 60 tests。 schema-bump / data-migrate / rollout 3 axis × 3 platform mock/real adapter + fidelity harness。
- `examples/dogfood-edge-global-routing-app` — 60 tests。 anycast-routing / geo-matching / replica-affinity 3 axis × 3 platform mock/real adapter + fidelity harness。

各 dogfood は real driver env-gate (`KIWA_MODE=real` + `EDGE_*_STACK_READY=1` + `KIWA_EDGE_*_URL`) を持ち、 fidelity harness が実 Cloudflare Workers + Vercel Edge + AWS Lambda + Deno Deploy backend に対して opt-in で走査可能。

### 3 tutorial を新規追加

- **[Tutorial 94 — Serverless cold-start](https://cardene777.github.io/kiwa/tutorials/94-serverless-cold-start)** — cold path + warm pool + provisioned concurrency + latency observability walkthrough。
- **[Tutorial 95 — DurableObject state migration](https://cardene777.github.io/kiwa/tutorials/95-durable-object-migration)** — schema versioning + data migrate + zero-downtime rollout + rollback walkthrough。
- **[Tutorial 96 — Global routing](https://cardene777.github.io/kiwa/tutorials/96-global-routing)** — Anycast + geo matching + latency-based failover + D1 read replica affinity walkthrough。

## 21 milestone 連続 snippet validation streak 達成

v1.23 から v1.43 まで、 21 milestone 連続で tutorial code snippet の validation test を kiwa monorepo 内に配置しています。 docs と API の drift を merge 時に自動検知する仕組みが、 21 milestone 続く streak になりました。

## 縦深化 pair pattern grid

現在 12 pair が記録されています。

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
| 11 | Security base | v1.37 | 1 |
| **12** | **Edge / Serverless** | **v1.43 (new base)** | **1** |

## インストール

```bash
pnpm add -D @kiwa-test/edge@^1.2
```

Additive-only。 breaking change はありません。

## Migration guide

[v1.42 → v1.43 migration guide](https://cardene777.github.io/kiwa/migrations/v1.42-to-v1.43)

## 次に何が来るか

v1.44+ で 5-milestone cadence で新規 pair base の導入が続きます。 Edge / Serverless の次の III 深化 target は v1.62 前後 (4 段拡張 pattern の III 深化 = base +19 milestone)。 pair 9-11 が確立した pattern に沿った深化を予定しています。
