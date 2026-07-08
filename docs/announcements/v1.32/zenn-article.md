# kiwa v1.32 released — Database 深化 II (@kiwa/orm v0.10.0 + 8 axis advanced + real driver + 縦深化 pair 第 4 pair 連続化)

## TL;DR

- **kiwa v1.32 released** — Database 深化 II milestone (Postgres logical replication + MySQL cluster + SQLite WAL/FTS5 + real driver + 縦深化 pair 第 4 pair 連続化)
- **`@kiwa/orm` v0.9.0 → v0.10.0 minor bump** — 8 axis advanced production db semantics + real driver env-gate + 3 ORM × 3 backend × 8 axis neutral state machine 追加
- **8 axis semantics** = Postgres logical replication + Postgres MVCC + MySQL cluster + MySQL binlog + SQLite WAL + SQLite FTS5 + txn isolation + connection pool advanced
- **3 dogfood app v2 / 新規** — postgres-cdc-outbox-app v2 + mysql-rls-tenant-app v2 + sqlite-wal-fts-app 新規、 全 7 軸 release gate PASS + testcontainers
- **縦深化 pair pattern 第 4 pair 連続化** — Auth pair (v1.21→v1.22) + Realtime pair (v1.13→v1.28) + Streaming pair (v1.20→v1.31) + **Database pair (v1.14→v1.32)**、 縦深化戦略 SSOT を database production layer に拡張
- **10 milestone 連続 snippet validation streak** (v1.23-v1.32)
- **kiwa runtime fixture 35 packages 維持** (orm 既存 package の minor 拡張)
- v1.11 以降 22 milestone 連続完遂

## v1.32 が解決したい問題 — Database production semantics の testing gap

v1.14 で `@kiwa/orm` v0.1-v0.9 を land した時点で、 kiwa は 3 ORM (Drizzle / Prisma / Kysely) × 3 backend (Postgres / MySQL / SQLite) 上に **8 base semantics** (replication / CDC / logical replication / MVCC / RLS / connection pool / partitioning / vector store) を統一 mock として提供していた。 broker binary + Docker + PGDATA edit 不要で mock only mode で走る、 実 test 環境の生産性を確保する目的の layer。

しかし v1.26 の実行観測で判明したのは、 real production database setup で頻繁に遭遇する **8 axis の advanced semantics** — Postgres logical replication の streaming start + replication origin tracking + two-safe commit + cascaded subscription / Postgres MVCC の xid wraparound + freeze / MySQL cluster の group replication + primary election + certification conflict / MySQL binlog の GTID resync / SQLite WAL の journal_mode 遷移 + checkpoint TRUNCATE + shm mapping / SQLite FTS5 の tokenizer stopword + BM25 rank + snippet extraction / Cross-DB transaction isolation (READ UNCOMMITTED → SERIALIZABLE) / Connection pool advanced (health check + failover + pgbouncer + ProxySQL + statement cache) — が 8 base semantics だけでは cover できないこと。

v1.32 はこの gap を埋める深化 II milestone。 8 axis advanced production db semantics + real driver env-gate + 3 dogfood app v2 で **production database testing SSOT** を確立、 kiwa の縦深化 pair pattern (basic mock → advanced real driver) を 4 pair 目として database production layer に拡張。

## v1.32 で追加した 8 axis advanced production db semantics

### 1. Postgres logical replication (`postgres-logical-replication.ts`)

`START_REPLICATION` protocol handshake with `pgoutput` (protocol version + start LSN)、 replication origin tracking (`pg_replication_origin_advance` so a subscriber can survive a restart without re-reading the whole slot)、 two-safe commit confirmation (`synchronous_commit = remote_apply` with at least one synchronous standby)、 cascaded subscription sync (upstream subscriber that itself becomes a publisher for a downstream) の 4 advanced pieces を pure state machine として実装。 real driver env-gate で Postgres 16 testcontainers 経由の real database 走査。

### 2. Postgres MVCC internals (`postgres-mvcc.ts`)

snapshot isolation + xid (transaction id) tracking + vacuum + wraparound protection + freeze の state machine。 `SELECT txid_current()` monotonic increment、 `VACUUM FREEZE` before wraparound、 `age(datfrozenxid)` monitor、 aggressive autovacuum triggering の 5 axis 統一実装。

### 3. MySQL cluster (`mysql-cluster.ts`)

MySQL 8 group replication の 4 axis: member joining the group (`group_replication_start` + weight)、 single-primary election (`group_replication_switch_to_single_primary_mode` picking the elected member)、 write conflict detection (`performance_schema.replication_group_member_stats.COUNT_CONFLICTS_DETECTED`)、 member leaving (`STOP GROUP_REPLICATION` shrinks the visible member set)。 InnoDB cluster + Router R/W split routing を pure state machine 化。

### 4. MySQL binlog (`mysql-binlog.ts`)

MySQL binlog format 3 mode (row/statement/mixed) + GTID (Global Transaction Identifier) tracking + resync + purge の state machine。 `gtid_executed` growing set、 replica catch-up + resync from position + binlog rotation の観測。

### 5. SQLite WAL mode (`sqlite-wal.ts`)

SQLite の `PRAGMA journal_mode = WAL` (switching from rollback-journal to write-ahead log)、 `wal_autocheckpoint` size threshold (WAL file grows until `wal_checkpoint` runs)、 `PRAGMA wal_checkpoint(TRUNCATE)` (advancing the WAL, checkpointing dirty pages, and truncating the WAL file)、 shared-memory `-shm` region mapping (wal-index turns "read the WAL" into "read a memory-mapped array")、 read snapshot の 5-state machine を pure logic として実装。

### 6. SQLite FTS5 (`sqlite-fts5.ts`)

FTS5 virtual table (`CREATE VIRTUAL TABLE ... USING fts5`)、 tokenizer configuration (`unicode61` / `porter` / `trigram`)、 `MATCH` queries with BM25 ranking、 `fts5vocab` term inspection、 snippet extraction の 5-state machine。 tokenizer stopword + phrase query + column-weighted BM25 + prefix matching の統一実装。

### 7. Cross-DB transaction isolation (`txn-isolation.ts`)

4 isolation level (READ UNCOMMITTED / READ COMMITTED / REPEATABLE READ / SERIALIZABLE) + phantom read guard を統一 API で実装。 Postgres SSI + MySQL InnoDB gap lock + SQLite serialized の 3 provider を neutral state machine で routing、 phantom read detection + write skew detection。

### 8. Connection pool advanced (`connection-pool-advanced.ts`)

health check probe + failover to standby + pgbouncer transaction mode + ProxySQL query routing + prepared statement cache の 5-state machine。 idle_timeout + statement_timeout + wait queue + max_connections invariant guard を統一実装。

## 3 dogfood database app v2 / 新規

### `dogfood-postgres-cdc-outbox-app` v2

- Next.js 15 + Postgres 16 logical replication advanced + slot advance + pgvector real driver
- testcontainers duck-typing、 mock only + `KIWA_MODE=real` opt-in の 2 layer 走査
- 12 v2 test + 3 Playwright e2e

### `dogfood-mysql-rls-tenant-app` v2

- Nuxt 3 + MySQL 8 group replication + binlog advance + Router R/W split
- testcontainers duck-typing、 primary election + certification conflict detection
- 16 v2 test + 3 Playwright e2e

### `dogfood-sqlite-wal-fts-app` (new)

- Bun edge + SQLite WAL 5-state + FTS5 5-state + libsql testcontainers
- journal_mode WAL 遷移 + checkpoint TRUNCATE + shm mapping + BM25 rank + tokenizer stopword
- 32 vitest + 3 Playwright e2e

## 縦深化 pair pattern 第 4 pair 連続化

v1.32 で kiwa の縦深化 pair pattern (basic mock milestone → 深化 II milestone で real driver + advanced semantics) が 4 pair 連続完成:

1. **Auth pair** (v1.21 → v1.22)
   - v1.21 = `@kiwa/auth` v0.4 4 protocol adapter (WebAuthn L3 / Passkey / OAuth 2.1 / OIDC) mock only
   - v1.22 = Keycloak testcontainers + oauth2-mock-server + Chrome caBLE hybrid transport (real driver) + a11y axe-core gate
2. **Realtime pair** (v1.13 → v1.28)
   - v1.13 = `@kiwa/realtime` v0.1 4 provider (Supabase / Ably / Pusher / Socket.io) × 5 base semantics mock only
   - v1.28 = WebRTC + WebTransport + HTTP/3 + QUIC multiplexing + 8 axis advanced (real driver env-gate)
3. **Streaming pair** (v1.20 → v1.31)
   - v1.20 = `@kiwa/streaming` v0.1 3 provider (Kafka / Redpanda / NATS) × 5 semantics mock only
   - v1.31 = Kafka raw + Redpanda schema + NATS JetStream + 8 axis advanced (real driver env-gate + testcontainers)
4. **Database pair** (v1.14 → v1.32、 this)
   - v1.14-v1.26 = `@kiwa/orm` v0.1-v0.9 3 ORM × 3 backend + 8 base semantics mock only
   - v1.32 = Postgres logical replication + MySQL cluster + SQLite WAL/FTS5 + 8 axis advanced (real driver env-gate + testcontainers)

basic mock → advanced real driver の 2 phase pair を追加 provider に横展開する pattern が SSOT 化された。 v1.25 perf + v1.27 mutation + v1.30 a11y の横串 triple pair と合わせて **kiwa quality gate 縦横 grid maximum extension**。

## v1.11 以降 22 milestone 連続完遂

v1.11 (release gate) → v1.12 (非決定性) → v1.13 (時間軸) → v1.14 (横軸拡張) → v1.15 (AI-LLM 深化) → v1.16 (component 縦軸) → v1.17 (Observability v2) → v1.18 (Blockchain 深化) → v1.19 (Framework 深化) → v1.20 (Streaming 深化) → v1.21 (Auth 深化) → v1.22 (Auth 深化 II) → v1.23 (Payment 深化) → v1.24 (Edge / Serverless 深化) → v1.25 (Perf-harness sweep) → v1.26 (Database 深化) → v1.27 (Mutation testing sweep) → v1.28 (Realtime 深化 II) → v1.29 (release script filter SSOT) → v1.30 (a11y 横串 sweep) → v1.31 (Streaming 深化 II) → **v1.32 (Database 深化 II)**。

22 milestone 連続完遂、 全 sub-Issue land 維持、 kiwa quality gate SSOT を縦深化 pair + 横串 sweep の 2 pattern で拡張し続けている。

## 10 milestone 連続 snippet validation streak

v1.23 (payment) → v1.24 (edge) → v1.25 (perf-harness) → v1.26 (orm-v1.26) → v1.27 (quality-metrics) → v1.28 (realtime) → v1.29 (release-invariants) → v1.30 (a11y) → v1.31 (streaming) → **v1.32 (orm-v1.32)** の 10 milestone 連続 snippet validation。

すべての tutorial code snippet が `packages/{name}/tests/docs-tutorial-v1.XX.test.ts` で automated validation されている。 tutorial が古くなって動かなくなる regression を構造的に遮断する pattern。

## 使い方

```bash
pnpm add -D @kiwa/orm @kiwa/core
```

Postgres logical replication advanced の pure state machine helper:

```typescript
import { createLogicalReplicationAdvancedSession } from '@kiwa/orm/semantics/postgres-logical-replication';

const session = createLogicalReplicationAdvancedSession({
  slot: 'kiwa_slot',
  plugin: 'pgoutput',
  syncCommit: 'remote_apply',
});

// START_REPLICATION handshake
session.startReplication({ startLsn: '0/0' });

// replication origin tracking (subscriber restart survival)
session.advanceOrigin({ origin: 'sub_v1', lsn: '0/1234' });

// two-safe commit confirmation
session.confirmTwoSafe({ standbys: ['s1'] });

// cascaded subscription sync
session.syncCascade({ downstream: 'sub_v2' });

// fidelity check
const coverage = session.collectFidelityCoverage();
expect(coverage.postgresLogicalReplicationAdvanced.axesCovered).toBe(4);
```

real driver env-gate:

```bash
# mock only mode (default)
pnpm test

# real driver mode with testcontainers
KIWA_MODE=real POSTGRES_KEY=1 pnpm test
KIWA_MODE=real MYSQL_KEY=1 pnpm test
KIWA_MODE=real SQLITE_KEY=1 pnpm test
```

Migration guide は https://cardene777.github.io/kiwa/migrations/v1.31-to-v1.32 (additive-only、 breaking change 0)。

## v2.0 candidates

- Multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- Desktop (Electron / Tauri) + mobile (React Native / Expo) adapters
- Coverage 100 % milestone
- Cache depth II (Dragonfly + KeyDB failover + Redis cluster resharding + eviction ML)
- L2 depth (Base / Arbitrum / Optimism / Scroll block-space fidelity)
- ZK depth (Noir / Circom / RISC Zero test harness)
- IoT depth (MQTT / CoAP / LWM2M)
- DB depth III (SurrealDB / EdgeDB / Turso / CockroachDB / TimescaleDB / QuestDB)
- Streaming depth III (Pulsar + KsqlDB + Faust + Flink + Beam pipeline fidelity)
- Auth depth III (WebAuthn L3 + Passkey caBLE + Federation + Verifiable Credentials)
- Perf-harness sweep II (real-machine baseline、 macOS ARM64 + Linux x86_64 + Windows x86_64)
- Mutation sweep II (property-based mutation、 Stryker + fast-check integration + shrink parser)
- Realtime depth III (WebCodecs / WebGPU compute + AV1/VP9 hardware encoding + WHIP/WHEP ingest fidelity)
- A11y sweep II (WCAG 2.2 AAA gate + screen-reader emulator + keyboard-only harness)

Feedback welcome — どの候補が優先されるべきか、 Discussions で議論しませんか。

## リンク

- GitHub: https://github.com/cardene777/kiwa
- Docs: https://cardene777.github.io/kiwa
- Migration guide: https://cardene777.github.io/kiwa/migrations/v1.31-to-v1.32
- Concept doc: https://cardene777.github.io/kiwa/concepts/database-real-driver-testing
- npm: `@kiwa/orm` v0.10.0

Thanks for testing kiwa v1.32 pre-releases and shaping the 縦深化 pair pattern SSOT into a 4-pair grid.
