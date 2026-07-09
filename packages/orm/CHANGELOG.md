# @kiwa-lab/orm

## 0.10.0

### Minor Changes

- 🆕 feat(orm): `@kiwa-lab/orm` v0.10.0 — advanced db semantics 8 axis 追加 (3 provider × 3 backend × 16 axis = 144 grid coverage)

  v0.9 の 8 production db semantics は完全 backward compatible に維持しつつ、 advanced 8 axis を別 file として追加。 各 axis は既存 semantics と同じ pure state-machine helper + neutral-event + backend dialect envelope pattern で実装。

  追加 axis 一覧 (32 neutral event = 8 × 4)。

  - `logical-replication-advanced` (createLogicalReplicationAdvancedSession / startLogicalStreaming / trackReplicationOrigin / confirmTwoSafeCommit / syncCascadedSubscription) ... streaming replication protocol + replication origin + two-safe confirmation + cascaded subscription
  - `mvcc-advanced` (createMvccAdvancedSession / checkTupleVisibility / measureBloat / applyHotUpdate / detectXidWraparound) ... tuple visibility + vacuum bloat tracking + HOT update chain + XID wraparound
  - `mysql-cluster` (createMysqlClusterSession / joinClusterMember / electClusterPrimary / detectClusterConflict / leaveClusterMember) ... MySQL Group Replication + primary election + conflict detection + group membership
  - `binlog` (createBinlogSession / advanceBinlogPosition / updateGtidSet / negotiateBinlogFormat / detectGtidGap) ... binlog position + GTID set + ROW/STATEMENT/MIXED format + GTID gap detection
  - `sqlite-wal` (createSqliteWalSession / switchJournalMode / crossWalSizeThreshold / triggerWalCheckpoint / mapSharedMemory) ... WAL journal mode + size threshold + checkpoint + shared-memory wal-index
  - `fts5` (createFts5Session / createFts5VirtualTable / tokenizeFts5Document / matchFts5Query / inspectFts5Vocab) ... SQLite FTS5 virtual table + tokenizer + MATCH rank + vocab table
  - `txn-isolation` (createTxnIsolationSession / setTxnIsolationLevel / blockDirtyRead / blockNonRepeatableRead / blockPhantomRead) ... 4 isolation levels + dirty / non-repeatable / phantom read blocking
  - `pool-advanced` (createPoolAdvancedSession / runPoolHealthCheck / warmPoolConnections / drainPoolGracefully / exportPoolMetrics) ... pool health check + connection warmup + graceful drain + metrics export

  Fidelity harness は `collectFidelityCoverage({ providers, backends })` で 3 × 3 × 16 = 144 row grid を返す。 8 test file 追加で advanced axis の 3×3 happy path、 backend dialect、 guard、 axis 固有 state 遷移を検証。

## 0.9.0

### Minor Changes

- 🆕 feat(orm): `@kiwa-lab/orm` v0.9.0 — advanced db semantics 8 axis (3 provider × 3 backend × 8 axis = 72 grid coverage)

  v0.8 orm mocks が `setupOrmEnv` (schema + migration + seed) の 3 provider (drizzle / prisma / kysely) × 3 backend (postgres / mysql / sqlite) しか持たなかった状態から、 8 production db semantics を追加。 各 axis は provider / backend の payload dialect を知らずに driven 可能な pure state-machine helper として実装、 v1.24-1 (`@kiwa-lab/edge` v0.2 advanced edge semantics) と同じ neutral-event + dialect map + fidelity harness の三本柱。

  追加 axis 一覧 (32 neutral event = 8 × 4)。

  - `replication` (createReplicationSession / primaryWrite / markReplicaLagged / startFailover / promoteReplica) ... streaming replication + read replica lag + failover + promoted replica
  - `cdc` (createCdcSession / decodeEvent / appendOutbox / markEventOrdered / confirmDelivery) ... logical decoding + wal2json / Debezium-style outbox + LSN 順序 + at-least-once delivery
  - `logical-replication` (createLogicalRepSession / createPublication / syncSubscription / resolveConflict / heartbeat) ... publication + subscription + conflict resolution + heartbeat
  - `mvcc` (createMvccSession / takeSnapshot / abortSerializable / blockPhantom / detectDeadlock) ... snapshot isolation + serializable + phantom read + deadlock detection
  - `rls` (createRlsSession / installPolicy / filterTenant / bypassRls / logAudit) ... row-level security + tenant isolation + bypass_rls + audit trail
  - `connection-pool` (createPoolSession / acquire / waitInQueue / idleTimeout / statementTimeout) ... max_connections + idle_timeout + statement_timeout + wait queue
  - `partitioning` (createPartitioningSession / declarePartition / prunePartitions / partitionWiseJoin / routeInsert) ... declarative partitioning + partition pruning + partition-wise join + range/list/hash routing
  - `vector-store` (createVectorStoreSession / buildIndex / knnSearch / hybridSearch / computeDistance) ... pgvector / HeatWave / sqlite-vec + IVFFlat + HNSW + cosine/L2/inner-product + hybrid search

  Fidelity harness は `collectFidelityCoverage({ providers, backends })` で 3 × 3 × 8 = 72 row grid を返す。 backend / provider dialect は `backendEventName(backend, neutral, provider?)` 経由。 SQLite は server-only axes (streaming replication / CDC / statement_timeout etc.) で neutral 名 fallback。 Prisma provider overlay で `pool.acquired` などが `prisma.pool.acquired` に translate される。

  222 semantics test 追加 (既存 28 test は完全 backward compatible)、 typecheck / test / build all pass。

  関連: Issue #940 / Linear CAR-530、 parent v1.26 milestone (#939)。



### Minor Changes

- b58118c: 🆕 feat(orm): `@kiwa-lab/orm` v0.2.0 — live mode with testcontainers Postgres

  Drizzle ORM + Postgres (`mode: 'live' + dialect: 'postgres'`) を `setupOrmEnv` で受け入れ、 testcontainers (`@testcontainers/postgresql`) で Postgres 16 container を per-env で起動する。 既存 v0.1 (mock SQLite) は完全 backward compatible。

  新 API ... `LivePostgresOptions` 型 + `containerImage` option (default `postgres:16-alpine`) + `OrmTestEnvLive` (`db: DrizzlePostgresDb` + `raw: postgres.Sql` + `connectionUri: string`)。 `setupOrmEnv` の overload を mock / live で narrow し、 seed callback の引数型が dialect 別に正しく推論される。 `expectQuery` / `expectRowCount` は両 mode async 化、 SQLite (sync prepare) / Postgres (postgres.js unsafe) を内部で dispatch。

  Docker daemon 不在検知は明示的 Error message + PoC test では `dockerode` ping で early return する流儀 (test 自体は skip せず空 pass、 mock 経路のみで pnpm test を回せる)。

  関連: Linear CAR-291 (parent) / CAR-292 (#527-2 testcontainers)、 PoC `examples/orm-drizzle-postgres-poc/`、 残 follow-up = MySQL (CAR-292 残) / Prisma (CAR-293) / Kysely (CAR-294) / file migration (CAR-295)。

- 7465a3b: 🆕 feat(orm): `@kiwa-lab/orm` v0.3.0 — Prisma adapter (SQLite + tempdir)

  `OrmBrand` に `'prisma'` を追加し、 `mode: 'mock' + orm: 'prisma' + dialect: 'sqlite'` を `setupOrmEnv` で受け入れる。 既存 Drizzle 経路 (v0.1 mock SQLite / v0.2 live Postgres / v0.2.1 live MySQL) は完全 backward compatible。

  新 API ... `MockPrismaSqliteOptions` (caller の `PrismaClient` 構造体 + `schemaPath` + 任意の `datasourceUrlEnv` を受ける) + `OrmTestEnvMockPrisma` (`client: TClient` + `dbPath` + `datasourceUrl`)。 kiwa は per-env tempdir に `.db` を作成し、 `DATABASE_URL` 環境変数を一時 inject + `pnpm exec prisma db push --schema=<path>` を spawn して schema 適用、 caller の PrismaClient を `{ datasourceUrl }` で構築する。 `stop()` で `$disconnect` + tempdir 削除 + env var 復元まで一気通貫。

  `expectQuery` / `expectRowCount` も Prisma 経路を内部 dispatch、 `client.$queryRawUnsafe` 経由で raw SQL assertion をサポート。 `OrmTestEnv` discriminated union は `env.mode === 'mock' && env.orm === 'prisma'` で narrow 可能。

  関連: Linear CAR-293 (#527-3 Prisma adapter)、 PoC `examples/orm-prisma-sqlite-poc/`、 残 follow-up = Prisma + testcontainers (CAR-293 残) / Kysely (CAR-294) / file migration (CAR-295)。

- e7c3621: 🆕 feat(orm): `@kiwa-lab/orm` v0.6.0 — Prisma + testcontainers Postgres (v1.2 ORM milestone 完遂)

  `setupOrmEnv({ mode: 'live', orm: 'prisma', dialect: 'postgres', prismaClient, schemaPath })` を受入、 testcontainers Postgres を起動し `DATABASE_URL` を `process.env` に inject + `prisma db push` を spawn して schema 適用、 caller の PrismaClient を `{ datasourceUrl }` で構築する。 既存 v0.1-v0.5 経路は完全 backward compatible。

  新 API ... `LivePrismaPostgresOptions` 型 + `OrmTestEnvLivePrismaPostgres` (`client: TClient` + `connectionUri: string`)。 `expectQuery` / `expectRowCount` は `env.orm === 'prisma' && env.dialect === 'postgres'` 分岐で `client.$queryRawUnsafe` を経由。

  v0.6 で v1.2 ORM milestone (CAR-291 / #527) の主要 sub-Issue 7 件が完遂、 受入 matrix は 9 組合せ (Drizzle 3 + Prisma 2 + Kysely 3 + file migration) に達した。 残 future follow-up = Prisma + MySQL testcontainers のみ。

  関連: Linear CAR-305 (#527-3 follow-up Prisma + testcontainers Postgres)、 PoC `examples/orm-prisma-postgres-poc/`、 parent CAR-291 完遂。

- 82f4006: 🆕 feat(orm): `@kiwa-lab/orm` v0.4.0 — Kysely adapter (SQLite + Postgres + MySQL)

  `OrmBrand` に `'kysely'` を追加、 `mode: 'mock' + orm: 'kysely' + dialect: 'sqlite'` / `mode: 'live' + orm: 'kysely' + dialect: 'postgres'|'mysql'` の 3 dialect 一気に受入。 既存 Drizzle (v0.1-v0.2.1) / Prisma (v0.3) 経路は完全 backward compatible。

  新 API ... `KyselyDatabase` 型 + `MockKyselySqliteOptions` / `LiveKyselyPostgresOptions` / `LiveKyselyMysqlOptions` + `OrmTestEnvMockKysely` / `OrmTestEnvLiveKyselyPostgres` / `OrmTestEnvLiveKyselyMysql`。 `setupOrmEnv` overload を 7 種に拡張、 `env.db: Kysely<Database>` で公開、 `env.raw` には better-sqlite3 / pg.Pool / mysql2 Pool を露出。 `expectQuery` / `expectRowCount` は `env.orm === 'kysely'` 分岐で pg.Pool.query / mysql2 query を dispatch。

  caller は phantom-typed `Database` interface を `schema` として渡す形式 (kiwa-codegen 等で生成 or 手書き)。 既存 Drizzle / Prisma と同じ Pattern A (DI) でテストを書ける。

  関連: Linear CAR-294 (#527-4 Kysely adapter)、 PoC `examples/orm-kysely-sqlite-poc/`、 残 follow-up = Prisma + testcontainers (CAR-293 残) / file migration (CAR-295)。

- d977ea4: 🆕 feat(orm): `@kiwa-lab/orm` v0.5.0 — file-based migration (drizzle-orm/migrator)

  `MigrationSource` を `string | string[] | { folder: string }` の union に拡張、 `{ folder }` 形式を渡すと kiwa が dialect 別に drizzle-orm/migrator (`drizzle-orm/better-sqlite3/migrator` / `drizzle-orm/postgres-js/migrator` / `drizzle-orm/mysql2/migrator`) を import + `migrate(db, { migrationsFolder })` を実行する。 既存 `string` / `string[]` 形式は完全 backward compatible。

  drizzle-kit generate で出力した production migration file (`drizzle/0000_init.sql` + `meta/_journal.json`) をそのまま test 経路で適用可能、 production と test で migration を共有できる流儀を確立。 Kysely / Prisma 経路は対象外で、 folder を渡すと説明的 Error を throw (Kysely callers should use their own Migrator class)。

  関連: Linear CAR-295 (#527-5 file-based migration)、 PoC `examples/orm-drizzle-file-migration-poc/`、 残 follow-up = Prisma + testcontainers (CAR-293 残)。

- 9468a99: 🆕 feat(orm): `@kiwa-lab/orm` v0.1.0 — ORM query test adapter MVP

  Drizzle ORM + in-memory SQLite を対象に `setupOrmEnv({ mode: 'mock', orm: 'drizzle', dialect: 'sqlite', schema, migrations?, seed? })` + `expectQuery(env, sql, expected, expect)` + `expectRowCount(env, table, n, expect)` を提供する Layer 2 fixture。 Docker 不要、 type-safe、 並行 env 隔離を保証する。

  Pattern A (Dependency Injection) で production-shape repository を `setupOrmEnv` で取得した `env.db` に対してそのまま test できる流儀を採用、 follow-up Issue #527-2 .. #527-5 で testcontainers (Postgres / MySQL) + Prisma + Kysely + 追加 PoC を順次拡張予定。

  関連: Issue #527 (v1.2 milestone)、 PoC `examples/orm-drizzle-sqlite-poc/`、 skill `/kiwa-orm`、 design layer `--layer orm-query`。

### Patch Changes

- 2079284: 🆕 feat(orm): `@kiwa-lab/orm` v0.2.1 — MySQL dialect via testcontainers

  Drizzle ORM + MySQL (`mode: 'live' + dialect: 'mysql'`) を `setupOrmEnv` で受け入れ、 testcontainers (`@testcontainers/mysql`) で MySQL 8.x container を per-env で起動する。 既存 v0.1 (mock SQLite) / v0.2 (live Postgres) は完全 backward compatible。

  新 API ... `LiveMysqlOptions` 型 + `OrmTestEnvLiveMysql` (`db: DrizzleMysqlDb` + `raw: mysql2 Pool` + `connectionUri`)、 `setupOrmEnv` overload 3 (mock SQLite / live Postgres / live MySQL) で seed callback の引数型が dialect 別に narrow。 `expectQuery` / `expectRowCount` は MySQL の `pool.query` 経路を内部 dispatch、 識別子 quoting も backtick で MySQL 規約準拠。

  Docker daemon 不在検知は Postgres と同流儀、 PoC test は `dockerode` ping で early return。

  関連: Linear CAR-298 (#527-2 MySQL follow-up)、 PoC `examples/orm-drizzle-mysql-poc/`、 残 follow-up = Prisma (CAR-293) / Kysely (CAR-294) / file migration (CAR-295)。
