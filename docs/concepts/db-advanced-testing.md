# Db advanced testing SSOT — 8 axis production semantics for kiwa v1.26

Introduced in v1.14 as `@kiwa-lab/orm` v0.8 (`setupOrmEnv` for 3 provider × 3 backend schema / migration / seed), extended in v1.26 as v0.9 (8 axis production semantics on the same 3 × 3 grid). This document is the SSOT for **which advanced database axes kiwa mocks, what neutral events each axis emits, and how provider × backend fidelity is measured**. Every downstream orm test in `packages/*/tests/**/*.test.ts` and every dogfood app in `examples/dogfood-{postgres-cdc-outbox,mysql-rls-tenant,vector-search}-app/` reads these rules from here — do not re-derive them locally.

## Why a db advanced semantics SSOT

Testing a production database against v0.8 `setupOrmEnv` alone leaves 8 axes of real-world behaviour unlocked.

- **v0.8 gap**. `setupOrmEnv` gives you schema + migration + seed on 3 provider × 3 backend. What it does not give you is a way to assert that "the outbox event ordering is preserved across a Postgres failover", "the RLS policy refuses a cross-tenant read at the mock layer", or "the pgvector HNSW index rejects a mismatched query dimension". Those assertions need per-axis state machines.
- **Provider × backend dialect drift**. Postgres `wal_sender.progress` vs MySQL `binlog.write` vs SQLite `mvcc.snapshot-taken` — the same neutral event fires under different backend names. Downstream tests that hard-code the backend name break when the provider swaps. A neutral event + backend-specific dialect map is the smallest surface that keeps the tests portable.
- **Fidelity grid drift**. Without a shared coverage grid, one package asserts on 6 axes and another on 7. The v1.26 SSOT pins the grid at **3 provider × 3 backend × 8 axis = 72 rows**, and `collectFidelityCoverage` builds it deterministically so release-gate reports show a stable dimension.

The 4 rules below are the smallest set that make kiwa orm advanced semantics tests comparable across providers, backends, and forks.

## Rule 1 — 8 axes are the shared floor

Every `@kiwa-lab/orm` v0.9 axis session is one of the 8 axes below. New axes belong in a follow-up milestone; downstream tests should not roll a private axis alongside the 8.

| Axis | Session ctor | Neutral events |
|---|---|---|
| replication | `createReplicationSession` | `replication.primary-write` / `replication.replica-lagged` / `replication.failover-started` / `replication.promoted` |
| cdc | `createCdcSession` | `cdc.decoded` / `cdc.outbox-appended` / `cdc.event-ordered` / `cdc.at-least-once-delivered` |
| logical-replication | `createLogicalRepSession` | `logical.publication-created` / `logical.subscription-synced` / `logical.conflict-resolved` / `logical.heartbeat` |
| mvcc | `createMvccSession` | `mvcc.snapshot-taken` / `mvcc.serializable-aborted` / `mvcc.phantom-blocked` / `mvcc.deadlock-detected` |
| rls | `createRlsSession` | `rls.policy-installed` / `rls.tenant-isolated` / `rls.bypass-used` / `rls.audit-logged` |
| connection-pool | `createPoolSession` | `pool.acquired` / `pool.idle-timeout` / `pool.statement-timeout` / `pool.wait-queued` |
| partitioning | `createPartitioningSession` | `partition.declared` / `partition.pruned` / `partition.wise-joined` / `partition.route-selected` |
| vector-store | `createVectorStoreSession` | `vector.indexed` / `vector.knn-searched` / `vector.hybrid-searched` / `vector.distance-computed` |

Every session ctor returns a plain object with a `state` field, a `history` array of `AxisStep<TState>` entries, and axis-specific bookkeeping. State machines are pure — no I/O, no timers, no adapters. Downstream tests drive the state machine with the exported step functions (`primaryWrite`, `decodeEvent`, `installPolicy`, …) and assert on the returned `AxisStep` envelope.

## Rule 2 — neutral event + backend dialect + optional provider overlay

Every step returns an `AxisStep<TState>` with both `neutralEvent` (portable across backends) and `backendEvent` (backend dialect). The `backendEventName(backend, neutral, provider?)` helper resolves the dialect lookup.

```ts
import { backendEventName } from '@kiwa-lab/orm';

backendEventName('postgres', 'cdc.decoded');
// -> 'pg_logical_slot.decoded'

backendEventName('mysql', 'replication.primary-write');
// -> 'binlog.write'

backendEventName('sqlite', 'replication.primary-write');
// -> 'replication.primary-write' (no server-side dialect, falls back to neutral)

backendEventName('postgres', 'pool.acquired', 'prisma');
// -> 'prisma.pool.acquired' (provider overlay wins over backend dialect)
```

Rules of dialect resolution.

- **Postgres + MySQL** ship dialect entries for all 32 neutral events (8 axis × 4 events). Real backends surface distinct string ids that downstream telemetry key on (Postgres `wal_sender.progress`, MySQL `binlog.write`).
- **SQLite** ships dialect entries only for axes with a meaningful in-process analogue (mvcc / rls / connection-pool / partitioning / vector-store). Server-only axes (replication / cdc / logical-replication) fall back to the neutral name.
- **Provider overlay** currently only exists for **Prisma**. `drizzle` / `kysely` skip the overlay entirely and use the backend dialect. Downstream tests reading a `prisma.pool.acquired` string know the overlay fired; a raw `pgbouncer.client_acquired` string means the overlay skipped.

The overlay is optional-safe. `backendEventName` falls back to the backend dialect when no overlay entry exists, and to the neutral name when no backend dialect exists — no silent typos, no undefined outputs.

## Rule 3 — state transitions are strictly guarded

Every step function throws on illegal state transitions. There is no silent state fall-through. This is what makes the mock trustworthy as a production semantics oracle — a bug in the caller (e.g. `confirmDelivery` before `markEventOrdered`) is caught at test time, not in production.

Examples of guarded transitions.

- `appendOutbox` requires `decoding` / `buffered` / `ordered` — throwing when `idle` or `delivered`.
- `confirmDelivery` rejects `upToLsn` smaller than `confirmedLsn` (delivery pointer regression) and larger than the outbox high-water (acking an unappended LSN).
- `filterTenant` requires `policy-installed` state — throws when `bypassed` so tests assert the bypass "sticks" until the caller re-arms the policy.
- `takeSnapshot` refuses `phantom-blocked` state — a snapshot on a blocked txn masquerades as isolation.
- `partitionWiseJoin` requires `matchedBuckets === buckets.length` — Postgres partition-wise join is an all-or-nothing plan; partial matches fall back to a global join and are not partition-wise.
- `primaryWrite` refuses `promoted` state — the old primary is terminal after `promoteReplica`.

These guards are asserted in `packages/orm/tests/semantics/*.test.ts` (v1.26-1) and are the reason the mock can serve as a state-machine oracle in dogfood app tests without a real database.

## Rule 4 — fidelity coverage grid is 3 × 3 × 8 = 72 rows

`collectFidelityCoverage({ providers: [...], backends: [...] })` walks the requested providers × backends × axes and emits one `FidelityRow` per triple, with the 4 neutral events + 4 backend dialect strings for that combination.

```ts
import { collectFidelityCoverage } from '@kiwa-lab/orm';

const coverage = collectFidelityCoverage({
  providers: ['drizzle', 'prisma', 'kysely'],
  backends: ['postgres', 'mysql', 'sqlite'],
});

coverage.rows.length; // -> 72 (3 × 3 × 8)
coverage.axes; // -> 8 axes in declaration order
```

Downstream release-gate reports assert the row count is stable (`72` for the default 3 × 3 grid) so a regression on the axis list surfaces as a dimension mismatch, not a silent field rename. The exposed fields are.

- `rows[].provider` / `rows[].backend` / `rows[].axis` — the triple.
- `rows[].neutralEvents` — the 4 neutral event names for that axis.
- `rows[].backendEvents` — the 4 dialect-resolved strings for that provider × backend.

The grid is deterministic — the axis order comes from `AXIS_TO_EVENTS` declaration order, so two runs against the same providers + backends produce byte-identical grids.

## Provider × backend fidelity table (v1.26)

The v1.26 mock ships full dialect entries per (backend, axis) with a Prisma-only provider overlay on 3 events. `` means the backend has a named dialect; `–` means the backend falls back to the neutral name.

| Axis | Postgres | MySQL | SQLite | Prisma overlay |
|---|---|---|---|---|
| replication (4 events) | ✅ (`wal_sender.*` / `pg_stat_replication.*`) | ✅ (`binlog.*` / `group_replication.*`) | – (no server-side replication) | – |
| cdc (4 events) | ✅ (`pg_logical_slot.*` / `outbox.wal2json_*`) | ✅ (`binlog.event_decoded` / `debezium.outbox_row`) | – (no server-side change log) | – |
| logical-replication (4 events) | ✅ (`pg_publication.*` / `pg_subscription.*`) | ✅ (`binlog.filter_registered` / `group_replication.*`) | – | – |
| mvcc (4 events) | ✅ (`pg_snapshot.exported` / `pg_serializable.abort`) | ✅ (`innodb.consistent_snapshot` / `innodb.deadlock`) | ✅ (`sqlite.snapshot_open` / `sqlite.busy_rollback`) | ✅ (`prisma.interactive_transaction` on snapshot) |
| rls (4 events) | ✅ (`pg_policy.created` / `pg_rls.*`) | ✅ (`view.tenant_filter` / `grant.super_bypass`) | ✅ (`sqlite.view_created` / `sqlite.attach_bypass`) | – |
| connection-pool (4 events) | ✅ (`pgbouncer.*` / `pg_stat_statements.timeout`) | ✅ (`proxysql.*` / `max_execution_time`) | ✅ (`sqlite.wal_writer_acquired` / `sqlite.busy_timeout_exceeded`) | ✅ (`prisma.pool.acquired` / `prisma.pool.wait`) |
| partitioning (4 events) | ✅ (`pg_partitioned_table.created` / `pg_plan.*`) | ✅ (`partition.range_created` / `partition_prune`) | ✅ (`sqlite.shard_attached` / `sqlite.shard_skipped`) | – |
| vector-store (4 events) | ✅ (`pgvector.ivfflat_indexed` / `pgvector.knn`) | ✅ (`heatwave.vector_indexed` / `heatwave.knn`) | ✅ (`sqlite_vec.indexed` / `sqlite_vec.knn`) | – |

The full mapping lives in `packages/orm/src/semantics/types.ts` (`dialect` const + `providerOverlay` const). Downstream tests should read from `backendEventName` rather than hard-coding these strings — the map may add MySQL HeatWave / sqlite-vss / provider overlays without breaking neutral-event consumers.

## The 3 dogfood apps (v1.26)

The v1.26 milestone applied the 8 axis mocks to 3 dogfood apps that walk the provider × backend combinations end-to-end. Each app pairs one provider with one backend and exercises 1-3 axes as first-class flows.

| App | Framework | Provider | Backend | Primary axes |
|---|---|---|---|---|
| `examples/dogfood-postgres-cdc-outbox-app` | Next.js 15 | drizzle | postgres | cdc + logical-replication (outbox + Redis Streams downstream) |
| `examples/dogfood-mysql-rls-tenant-app` | Nuxt 3 | prisma | mysql | rls + connection-pool (tenant isolation + audit log) |
| `examples/dogfood-vector-search-app` | SvelteKit | kysely | postgres | vector-store (pgvector IVFFlat / HNSW + hybrid) |

Each app ships a Playwright e2e that walks the axis end-to-end plus a fidelity harness (env-gated `KIWA_MODE=real`) that compares the mock verdict against a real testcontainers Postgres 16 / MySQL 8. The harness is opt-in — the app suite passes without Docker.

## Where each axis lands in the release gate

The 11-axis release gate ships one orm axis — `fidelity.ratio` — and one perf axis — `perf.p95Ms`. v1.26 does not add new release-gate axes; the 8 orm advanced axes fold into the same `fidelity.ratio` metric so the release-gate surface stays stable.

| Release-gate axis | v1.26 contribution | Source |
|---|---|---|
| fidelity.ratio | 8-axis mock vs real driver diff on `KIWA_MODE=real` runs | `docs/quality/release-gate.md` |
| perf.p95Ms | orm advanced axis suites feed p95 into the shared perf gate | `docs/concepts/perf-testing-ssot.md` |

Concurrent + memory gates are not in the 11-axis release gate — they are per-package gates enforced inside `runPerf3Layer` (v1.25). A concurrent or memory breach fails the local vitest run but does not cascade to the release-gate report, because the release gate is scoped to a single primary axis per category.

## Related

- [Tutorial 47 — Postgres CDC + outbox (v1.26-2 walkthrough)](../tutorials/47-postgres-cdc-outbox)
- [Tutorial 48 — MySQL RLS + multi-tenant (v1.26-3 walkthrough)](../tutorials/48-mysql-rls-tenant)
- [Tutorial 49 — pgvector + hybrid search (v1.26-4 walkthrough)](../tutorials/49-vector-search-pgvector)
- [Migration guide v1.25 → v1.26](../migrations/v1.25-to-v1.26)
- [Perf-testing SSOT (p50 / p95 / p99 + baseline persistence)](./perf-testing-ssot)
- [Release gate SSOT (11-axis)](../quality/release-gate)
