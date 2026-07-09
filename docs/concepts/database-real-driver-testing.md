# Database real-driver testing — 16 axis × 3 provider = 48 row grid + testcontainers pattern (SSOT)

kiwa's v1.26 orm work covered the **8 base semantics** (replication / CDC / logical replication / MVCC / RLS / connection pool / partitioning / vector store) as unified mocks for Postgres + MySQL + SQLite — the `docs/concepts/db-advanced-testing.md` doc is the SSOT for those 8 axes. v1.32 adds **8 advanced axes on top of that base** — the ones production teams hit once their mock-only suite is green but real database behavior (logical streaming re-reads, cluster certification conflicts, WAL checkpoint pauses, FTS5 tokenizer stopword surprises) starts showing up in incident reports. This concept doc is the SSOT for those 8 axes; the tutorials (61-63) and dogfood apps (v1.32-2/3/4) are the concrete implementations.

## The 16-axis grid

The 8 base axes (v0.9) + 8 advanced axes (v0.10) form a 16-axis grid. The base axes cover "does replication happen at all"; the advanced axes cover "how does replication break under real load".

| # | Axis | Real-world failure it catches | v0.10 API |
|---|---|---|---|
| 1 | `replication` | The replica fell behind and never caught up | `createReplicationSession` (v0.9) |
| 2 | `cdc` | The outbox event was decoded twice | `createCdcSession` (v0.9) |
| 3 | `logical-replication` | The publication + subscription pair went out of sync | `createLogicalRepSession` (v0.9) |
| 4 | `mvcc` | A serializable transaction aborted spuriously | `createMvccSession` (v0.9) |
| 5 | `rls` | The tenant filter did not apply to a bypass role | `createRlsSession` (v0.9) |
| 6 | `connection-pool` | The pool exhausted under a burst and refused connections | `createPoolSession` (v0.9) |
| 7 | `partitioning` | The partition pruner picked the wrong partition | `createPartitioningSession` (v0.9) |
| 8 | `vector-store` | The HNSW index returned stale results after a bulk insert | `createVectorStoreSession` (v0.9) |
| 9 | `logical-replication-advanced` | The subscriber restarted and re-read 40 MB of WAL | `createLogicalReplicationAdvancedSession` |
| 10 | `mvcc-advanced` | XID wraparound warning fired at 200M without freeze running | `createMvccAdvancedSession` |
| 11 | `mysql-cluster` | The write got certified on 2 nodes but rejected on the 3rd | `createMysqlClusterSession` |
| 12 | `binlog` | A GTID gap accumulated after a mixed-format binlog run | `createBinlogSession` |
| 13 | `sqlite-wal` | The WAL file kept growing until the mount ran out of space | `createSqliteWalSession` |
| 14 | `fts5` | The porter tokenizer silently dropped a search term as a stopword | `createFts5Session` |
| 15 | `txn-isolation` | A phantom read leaked through a read-committed transaction | `createTxnIsolationSession` |
| 16 | `pool-advanced` | The pool drain finished but 3 connections were still active | `createPoolAdvancedSession` |

Each axis has 3 shapes — a mock-only path (fast inner loop, ms scale), a real-driver path (`KIWA_MODE=real` + backend env, testcontainers, seconds scale), and a fidelity assertion that the two produce the same output. Tutorial 61 covers axis 9 in depth, tutorial 62 covers axis 11, tutorial 63 covers axes 13 + 14.

## The 3-provider × 3-backend × 16-axis = 144 cell fidelity grid

Every axis emits both a `neutralEvent` (provider-neutral name) and a `backendEvent` (backend-specific dialect). The `collectFidelityCoverage()` helper walks the 144-row grid (3 provider × 3 backend × 16 axis) and returns the full mapping. This is the data structure downstream release-gate checks read to assert "every axis has a dialect entry".

```ts
import { collectFidelityCoverage } from '@kiwa-lab/orm';

const coverage = collectFidelityCoverage({
  providers: ['drizzle', 'prisma', 'kysely'],
  backends: ['postgres', 'mysql', 'sqlite'],
});

console.log(coverage.rows.length); // 144
console.log(coverage.axes.length); // 16
```

Not every dialect entry lands on every backend — server-only axes (streaming replication, CDC, group replication) have no SQLite analogue and fall back to the neutral name via `backendEventName()`. This is by design — a test iterating the grid can assert on the neutral name for portability and on the backend-specific dialect for backend-native telemetry.

## Real-driver env-gate contract

`KIWA_MODE=real` flips on the real-driver assertions. The required env per backend.

- **Postgres** axes (`logical-replication-advanced` / `mvcc-advanced`) → `POSTGRES_KEY`
- **MySQL** axes (`mysql-cluster` / `binlog`) → `MYSQL_KEY`
- **SQLite** axes (`sqlite-wal` / `fts5`) → `SQLITE_KEY`
- **Cross-backend** axes (`txn-isolation` / `pool-advanced`) → any of the 3 keys (matches the backend under test)

A test that respects the contract runs the mock path unconditionally and the real-driver path only when both `KIWA_MODE=real` and the required key are present. That means CI stays cheap by default (mock only), the nightly job flips both envs (real driver + testcontainers), and the fidelity harness ties the two together.

## The testcontainers pattern

The 3 dogfood app v2 upgrades (v1.32-2 / v1.32-3 / v1.32-4) each expose a `pnpm test:real` command that flips `KIWA_MODE=real` and spins up the backend under testcontainers.

- `examples/dogfood-postgres-cdc-outbox-app` v2 — Postgres 16 + logical replication (publication + subscription + slot + `wal_level = logical`) + pgvector + `pg_replication_origin_progress` telemetry + Playwright e2e that walks the `startLogicalStreaming` → `trackReplicationOrigin` → `confirmTwoSafeCommit` → `syncCascadedSubscription` state machine against the real broker.
- `examples/dogfood-mysql-rls-tenant-app` v2 — MySQL 8 + group replication (single-primary + member weight + certification + `performance_schema.replication_group_member_stats.COUNT_CONFLICTS_DETECTED`) + Router R/W split + `INFORMATION_SCHEMA.INNODB_TRX` telemetry + Playwright e2e that walks the `joinClusterMember` → `electClusterPrimary` → `detectClusterConflict` → `leaveClusterMember` state machine against the real cluster.
- `examples/dogfood-sqlite-wal-fts-app` — libsql / SQLite testcontainer + WAL mode (`PRAGMA journal_mode = WAL`) + FTS5 virtual table (`unicode61` / `porter` / `trigram` tokenizers) + Bun edge runtime + Playwright e2e that walks the `switchJournalMode` → `crossWalSizeThreshold` → `triggerWalCheckpoint` → `mapSharedMemory` state machine and the `createFts5VirtualTable` → `tokenizeFts5Document` → `matchFts5Query` → `inspectFts5Vocab` state machine against the real DB file.

The pattern each v2 app follows.

1. Keep the v1 mock-only path (`pnpm test`) green — the fast inner loop stays sub-second.
2. Add a `pnpm test:real` command that requires the backend env (`POSTGRES_KEY` / `MYSQL_KEY` / `SQLITE_KEY`) and pulls the testcontainers image.
3. Run the same fidelity-harness assertions against the real driver; failure means "the mock diverged from real behavior" — the mock gets the fix.
4. Route the e2e through Playwright when the flow crosses UI boundaries (e.g., the tenant admin UI in the RLS app or the vector search UI in the WAL+FTS app).

## What each of the 8 advanced axes catches

### 9. `logical-replication-advanced` — pgoutput + origin + two-safe + cascade

The `LogicalReplicationAdvancedState` state machine (`idle` → `streaming` → `origin-tracked` → `two-safe-confirmed` → `cascade-synced`) covers 4 real Postgres primitives — `START_REPLICATION` protocol handshake, `pg_replication_origin_advance` progress tracking, `synchronous_commit = remote_apply` two-safe confirmation, cascaded subscription topology. The classic bug caught is "the subscriber restarted and re-read 40 MB of WAL" — persisting `confirmed_flush_lsn` on shutdown and passing it as `startLsn` on restart is what makes recovery cheap, and the mock enforces `startLsn > 0`.

### 10. `mvcc-advanced` — tuple visibility + bloat + HOT chains + XID wraparound

The `MvccAdvancedState` state machine (`idle` → `visibility-checked` → `bloat-measured` → `hot-updated` → `xid-wraparound-detected`) covers 4 Postgres MVCC internals — heap tuple `xmin` / `xmax` visibility against a snapshot, `pg_stat_user_tables.n_dead_tup / n_live_tup` bloat measurement, HOT (Heap Only Tuple) update chain length, XID wraparound warning threshold. The classic bug caught is "vacuum did not run for 2 weeks and the XID age hit 200M" — the mock takes `warningAge` as a parameter so tests can assert on wraparound detection deterministically.

### 11. `mysql-cluster` — group replication membership + election + conflict + leave

The `MysqlClusterState` state machine (`empty` → `joined` → `primary-elected` → `conflict-detected` → `member-left`) covers 4 MySQL 8 group replication primitives — `START GROUP_REPLICATION` with `group_replication_member_weight`, single-primary election among joined members, certification conflict on overlapping writes, `STOP GROUP_REPLICATION` shrinking the group. The classic bug caught is "the write got certified on 2 nodes but rejected on the 3rd" — the mock's `detectClusterConflict` increments `conflictCount` on every conflict, letting a test assert on certification rate regressions.

### 12. `binlog` — position + GTID + format + gap

The `BinlogState` state machine (`idle` → `positioned` → `gtid-updated` → `format-negotiated` → `gap-detected`) covers 4 MySQL binlog primitives — `SHOW MASTER STATUS` file+position, GTID set maintenance (`gtid_executed`), `binlog_format = ROW / STATEMENT / MIXED` negotiation, GTID gap detection (a missing GTID in the executed set). The classic bug caught is "a mixed-format binlog run created a GTID gap" — the mock's `updateGtidSet` rejects duplicate GTIDs and the `detectGtidGap` requires the expected GTID to be absent, letting a test assert on gap detection deterministically.

### 13. `sqlite-wal` — journal_mode + threshold + checkpoint + shared memory

The `SqliteWalState` state machine (`rollback-journal` → `wal-enabled` → `threshold-crossed` → `checkpointed` → `shared-memory-mapped`) covers 4 SQLite WAL primitives — `PRAGMA journal_mode = WAL` switch, `wal_autocheckpoint` size threshold, `PRAGMA wal_checkpoint(TRUNCATE)` copy+truncate, `-shm` wal-index memory mapping. The classic bug caught is "the WAL file kept growing until the mount ran out of space" — the mock's `crossWalSizeThreshold` requires `walSizeBytes > thresholdBytes` so a test that claims a threshold cross with equal sizes is a bug.

### 14. `fts5` — virtual table + tokenizer + MATCH + vocab

The `Fts5State` state machine (`empty` → `virtual-table-created` → `tokenized` → `matched` → `vocab-inspected`) covers 4 SQLite FTS5 primitives — `CREATE VIRTUAL TABLE ... USING fts5(...)`, tokenizer choice (`unicode61` / `porter` / `trigram`), `MATCH` queries with BM25 rank, `fts5vocab` term inspection. The classic bug caught is "the porter tokenizer silently dropped a search term as a stopword" — the mock's `inspectFts5Vocab` requires `occurrences >= 0`, letting a test assert on stopword drops via `occurrences === 0`.

### 15. `txn-isolation` — level + dirty read + non-repeatable + phantom

The `TxnIsolationState` state machine (`idle` → `level-set` → `dirty-read-blocked` → `non-repeatable-read-blocked` → `phantom-read-blocked`) covers the 4 SQL isolation levels (`READ UNCOMMITTED` → `READ COMMITTED` → `REPEATABLE READ` → `SERIALIZABLE`) and the 3 ANSI phenomena they block. The mock enforces the containment — `blockPhantomRead` requires `blockNonRepeatableRead` to have run, `blockNonRepeatableRead` requires `blockDirtyRead`, and only `serializable` blocks phantoms. The classic bug caught is "a phantom read leaked through a read-committed transaction" — a test that asserts on `blockPhantomRead` under `read-committed` fails with the exact error message the mock emits.

### 16. `pool-advanced` — health check + warmup + drain + metrics

The `PoolAdvancedState` state machine (`cold` → `healthy` → `warmed-up` → `draining` → `metrics-exported`) covers 4 connection pool primitives — health check (PgBouncer `server_check` / ProxySQL `mysql-monitor_ping_interval_server_max`), warm-up (`minWarmConnections`), graceful drain (`deadlineMs` before force-close), metrics export (`active` / `idle` / `waiting` counts). The classic bug caught is "the pool drain finished but 3 connections were still active" — the mock's `drainPoolGracefully` resets `activeConnections` to 0 and the `exportPoolMetrics` requires non-negative counters.

## How this ties into the 13-axis release gate

v1.32 does not add a 14th release-gate axis. The 8 advanced axes gate the orm package's own tests (via `pnpm --filter @kiwa-lab/orm test`) but do not surface as a per-package `@kiwa-lab/quality-metrics` axis. The reasoning — the fidelity harness is backend-shape-specific, and a package that does not use a database has nothing to assert on. When a future milestone adds a `backend.fidelity` axis that describes "which backends this package's tests hit," it will slot into the 13-axis release gate as the 14th; v1.32 keeps the axis count at 13.

## SSOT boundaries

- The 8 base semantics (replication / CDC / logical replication / MVCC / RLS / connection pool / partitioning / vector store) live in `docs/concepts/db-advanced-testing.md`. v1.32 does not modify that doc.
- The 8 advanced axes live in this doc. Tutorials 61-63 and the migration guide (v1.31 → v1.32) link back here for the axis SSOT.
- The 3-provider × 3-backend × 16-axis grid is the harness's data structure. The `collectFidelityCoverage()` implementation in `packages/orm/src/semantics/fidelity.ts` is the code SSOT — this doc's grid table is derived from that code.
- The `KIWA_MODE=real` env-gate contract is shared with the v1.22 real-driver testing tutorial (auth adapters + Keycloak) and the v1.31 streaming real-driver concept doc. All three use the same pattern; the database axes just add backend-specific `_KEY` envs.
