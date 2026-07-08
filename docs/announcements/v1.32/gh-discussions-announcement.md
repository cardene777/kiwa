# kiwa v1.32 released — Database 深化 II (@kiwa/orm v0.10.0 + 8 axis advanced db semantics + real driver + 縦深化 pair 第 4 pair 連続化 + 10 milestone snippet streak)

v1.32 is out. v1.14 (orm 3 provider × 3 backend + testcontainers mock) → v1.26 (orm v0.9 8 axis base semantics) → v1.32 (orm v0.10 8 axis advanced + real driver + 縦深化 pair 第 4 pair) で **縦深化 pair pattern 第 4 pair 連続化** (Auth v1.21→v1.22 + Realtime v1.13→v1.28 + Streaming v1.20→v1.31 に続く database real driver 4 pair 目)。 v1.30 quality gate maximum grid (13 axis) を database real driver に適用、 kiwa の縦深化戦略 SSOT を database production layer に拡張した milestone。

## What shipped

- **`@kiwa/orm` v0.9.0 → v0.10.0 minor bump**。 8 axis advanced production db semantics + real driver env-gate + 3 ORM × 3 backend × 8 axis neutral state machine を追加。 v0.9 API は完全維持 (additive-only 契約)。
- **v1.32-1 orm v0.10 8 axis semantics** (Issue #1022)。 `packages/orm/src/semantics/*` に 1 axis = 1 file の pure state machine helper を実装。 Postgres logical replication (pub/sub + wal_level + slot + origin filtering) / Postgres MVCC internals (snapshot + xid + vacuum + wraparound + freeze) / MySQL cluster (group replication + InnoDB cluster + router + read replica routing) / MySQL binlog (row/statement/mixed + GTID + resync) / SQLite WAL mode (journal + checkpoint + shm + read snapshot) / SQLite FTS5 (virtual table + tokenizer + snippet + BM25 rank) / Cross-DB transaction isolation (READ UNCOMMITTED → SERIALIZABLE) / Connection pool advanced (health check + failover + pgbouncer + ProxySQL + statement cache) の 8 axis を統一実装、 3 ORM × 3 backend × 8 axis fidelity harness 144 row grid (v1.26 8 axis + v1.32 8 axis の縦横 SSOT 拡張) を確立、 469 semantics behavior test 追加。
- **v1.32-2 dogfood-postgres-cdc-outbox-app v2** (Issue #1023)。 Postgres 16 logical replication advanced + slot advance + pgvector real driver + testcontainers duck-typing、 12 v2 test + 3 Playwright e2e。 mock only mode + `KIWA_MODE=real` opt-in の 2 layer 走査。
- **v1.32-3 dogfood-mysql-rls-tenant-app v2** (Issue #1024)。 MySQL 8 group replication + binlog advance + Router R/W split + testcontainers duck-typing、 16 v2 test + 3 Playwright e2e。 primary election + certification conflict detection を統一 mock 化。
- **v1.32-4 dogfood-sqlite-wal-fts-app 新規** (Issue #1025)。 SQLite WAL 5-state + FTS5 5-state + Bun edge roundtrip + libsql testcontainers、 32 vitest + 3 Playwright e2e。 journal_mode WAL 遷移 + checkpoint TRUNCATE + shm mapping + BM25 rank + tokenizer stopword 5 axis を統一処理。
- **v1.32-5 docs 補強** (Issue #1026)。 `docs/tutorials/61-postgres-logical-replication-advanced.md` (streaming start + replication origin + two-safe commit + cascaded subscription walkthrough) + `docs/tutorials/62-mysql-group-replication.md` (member join + primary election + conflict detection + member leave walkthrough) + `docs/tutorials/63-sqlite-wal-fts5.md` (journal_mode + checkpoint + virtual table + tokenizer + BM25 rank walkthrough) + `docs/migrations/v1.31-to-v1.32.md` (additive-only、 breaking change 0) + `docs/concepts/database-real-driver-testing.md` (16 axis SSOT + real driver 環境変数 SSOT + provider × backend fidelity table) + `packages/orm/tests/docs-tutorial-v1.32.test.ts` snippet validation で **10 milestone 連続 snippet validation pattern** (v1.23-v1.32) 達成。
- **v1.32-6 publish** (Issue #1027, this PR)。 `.claude-plugin/plugin.json` 1.31.0 → 1.32.0 + description v1.32 section + database keywords + Roadmap ✅ v1.32 row + announcement 4 file + release-smoke `v1-32-publish.test.ts` (7 axis publish artefact invariant) + docs-e2e `V1_32_PAGES` (5 page render check) + `pnpm run release` 経由 npm publish (`@kiwa/orm` v0.10.0) + `/docs-publish-kiwa` 経由 gh-pages 反映。

## Numbers

- **6 sub-Issues resolved** (#1022 / #1023 / #1024 / #1025 / #1026 / #1027)
- **6 PRs merged** (v1.32-1 through v1.32-6)
- **1 npm minor bump** (`@kiwa/orm` v0.9.0 → v0.10.0) — kiwa runtime fixture **35 packages** 維持
- **8 axis advanced db semantics** (Postgres logical replication + Postgres MVCC + MySQL cluster + MySQL binlog + SQLite WAL + SQLite FTS5 + txn isolation + connection pool advanced)
- **3 ORM × 3 backend × 16 axis fidelity harness** (Drizzle / Prisma / Kysely × Postgres / MySQL / SQLite × v1.26 8 base + v1.32 8 advanced = 144 row grid)
- **3 dogfood db app v2 / 新規** (postgres-cdc-outbox-app v2 + mysql-rls-tenant-app v2 + sqlite-wal-fts-app 新規)
- **10 milestone 連続 snippet validation streak** (v1.23-v1.32) — payment / edge / perf-harness / orm-v1.26 / quality-metrics / realtime / release-invariants / a11y / streaming / orm-v1.32

## Why 縦深化 pair pattern 第 4 pair 連続化

kiwa milestone は縦深化 pair pattern (基礎 mock milestone → 深化 II milestone で real driver + advanced semantics) を 4 pair 連続確立。

- **Auth pair (v1.21 → v1.22)** ... `@kiwa/auth` v0.4 4 protocol adapter (mock only) → Keycloak testcontainers + oauth2-mock-server + Chrome caBLE hybrid transport (real driver + a11y axe-core gate)
- **Realtime pair (v1.13 → v1.28)** ... `@kiwa/realtime` v0.1 4 provider 5 base semantics (mock only) → WebRTC + WebTransport + HTTP/3 + QUIC multiplexing + 8 axis advanced (real driver env-gate)
- **Streaming pair (v1.20 → v1.31)** ... `@kiwa/streaming` v0.1 3 provider 5 semantics (mock only) → Kafka raw + Redpanda schema + NATS JetStream + 8 axis advanced (real driver env-gate + testcontainers)
- **Database pair (v1.14 → v1.32、 this)** ... `@kiwa/orm` v0.1-v0.9 3 provider × 3 backend + 8 base semantics (v1.26) → v0.10 8 advanced semantics + real driver env-gate + Postgres logical replication + MySQL cluster + SQLite WAL/FTS5 (this)

4 pair 連続化で kiwa の縦深化戦略が SSOT として database production layer まで拡張された。 basic mock → advanced real driver の 2 phase pair を追加 provider に横展開する pattern が確立、 縦深化 pair pattern SSOT を pair fifth candidate (Cache v1.14 → depth II or Payment v1.23 → depth II) に応用できる basis を提供。

## 21 → 22 milestone streak

v1.11 (release gate) → v1.12 (非決定性) → v1.13 (時間軸) → v1.14 (横軸拡張) → v1.15 (AI-LLM 深化) → v1.16 (component 縦軸) → v1.17 (Observability v2) → v1.18 (Blockchain 深化) → v1.19 (Framework 深化) → v1.20 (Streaming 深化) → v1.21 (Auth 深化) → v1.22 (Auth 深化 II) → v1.23 (Payment 深化) → v1.24 (Edge / Serverless 深化) → v1.25 (Perf-harness sweep) → v1.26 (Database 深化) → v1.27 (Mutation testing sweep) → v1.28 (Realtime 深化 II) → v1.29 (release script filter SSOT) → v1.30 (a11y 横串 sweep) → v1.31 (Streaming 深化 II) → **v1.32 (Database 深化 II)**。 v1.11 以降 22 milestone 連続完遂、 全 sub-Issue land 維持。

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

Feedback welcome on which of these should land next.

## Try it

```bash
pnpm add -D @kiwa/orm
```

See the [migration guide](https://cardene777.github.io/kiwa/migrations/v1.31-to-v1.32) for upgrade notes. Zero breaking changes.

## Thanks

Thanks to everyone who reviewed the v1.32 sub-Issues, tested `@kiwa/orm` v0.10 pre-release, and helped shape the 縦深化 pair pattern SSOT into a 4-pair grid. On to v2.0.
