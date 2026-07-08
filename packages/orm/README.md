# @kiwa/orm

<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-promo-en.gif" alt="kiwa 127s overview" width="640" />
  <br />
  <sub>Full <a href="https://github.com/cardene777/kiwa">kiwa</a> overview (127s) — this package covers the ORM query test surface.</sub>
</p>

ORM query test adapter for kiwa.

## Overview

`@kiwa/orm` provides deterministic primitives for testing ORM-backed query layers.

- **v0.1** — Drizzle ORM + in-memory SQLite (`mode: 'mock'`). Fast, Docker-free, type-safe.
- **v0.2** — Drizzle ORM + Postgres via testcontainers.
- **v0.2.1** — Drizzle ORM + MySQL via testcontainers.
- **v0.3** — Prisma + tempdir SQLite + `prisma db push`.
- **v0.4** — Kysely query builder across SQLite (in-memory) + Postgres / MySQL (testcontainers).
- **v0.5** — file-based migration via `drizzle-orm/migrator` (`migrations: { folder }`).
- **v0.6** — Prisma + testcontainers Postgres (`mode: 'live' + orm: 'prisma' + dialect: 'postgres'`). **v1.2 ORM milestone (CAR-291 #527) 完遂版**。
- **v0.7** — Prisma + testcontainers MySQL (`mode: 'live' + orm: 'prisma' + dialect: 'mysql'`) + Kysely Migrator (`migrations: { folder }` via `kysely.Migrator` + `FileMigrationProvider`). **v1.3 ORM follow-up (#563) 完遂版**。
- **v0.9** (this release) — advanced db semantics 8 axis (replication + CDC + logical replication + MVCC + RLS + connection pool + partitioning + vector store) as pure state-machine helpers with a 3 provider × 3 backend × 8 axis = 72 row fidelity grid. Wraps the existing `setupOrmEnv` mocks with production-shape event streams so downstream tests can drive advanced db behaviour without knowing per-backend payload dialects. **v1.26-1 (#940) semantics 追加版**。

## Install

```bash
# mock mode (SQLite) — minimum install
pnpm add -D @kiwa/orm @kiwa/core drizzle-orm better-sqlite3 vitest

# live mode (Postgres) — add testcontainers + postgres.js
pnpm add -D @testcontainers/postgresql postgres
```

All driver / runtime packages are declared as `peerDependencies` so callers control the versions directly. `better-sqlite3` is only required for mock mode; `testcontainers` + `@testcontainers/postgresql` + `postgres` only for live mode.

## Quick start — mock SQLite (v0.1)

```ts
import { setupOrmEnv } from '@kiwa/orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

const users = sqliteTable('users', { id: integer('id').primaryKey(), email: text('email').notNull().unique() });
const schema = { users };

const env = await setupOrmEnv({
  mode: 'mock',
  orm: 'drizzle',
  dialect: 'sqlite',
  schema,
  migrations: 'CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE);',
});
env.db.insert(users).values({ id: 1, email: 'a@x' }).run();
const rows = env.db.select().from(users).all();
await env.stop();
```

## Quick start — live Postgres via testcontainers (v0.2)

```ts
import { setupOrmEnv } from '@kiwa/orm';
import { pgTable, serial, text } from 'drizzle-orm/pg-core';

const users = pgTable('users', { id: serial('id').primaryKey(), email: text('email').notNull().unique() });
const schema = { users };

const env = await setupOrmEnv({
  mode: 'live',
  orm: 'drizzle',
  dialect: 'postgres',
  schema,
  migrations: 'CREATE TABLE users (id SERIAL PRIMARY KEY, email TEXT NOT NULL UNIQUE);',
  // Optional — override the Docker image. Default: postgres:16-alpine.
  containerImage: 'postgres:16-alpine',
});
await env.db.insert(users).values({ email: 'a@x' });
const rows = await env.db.select().from(users);
console.log(env.connectionUri); // postgres://...
await env.stop(); // closes pool + stops container
```

> live mode requires a working Docker daemon. The first `setupOrmEnv` call pulls `postgres:16-alpine` (~50 MB) and adds ~3-5 s startup per container.

## API

### `setupOrmEnv(opts)`

| `mode` | `orm` | `dialect` | Notes |
|---|---|---|---|
| `'mock'` | `'drizzle'` | `'sqlite'` | v0.1 — in-memory better-sqlite3 |
| `'live'` | `'drizzle'` | `'postgres'` | v0.2 — testcontainers Postgres |
| `'live'` | `'drizzle'` | `'mysql'` | v0.2.1 — testcontainers MySQL |
| `'mock'` | `'prisma'` | `'sqlite'` | v0.3 — tempdir SQLite + `prisma db push` |
| `'mock'` | `'kysely'` | `'sqlite'` | v0.4 — in-memory better-sqlite3 |
| `'live'` | `'kysely'` | `'postgres'` | v0.4 — testcontainers Postgres + pg |
| `'live'` | `'kysely'` | `'mysql'` | v0.4 — testcontainers MySQL + mysql2 |
| `'live'` | `'prisma'` | `'postgres'` | v0.6 — testcontainers Postgres + prisma db push |
| `'live'` | `'prisma'` | `'mysql'` | v0.7 — testcontainers MySQL + prisma db push (this release) |

Common options:

| Option | Type | Notes |
|---|---|---|
| `schema` | `Record<string, unknown>` | The object exported from your Drizzle schema file. |
| `migrations` | `string \| string[]` | Optional SQL applied sequentially before `seed`. |
| `seed` | `(db) => void \| Promise<void>` | Optional seed callback. Receives the dialect-appropriate Drizzle client. |
| `containerImage` (live only) | `string` | Docker image override. Default `postgres:16-alpine`. |

Returns the discriminated union `OrmTestEnvMock | OrmTestEnvLive` so callers can narrow on `mode` / `dialect`.

### `expectQuery(env, sql, expected, expect)` (async)

Runs raw SQL through the underlying driver (better-sqlite3 for mock, postgres.js for live) and asserts deep equality against `expected`.

### `expectRowCount(env, table, expected, expect)` (async)

Asserts that the row count of `table` equals `expected`.

## v0.9 — advanced db semantics (8 axis)

v0.9 adds pure state-machine helpers for 8 production db semantics that real backends expose differently. Each axis is a small session + 4 neutral events; the mock returns a neutral envelope `{ neutralEvent, backendEvent, state, provider, backend, metadata }` so downstream tests can drive the axis without knowing the per-backend payload dialect.

| axis | helpers | neutral events | 相当機能 |
|---|---|---|---|
| `replication` | createReplicationSession / primaryWrite / markReplicaLagged / startFailover / promoteReplica | primary-write / replica-lagged / failover-started / promoted | streaming replication + read replica lag + failover + promoted replica |
| `cdc` | createCdcSession / decodeEvent / appendOutbox / markEventOrdered / confirmDelivery | decoded / outbox-appended / event-ordered / at-least-once-delivered | logical decoding + wal2json / Debezium outbox + LSN 順序 + at-least-once |
| `logical-replication` | createLogicalRepSession / createPublication / syncSubscription / resolveConflict / heartbeat | publication-created / subscription-synced / conflict-resolved / heartbeat | publication + subscription + conflict resolution + heartbeat |
| `mvcc` | createMvccSession / takeSnapshot / abortSerializable / blockPhantom / detectDeadlock | snapshot-taken / serializable-aborted / phantom-blocked / deadlock-detected | snapshot isolation + serializable + phantom read + deadlock |
| `rls` | createRlsSession / installPolicy / filterTenant / bypassRls / logAudit | policy-installed / tenant-isolated / bypass-used / audit-logged | row-level security + tenant isolation + bypass_rls + audit |
| `connection-pool` | createPoolSession / acquire / waitInQueue / idleTimeout / statementTimeout | acquired / wait-queued / idle-timeout / statement-timeout | max_connections + idle_timeout + statement_timeout + wait queue |
| `partitioning` | createPartitioningSession / declarePartition / prunePartitions / partitionWiseJoin / routeInsert | declared / pruned / wise-joined / route-selected | declarative partitioning + pruning + wise-join + range/list/hash routing |
| `vector-store` | createVectorStoreSession / buildIndex / knnSearch / hybridSearch / computeDistance | indexed / knn-searched / hybrid-searched / distance-computed | pgvector / HeatWave / sqlite-vec + IVFFlat + HNSW + cosine/L2/inner-product + hybrid |

Fidelity harness — call `collectFidelityCoverage({ providers, backends })` to enumerate the `providers.length × backends.length × 8 axis` grid. For the default 3 provider × 3 backend it returns 72 rows so release-gate can assert coverage.

```ts
import {
  createReplicationSession,
  primaryWrite,
  markReplicaLagged,
  startFailover,
  promoteReplica,
} from '@kiwa/orm';

const session = createReplicationSession({
  primaryId: 'db_primary',
  provider: 'drizzle',
  backend: 'postgres',
  replicaIds: ['db_replica_1', 'db_replica_2'],
});
primaryWrite(session, { bytes: 1_000 });
markReplicaLagged(session, { replicaId: 'db_replica_1', appliedLsn: 500 });
startFailover(session, { reason: 'primary crash' });
promoteReplica(session, { replicaId: 'db_replica_2' });
```

SQLite has no server-side analogue for some axes (streaming replication, wal2json CDC, `statement_timeout` etc.); the backend dialect falls back to the neutral event name so downstream fanout tests still receive recognisable strings. Prisma has a provider overlay that translates a subset of pool / mvcc events to `prisma.*` names.

## Design — Pattern A (Dependency Injection)

Production code stays thin around the ORM client; tests inject a fresh `setupOrmEnv` per test (isolation by default). Swapping `'mock'` → `'live'` in CI keeps the test API identical — only the dialect-specific SQL and error patterns differ.

## Limitations (v0.9)

- All 3 ORM brands supported (Drizzle / Prisma / Kysely) across the full mock + live matrix.
- Accepted combinations: `mock+drizzle+sqlite`, `live+drizzle+postgres`, `live+drizzle+mysql`, `mock+prisma+sqlite`, `live+prisma+postgres`, `live+prisma+mysql`, `mock+kysely+sqlite`, `live+kysely+postgres`, `live+kysely+mysql`. Other combinations throw a descriptive Error.
- Migration sources — SQL string / SQL `string[]` work for every adapter. The `{ folder }` form runs `drizzle-orm/migrator` for Drizzle and `kysely.Migrator` + `FileMigrationProvider` for Kysely (v0.7). Prisma migrations are applied via `prisma db push --schema=<schemaPath>` regardless of dialect.
- live mode requires a Docker daemon. CI runners that disable Docker should restrict their suite to `mode: 'mock'`.
- Prisma mode requires the caller to run `prisma generate` ahead of time and pass the resulting `PrismaClient` constructor — kiwa never invokes `prisma generate` itself.
- Kysely mode requires the caller to supply the phantom-typed `Database` interface (hand-written or `kysely-codegen` output). Kysely Migrator file-based migrations require each migration file to export `up(db)` (and optionally `down(db)`); file name alphabetical order determines execution order.

## Related

- Skill: `/kiwa-orm` — generate Vitest tests from a Layer 1 spec.
- Layer 1: `/kiwa-design --layer orm-query`.
- Tracking Issues: [#527](https://github.com/cardene777/kiwa/issues/527) (v1.2 ORM milestone) / [#563](https://github.com/cardene777/kiwa/issues/563) (v1.3 ORM follow-up — Prisma + MySQL / Kysely Migrator).
