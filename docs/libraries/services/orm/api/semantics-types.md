---
title: "@kiwa-lab/orm semantics-types の API 契約"
---

# <code v-pre>@kiwa-lab/orm</code> <code v-pre>semantics-types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>backendEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/types.ts#L362) <code v-pre>packages/orm/src/semantics/types.ts</code>

Translate a neutral event name to the backend dialect. Optional provider argument applies a per-ORM overlay on top of the backend dialect (used for Prisma). Falls back to the neutral name if the backend has no specific dialect entry — this makes the map partial-safe without silent typos.

```ts
export declare function backendEventName(backend: OrmBackend, neutral: NeutralEventName, provider?: OrmProvider): string;
```

### 型

#### <code v-pre>AxisStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/types.ts#L380) <code v-pre>packages/orm/src/semantics/types.ts</code>

Axis result envelope returned by every state-machine step. ORM semantics are pure helpers (no adapters); the envelope surfaces the next state transition metadata so tests can drive the next call without re-reading runtime-specific telemetry.

```ts
export interface AxisStep<TState> {
    neutralEvent: NeutralEventName;
    backendEvent: string;
    state: TState;
    provider: OrmProvider;
    backend: OrmBackend;
    metadata: Record<string, string | number | boolean>;
}
```

#### <code v-pre>NeutralEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/types.ts#L44) <code v-pre>packages/orm/src/semantics/types.ts</code>

Platform-neutral event names used inside the axis helpers. Real backends expose different string ids — Postgres `wal_sender.progress`, MySQL `binlog.dump_gtid`, SQLite `session.diff`. The {@link backendEventName} map handles the translation. Tests can assert on the neutral name via `step.neutralEvent` or on the backend-specific one via `step.backendEvent`.

```ts
export type NeutralEventName = 'replication.primary-write' | 'replication.replica-lagged' | 'replication.failover-started' | 'replication.promoted' | 'cdc.decoded' | 'cdc.outbox-appended' | 'cdc.event-ordered' | 'cdc.at-least-once-delivered' | 'logical.publication-created' | 'logical.subscription-synced' | 'logical.conflict-resolved' | 'logical.heartbeat' | 'mvcc.snapshot-taken' | 'mvcc.serializable-aborted' | 'mvcc.phantom-blocked' | 'mvcc.deadlock-detected' | 'rls.policy-installed' | 'rls.tenant-isolated' | 'rls.bypass-used' | 'rls.audit-logged' | 'pool.acquired' | 'pool.idle-timeout' | 'pool.statement-timeout' | 'pool.wait-queued' | 'partition.declared' | 'partition.pruned' | 'partition.wise-joined' | 'partition.route-selected' | 'vector.indexed' | 'vector.knn-searched' | 'vector.hybrid-searched' | 'vector.distance-computed' | 'logical-advanced.streaming-started' | 'logical-advanced.origin-tracked' | 'logical-advanced.two-safe-confirmed' | 'logical-advanced.cascade-synced' | 'mvcc-advanced.tuple-visibility-checked' | 'mvcc-advanced.bloat-measured' | 'mvcc-advanced.hot-updated' | 'mvcc-advanced.xid-wraparound-detected' | 'cluster.member-joined' | 'cluster.primary-elected' | 'cluster.conflict-detected' | 'cluster.member-left' | 'binlog.position-advanced' | 'binlog.gtid-set-updated' | 'binlog.format-negotiated' | 'binlog.gap-detected' | 'wal.checkpoint-triggered' | 'wal.size-threshold-crossed' | 'wal.shared-memory-mapped' | 'wal.journal-mode-switched' | 'fts5.virtual-table-created' | 'fts5.tokenized' | 'fts5.matched' | 'fts5.vocab-inspected' | 'txn.level-set' | 'txn.dirty-read-blocked' | 'txn.non-repeatable-read-blocked' | 'txn.phantom-read-blocked' | 'pool-advanced.health-checked' | 'pool-advanced.warmed-up' | 'pool-advanced.drained' | 'pool-advanced.metrics-exported' | 'pglr.publication-created' | 'pglr.slot-allocated' | 'pglr.subscription-synced' | 'pglr.streaming' | 'pglr.disconnected';
```

#### <code v-pre>OrmAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/types.ts#L18) <code v-pre>packages/orm/src/semantics/types.ts</code>

```ts
export type OrmAxis = 'replication' | 'cdc' | 'logical-replication' | 'mvcc' | 'rls' | 'connection-pool' | 'partitioning' | 'vector-store' | 'logical-replication-advanced' | 'mvcc-advanced' | 'mysql-cluster' | 'binlog' | 'sqlite-wal' | 'fts5' | 'txn-isolation' | 'pool-advanced';
```

#### <code v-pre>OrmBackend</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/types.ts#L16) <code v-pre>packages/orm/src/semantics/types.ts</code>

```ts
export type OrmBackend = 'postgres' | 'mysql' | 'sqlite';
```

#### <code v-pre>OrmProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/types.ts#L14) <code v-pre>packages/orm/src/semantics/types.ts</code>

Advanced ORM / database semantics — provider × backend neutral axis SSOT. v0.8 orm mocks only carried `setupOrmEnv` (schema + migration + seed) for 3 provider (drizzle / prisma / kysely) × 3 backend (postgres / mysql / sqlite). v0.9 adds 8 production db semantics that real database engines expose differently — streaming replication, change data capture, logical replication, MVCC snapshot isolation, row-level security, connection pool, declarative partitioning, and vector search. Each axis is a small pure state-machine helper that returns a neutral envelope so downstream tests can drive the axis without knowing the provider / backend payload dialect.

```ts
export type OrmProvider = 'drizzle' | 'prisma' | 'kysely';
```
