---
title: "kiwa v1.26 released — Database 深化 (8 axis advanced production db semantics + 3 dogfood app rollout)"
emoji: "🗄️"
type: "tech"
topics: ["oss", "typescript", "database", "postgres", "kiwa"]
published: true
---

# kiwa v1.26 released

v1.26 は kiwa の 16 milestone 目です。 v1.14 (横軸拡張、 `@kiwa-lab/orm` v0.8 で Drizzle / Prisma / Kysely × SQLite / Postgres / MySQL の 3 × 3 provider-backend matrix + testcontainers real driver + `createOrmEnv` + `applyMigrations` + `seedFixtures` primitive を land) を基盤に、 v1.26 は同 primitive の上に **8 axis advanced production db semantics** (replication + cdc + logical-replication + mvcc + rls + connection-pool + partitioning + vector-store) を land。 v0.8 primitive は first-line contract のまま維持 (v0.8 signature 完全維持)、 8 axis pure state-machine helper 40 種は second-line envelope として並走。 `@kiwa-lab/orm` v0.8.0 → v0.9.0 minor bump は 8 axis semantics extension + 3 provider × 3 backend neutral state machine 標準化を反映。 v1.11 以降の連続完遂 15 milestone (release gate → 非決定性 → 時間軸 → 横軸拡張 → AI-LLM 深化 → component 縦軸 → Observability v2 → Blockchain 深化 → Framework 深化 → Streaming 深化 → Auth 深化 → Auth 深化 II → Payment 深化 → Edge / Serverless 深化 → Perf-harness sweep) を受けて、 v1.26 は Database 深化 milestone、 kiwa runtime fixture 34 packages はそのまま維持 (orm 既存 package の minor 拡張)。

## 主な追加

### `@kiwa-lab/orm` v0.9.0 (8 axis advanced production db semantics extension)

v1.14 で land した `createOrmEnv` + `applyMigrations` + `seedFixtures` + testcontainers real driver + Drizzle / Prisma / Kysely × Postgres / MySQL / SQLite 3 × 3 matrix signature を完全維持したまま、 v1.26 は `packages/orm/src/semantics/*` に 40 helper (8 axis × 5 helper) を追加。 各 helper は pure state machine (no adapter / no network) で決定論的、 test / fixture / bench で reproducible。

### 4 rule SSOT

`docs/concepts/db-advanced-testing.md` は kiwa db 全 semantics の 4 rule を単一 SSOT 化。

1. **1 axis = 1 file** — `replication.ts` / `cdc.ts` / `logical-replication.ts` / `mvcc.ts` / `rls.ts` / `connection-pool.ts` / `partitioning.ts` / `vector-store.ts` の 8 file、 axis 越境の import 禁止。 axis 追加は new file 追加のみで既存 axis は変更されない、 v0.8 API との additive-only 契約を構造的に保証。
2. **1 axis = 5 helper** — `create{Axis}Session` (state 初期化) + 4 transition helper (`{axis}Op1` / `Op2` / `Op3` / `Op4`) の shape で統一。 例 `createReplicationSession` + `primaryWrite` + `markReplicaLagged` + `startFailover` + `promoteReplica`。 shape 統一で fuzzer / snapshot test / dialect fanout が axis 越しに共通 pattern で走行。
3. **neutral events over dialect events** — Postgres wal2json / MySQL row-based binlog / SQLite trigger 経由の native event 名は dialect layer に閉じ込め、 semantics 層は `primary-write` / `replica-lagged` / `failover-started` / `promoted` の neutral event 名で assert。 dialect 越しの test 移植性を保証。
4. **provider overlay is translation-only** — `Drizzle` / `Prisma` / `Kysely` の provider overlay は event 名の translation にのみ介入、 behavior 変更禁止。 Prisma のみ `pool.acquired` / `pool.wait-queued` / `mvcc.snapshot-taken` を `prisma.*` に translate、 それ以外 event と drizzle / kysely provider は backend dialect が直接勝つ。

### v1.26-1 8 axis advanced db semantics (Issue #940)

`@kiwa-lab/orm` v0.9 の 8 axis 完全一覧。

| axis | helpers | neutral events | 相当機能 |
|---|---|---|---|
| `replication` | createReplicationSession / primaryWrite / markReplicaLagged / startFailover / promoteReplica | primary-write / replica-lagged / failover-started / promoted | streaming replication + read replica lag + failover + promoted replica |
| `cdc` | createCdcSession / decodeEvent / appendOutbox / markEventOrdered / confirmDelivery | decoded / outbox-appended / event-ordered / at-least-once-delivered | logical decoding + wal2json / Debezium outbox + LSN 順序 + at-least-once |
| `logical-replication` | createLogicalRepSession / createPublication / syncSubscription / resolveConflict / heartbeat | publication-created / subscription-synced / conflict-resolved / heartbeat | publication + subscription + conflict resolution + heartbeat |
| `mvcc` | createMvccSession / takeSnapshot / abortSerializable / blockPhantom / detectDeadlock | snapshot-taken / serializable-aborted / phantom-blocked / deadlock-detected | snapshot isolation + serializable + phantom read + deadlock |
| `rls` | createRlsSession / installPolicy / filterTenant / bypassRls / logAudit | policy-installed / tenant-isolated / bypass-used / audit-logged | row-level security + tenant isolation + bypass_rls + audit |
| `connection-pool` | createPoolSession / acquire / waitInQueue / idleTimeout / statementTimeout | acquired / wait-queued / idle-timeout / statement-timeout | max_connections + idle_timeout + statement_timeout + wait queue |
| `partitioning` | createPartitioningSession / declarePartition / prunePartitions / partitionWiseJoin / routeInsert | declared / pruned / wise-joined / route-selected | declarative partitioning + pruning + wise-join + range/list/hash routing |
| `vector-store` | createVectorStoreSession / buildIndex / knnSearch / hybridSearch / computeDistance | indexed / knn-searched / hybrid-searched / distance-computed | pgvector + IVFFlat + HNSW + cosine/L2/inner-product + hybrid |

3 provider (Drizzle / Prisma / Kysely) × 3 backend (Postgres / MySQL / SQLite) × 32 neutral event = 288 dialect entry を静的 table として wiring、 `collectFidelityCoverage({ providers, backends })` で 3 × 3 × 8 = 72 row grid が collect 可能。 SQLite は server-only axes (streaming replication / wal2json CDC / statement_timeout etc.) の dialect entry を持たず、 `backendEventName(backend, neutral, provider?)` 経由で neutral 名 fallback、 downstream fanout tests は SQLite backend でも認識可能な neutral event を受取れる。

```ts
import {
  createCdcSession,
  decodeEvent,
  appendOutbox,
  markEventOrdered,
  confirmDelivery,
} from '@kiwa-lab/orm';

const session = createCdcSession({ backend: 'postgres', provider: 'drizzle' });
const decoded = decodeEvent(session, { lsn: '0/16B62A0', op: 'INSERT', schema: 'public', table: 'orders' });
const withOutbox = appendOutbox(decoded, { destination: 'redis-stream', payload: { orderId: 42 } });
const ordered = markEventOrdered(withOutbox, { lsn: '0/16B62A0' });
const delivered = confirmDelivery(ordered, { attempt: 1, verdict: 'delivered' });

// pure state transition、 adapter 依存なし
// delivered.events = ['decoded', 'outbox-appended', 'event-ordered', 'at-least-once-delivered']
```

222 test 追加で `semantics/` statement 99.54 % / branch 95.61 % / function 100 % coverage 達成、 orm package 全 250 test all PASS (28 existing + 222 new)。

### v1.26-2 dogfood-postgres-cdc-outbox-app (Issue #941)

Postgres 16 logical replication + Debezium-style outbox pattern + Redis Streams consumer + at-least-once + idempotent + backpressure の full journey を実装。

- `src/outbox/index.ts` (Debezium-style outbox + LSN monotonic seal、 orm CDC session wrap)
- `src/cdc/index.ts` (pickup + logical-replication publication run)
- `src/consumer/index.ts` (Redis Streams consumer group + idempotent set + backpressure)
- `src/adapters/{interface,mock,real}.ts` (5-op adapter contract + orm-semantics-backed mock + `POSTGRES_BOOTSTRAP` env-gated real)
- `src/flows/{postgres-flows,fidelity}.ts` (higher-level flows + 7 axis quality-metrics release-gate report)

adapter は 5-op provider-neutral surface (`driveOutbox` / `driveCdcPickup` / `driveReplication` / `driveAtLeastOnce` / `emitFidelity`)、 mock は v0.9 の CDC + logical-replication + replication + connection-pool session を backing、 real は `POSTGRES_BOOTSTRAP` env が set された時のみ発火 (未設定なら `POSTGRES_ENV_MISSING` fidelity 記録)。 28 vitest + 1 perf spec + 7 軸 release gate PASS。

### v1.26-3 dogfood-mysql-rls-tenant-app (Issue #942)

Nuxt 3 + Prisma + MySQL 8 の row-level security + tenant_id auto-injection + cross-tenant refuse + `bypass_rls` role window + tamper-evident chain-hash audit log を実装。 v0.9 RLS axis が promise する 4 pattern を全 cover。

1. Tenant_id 自動 injection on write (RLS gate + policy install + filter)
2. Cross-tenant read refuse (`CROSS_TENANT_REFUSED` error + audit entry with `allowed=false`)
3. `bypass_rls` role window (`withBypass` opens single-shot window、 re-arms after callback、 pairs open+close entries in the audit trail)
4. Tamper-evident audit log (chain-hash `sha256(prev || entryJson)` で mid-insertion が全 downstream hash を破壊、 `verify()` が first tamper index を返す)

5-op adapter (`driveTenantInjection` / `driveCrossTenantRefuse` / `driveBypassAudit` / `driveAuditIntegrity` / `emitFidelity`)、 mock は orm RLS session backing、 real は `MYSQL_KEY` env-gated。 34 vitest + 7 軸 release gate PASS。

### v1.26-4 dogfood-vector-search-app (Issue #943)

Postgres 16 pgvector IVFFlat + HNSW index + cosine / L2 distance + hybrid semantic + BM25 keyword search + FNV-folded cacheKey embedding cache + on-demand re-index を実装。 v0.9 vector-store axis が promise する 4 pattern を全 cover。

1. IVFFlat / HNSW index build with per-store dimension guard (first-upsert が dim を capture、 後続 write は 対して enforce)
2. k-NN semantic search with cosine + L2 distance (top-`k` を決定論的に ranked)
3. Hybrid semantic + BM25 keyword search with `vectorWeight` in `[0, 1]` (tie は document id 昇順で break)
4. Embedding cache with on-demand re-index (bounded LRU-ish + hit-rate metrics + invalidation window)

5-op adapter (`driveIndexBuild` / `driveSemanticSearch` / `driveHybridSearch` / `driveCacheHitRate` / `emitFidelity`)、 mock は orm vector-store session + in-memory store + cache backing、 real は `VECTOR_KEY` env-gated (DSN probe + `REAL_ADAPTER_NOT_IMPLEMENTED` for higher-level ops)。 41 vitest + 7 軸 release gate PASS。

### v1.26-5 docs 補強 (Issue #944)

docs は 3 pillar + 1 concept + 1 migration + 1 snippet validation を追加。

- **tutorial 47** (`docs/tutorials/47-postgres-cdc-outbox.md`) ... cdc axis walkthrough、 空 project → `@kiwa-lab/orm@^0.9` install → `createCdcSession` + `decodeEvent` + `appendOutbox` + `markEventOrdered` + `confirmDelivery` の 7 step 完走 recipe。
- **tutorial 48** (`docs/tutorials/48-mysql-rls-tenant.md`) ... rls axis walkthrough、 `createRlsSession` + `installPolicy` + `filterTenant` + `bypassRls` + `logAudit` の 7 step 完走 recipe + tenant isolation + chain-hash audit log。
- **tutorial 49** (`docs/tutorials/49-vector-search-pgvector.md`) ... vector-store axis walkthrough、 `createVectorStoreSession` + `buildIndex` + `knnSearch` + `hybridSearch` + `computeDistance` の 8 step 完走 recipe + IVFFlat / HNSW + hybrid search。
- **concept doc** (`docs/concepts/db-advanced-testing.md`) ... 8 axis SSOT + Rule 1-4 + provider × backend fidelity table + 3 dogfood app matrix。
- **migration guide** (`docs/migrations/v1.25-to-v1.26.md`) ... additive-only、 breaking change 0、 v0.8 API 全 signature 完全維持、 v0.9 の 40 helper + 8 axis session ctor は opt-in。
- **snippet validation** (`packages/orm/tests/docs-tutorial-v1.26.test.ts`) ... tutorial 47-49 の全 code snippet を実 `@kiwa-lab/orm` v0.9 API import + execute + assertion で走査、 32 test で drift を検知 (`docs-tutorial-v1.21` から `docs-tutorial-v1.25` と同じ pattern)。

### v1.26-6 publish (本 PR)

- `plugin.json` v1.25.0 → v1.26.0 + description v1.25 → v1.26 marker + 39 db-focused keyword 追加 (`db-advanced-testing` / `advanced-db-semantics` / `8-axis-db` / `replication` / `streaming-replication` / `read-replica` / `failover` / `cdc` / `logical-decoding` / `wal2json` / `debezium` / `outbox-pattern` / `logical-replication` / `publication-subscription` / `conflict-resolution` / `mvcc` / `snapshot-isolation` / `serializable` / `phantom-read` / `deadlock` / `row-level-security` / `rls` / `tenant-isolation` / `bypass-rls` / `audit-log` / `connection-pool` / `idle-timeout` / `statement-timeout` / `partitioning` / `partition-pruning` / `partition-wise-join` / `vector-store` / `pgvector` / `ivfflat` / `hnsw` / `hybrid-search` / `bm25` / `embedding-cache` 他)。
- README `Roadmap ✅ v1.26` row を追加、 6 sub-Issue #940-#945 全 link + `6/6 resolved` copy。
- 4 announcement file (gh-discussions + x-thread-en + x-thread-ja + zenn-article) 新規追加。
- `tests/release-smoke/tests/v1-26-publish.test.ts` (7 axis publish artefact invariant) 新規 + `v1-25-publish.test.ts` 削除。
- `tests/docs-site-e2e/site.spec.ts` に `V1_26_PAGES` (5 page: tutorial 47 + tutorial 48 + tutorial 49 + concept `db-advanced-testing` + migration `v1.25-to-v1.26`、 nav + search widget mount check) 追加。
- release script filter に `@kiwa-lab/orm` が **既に含まれている** (v1.14 land 時から build + publish 両 filter に存在) ため追加変更なし、 但し v1-26 smoke test は filter presence を invariant として assert する。

## Numbers

- **6 sub-Issue 解決** (#940-#945)
- **6 PR merge** (v1.26-1 + v1.26-2 + v1.26-3 + v1.26-4 + v1.26-5 + 本 publish PR)
- **1 npm minor bump** (`@kiwa-lab/orm` v0.8.0 → v0.9.0) — kiwa runtime fixture 34 packages 維持
- **222 semantics behavior test 新規** (semantics/ statement 99.54 % / branch 95.61 % / function 100 % coverage)
- **103 dogfood vitest 新規** (postgres-cdc-outbox 28 + mysql-rls-tenant 34 + vector-search 41)
- **288 dialect entry** (3 provider × 3 backend × 32 neutral event) — 8 axis wiring 全 exhaustive
- **72 row fidelity grid** (3 provider × 3 backend × 8 axis) via `collectFidelityCoverage()`

## なぜ 8 axis (replication + RLS の 2-3 axis pilot ではなく)

advanced db testing には 2-3 axis pilot で捕捉不能な 3 失敗 mode がある、 pilot suite を幾ら厚くしても。

- **cross-backend semantics drift** — Postgres logical replication と MySQL row-based binlog は同じ問題を全く異なる wire format で解く。 Postgres 側の `wal2json` にしか反応しない fake は Postgres 全 test に pass しつつ MySQL 全 test を silent に破壊する。 8 axis SSOT は neutral event 名 (`primary-write` / `replica-lagged` / `failover-started` / `promoted`) を pin、 downstream code は transition に対して assert、 dialect-specific bytes に対しては assert しない。
- **terminal state drift** — 全 state machine には terminal state (revoked mandate / exhausted retry / `bypass_rls` closed window / `POSTGRES_ENV_MISSING` fidelity divergence) が存在。 pilot axis 側だけ terminal guard を test すると、 後続 axis は re-entry を silent に受入れる。 40 helper × 8 axis structure は全 terminal guard を `packages/orm/tests/*.spec.ts` に test として存在強制。
- **provider overlay drift** — Prisma は `prisma.pool.acquired` を emit、 Drizzle は `pool.acquired`、 Kysely は `pool.acquired`。 overlay は 3 event を同 neutral name に translate。 Drizzle + Prisma のみ wiring した場合、 Kysely user は silent gap に落ちる。 provider overlay は 3 × 32 = 96 entry table (`collectFidelityCoverage()` grid として export)、 release gate は全 cell 埋まりを require。

4 rule (`docs/concepts/db-advanced-testing.md`) は kiwa db suite を package 越し・ milestone 越し・ fork 越しで比較可能にする最小 set。

## 16 milestone 連続完遂

v1.11 (release gate) → v1.12 (非決定性) → v1.13 (時間軸) → v1.14 (横軸拡張) → v1.15 (AI-LLM 深化) → v1.16 (component 縦軸) → v1.17 (Observability v2) → v1.18 (Blockchain 深化) → v1.19 (Framework 深化) → v1.20 (Streaming 深化) → v1.21 (Auth 深化) → v1.22 (Auth 深化 II) → v1.23 (Payment 深化) → v1.24 (Edge / Serverless 深化) → v1.25 (Perf-harness sweep) → **v1.26 (Database 深化)**。 v1.11 以降の全 milestone で 6 sub-Issue を完遂。

## v2.0 candidates

- Multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- Desktop (Electron / Tauri) + mobile (React Native / Expo) adapters
- Coverage 100% milestone
- Cache / Data 深化 (Dragonfly / Materialize / Neon)
- L2 深化 (Base / Arbitrum / Optimism / Scroll block-space fidelity)
- ZK 深化 (Noir / Circom / RISC Zero test harness)
- IoT 深化 (MQTT / CoAP / LWM2M)
- DB 深化 II (SurrealDB / EdgeDB / Turso / CockroachDB / TimescaleDB / QuestDB)
- Perf-harness sweep II — real machine baseline (macOS ARM64 + Linux x86_64 + Windows x86_64 3 hardware matrix + CI reproducibility harness)

Feedback welcome on which of these should land next. どれから land するかの投票は GitHub Discussions で募集中。
