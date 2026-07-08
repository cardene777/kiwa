# kiwa v1.26 released — Database 深化 (8 axis advanced production db semantics + 3 dogfood app rollout)

v1.26 is out. After v1.14 landed `@kiwa/orm` v0.8 with the Drizzle / Prisma / Kysely × SQLite / Postgres / MySQL 3 × 3 provider-backend matrix + testcontainers real driver, v1.26 stacks **8 axis advanced production db semantics** on top of the same 9-combination matrix. Every axis is a `packages/orm/src/semantics/*.ts` pure state-machine helper (no adapter, no network) so tests / fixtures / benches run deterministically. `@kiwa/orm` v0.8.0 → v0.9.0 minor bump reflects the semantics addition — the v0.8 API surface stays completely intact.

## What shipped

- **`@kiwa/orm` v0.9.0** (8 axis advanced production db semantics minor bump). v0.8's Drizzle / Prisma / Kysely × Postgres / MySQL / SQLite matrix + `createOrmEnv` + `applyMigrations` + `seedFixtures` primitives + testcontainers real driver keep every prior signature. v0.9 layers 40 helper functions (8 axis × 5 helpers) on top: `createReplicationSession` / `createCdcSession` / `createLogicalRepSession` / `createMvccSession` / `createRlsSession` / `createPoolSession` / `createPartitioningSession` / `createVectorStoreSession` — every session is a pure transition function over an opaque state object, and every helper is documented in `docs/concepts/db-advanced-testing.md`.
- **v1.26-1 8 axis advanced db semantics land** (Issue #940). 3 provider (Drizzle / Prisma / Kysely) × 3 backend (Postgres / MySQL / SQLite) × 32 neutral event = 288 dialect entry, plus a fidelity harness `collectFidelityCoverage({ providers, backends })` that produces a 3 × 3 × 8 = 72 row grid for release-gate wiring. 222 new behavior tests bring semantics/ statement coverage to 99.54 %, branch 95.61 %, function 100 %. SQLite falls back to neutral event names for server-only axes (streaming replication / wal2json CDC / statement_timeout etc.) so downstream fanout tests keep firing on the SQLite backend without dialect-specific hoops.
- **v1.26-2 dogfood-postgres-cdc-outbox-app** (Issue #941). Postgres 16 logical replication + Debezium-style outbox pattern + Redis Streams consumer with at-least-once + idempotent + backpressure. 5-op adapter (`driveOutbox` / `driveCdcPickup` / `driveReplication` / `driveAtLeastOnce` / `emitFidelity`) with mock backed by v0.9's `createCdcSession` + `createLogicalRepSession` + `createReplicationSession` + `createPoolSession`, and `POSTGRES_BOOTSTRAP` env-gated real. 28 vitest + 1 perf spec + 7 axis release gate PASS.
- **v1.26-3 dogfood-mysql-rls-tenant-app** (Issue #942). Nuxt 3 + Prisma + MySQL 8 row-level security policy + tenant_id auto-injection + cross-tenant refuse + bypass_rls role window + tamper-evident chain-hash audit log (`sha256(prev || entryJson)`, mid-insertion breaks every downstream hash). 5-op adapter (`driveTenantInjection` / `driveCrossTenantRefuse` / `driveBypassAudit` / `driveAuditIntegrity` / `emitFidelity`) with mock backed by v0.9's `createRlsSession` + `MYSQL_KEY` env-gated real. 34 vitest + 7 axis release gate PASS.
- **v1.26-4 dogfood-vector-search-app** (Issue #943). Postgres 16 pgvector IVFFlat + HNSW index + cosine / L2 distance + hybrid semantic + BM25 keyword search (`vectorWeight` in `[0, 1]` with document-id ascending tie-break) + FNV-folded `cacheKey` embedding cache with bounded LRU-ish eviction + on-demand re-index. 5-op adapter (`driveIndexBuild` / `driveSemanticSearch` / `driveHybridSearch` / `driveCacheHitRate` / `emitFidelity`) with mock backed by v0.9's `createVectorStoreSession` + `VECTOR_KEY` env-gated real. 41 vitest + 7 axis release gate PASS.
- **v1.26-5 docs 補強** (Issue #944). tutorial 47 (Postgres CDC + outbox walkthrough) + tutorial 48 (MySQL RLS + tenant walkthrough) + tutorial 49 (pgvector + hybrid search walkthrough) + concept doc `db-advanced-testing.md` (8 axis SSOT + provider × backend fidelity table + 3 dogfood app matrix) + migration guide `v1.25-to-v1.26.md` (additive-only, breaking change 0) + snippet validation `packages/orm/tests/docs-tutorial-v1.26.test.ts` (32 test) re-runs every tutorial code snippet against the real `@kiwa/orm` v0.9 API so drift is structurally blocked.
- **v1.26-6 publish** (Issue #945, this PR). plugin.json 1.25.0 → 1.26.0 + description v1.25 → v1.26 marker + 39 new db-focused keywords + Roadmap ✅ v1.26 row + announcement 4 file + release-smoke `v1-26-publish.test.ts` (7 axis publish artefact invariant) + docs-e2e `V1_26_PAGES` (5 page render check) + release script filter verified (`@kiwa/orm` already covered in build + publish since v1.14).

## Numbers

- **6 sub-Issues resolved** (#940-#945)
- **6 PRs merged** (v1.26-1 + v1.26-2 + v1.26-3 + v1.26-4 + v1.26-5 + this publish PR)
- **1 npm minor bump** (`@kiwa/orm` v0.8.0 → v0.9.0) — kiwa runtime fixture count stays 34
- **222 new semantics behavior tests** (semantics/ statement 99.54 % / branch 95.61 % / function 100 % coverage)
- **103 new dogfood vitest** (28 + 34 + 41)
- **288 dialect entries** (3 provider × 3 backend × 32 neutral event) — 8 axis wiring is fully exhaustive
- **72 row fidelity grid** (3 provider × 3 backend × 8 axis) via `collectFidelityCoverage()`

## Why 8 axis (and not just replication + RLS)

Advanced db testing has 3 failure modes that a 2-3 axis pilot cannot catch, no matter how thorough the pilot suite is.

- **Cross-backend semantics drift**. Postgres logical replication and MySQL row-based replication solve the same problem with completely different wire formats — a fake that only speaks Postgres's `wal2json` will pass every Postgres test and silently break every MySQL test. The 8 axis SSOT pins the neutral event names (`primary-write` / `replica-lagged` / `failover-started` / `promoted`) so downstream code asserts against transitions, not against dialect-specific bytes.
- **Terminal state drift**. Every state machine has a terminal state (revoked mandate, exhausted retry, `bypass_rls` closed window, `POSTGRES_ENV_MISSING` fidelity divergence). If the terminal guard is only asserted on the pilot axis, later axes silently accept re-entries. The 40 helper × 8 axis structure forces every terminal guard to be a test in `packages/orm/tests/*.spec.ts`.
- **Provider overlay drift**. Prisma emits `prisma.pool.acquired`, Drizzle emits `pool.acquired`, Kysely emits `pool.acquired` — the overlay translates the 3 events into the same neutral name. If only Drizzle + Prisma are wired, Kysely users hit a silent gap. The provider overlay is a 3 × 32 = 96 entry table (rendered as the `collectFidelityCoverage()` grid), and the release gate requires every cell to be populated.

The 4 rules in `docs/concepts/db-advanced-testing.md` — 1 axis = 1 file / 1 axis = 5 helpers / neutral events over dialect events / provider overlay only for translation, not for behavior change — are the smallest set that make kiwa db suites comparable across packages, milestones, and forks.

## 16-milestone streak

v1.11 (release gate) → v1.12 (non-determinism) → v1.13 (time-axis) → v1.14 (horizontal expansion) → v1.15 (AI-LLM depth) → v1.16 (component depth) → v1.17 (Observability v2) → v1.18 (Blockchain depth) → v1.19 (Framework depth) → v1.20 (Streaming depth) → v1.21 (Auth depth) → v1.22 (Auth depth II) → v1.23 (Payment depth) → v1.24 (Edge / Serverless depth) → v1.25 (Perf-harness sweep) → **v1.26 (Database depth)**. Every milestone since v1.11 has landed 6 sub-Issues in full.

## v2.0 candidates

- Multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- Desktop (Electron / Tauri) + mobile (React Native / Expo) adapters
- Coverage 100% milestone
- Cache / Data depth (Dragonfly / Materialize / Neon)
- L2 depth (Base / Arbitrum / Optimism / Scroll block-space fidelity)
- ZK depth (Noir / Circom / RISC Zero test harness)
- IoT depth (MQTT / CoAP / LWM2M)
- DB depth II (SurrealDB / EdgeDB / Turso / CockroachDB / TimescaleDB / QuestDB)
- Perf-harness sweep II — real-machine baseline (macOS ARM64 + Linux x86_64 + Windows x86_64 3 hardware matrix + CI reproducibility harness)

Feedback welcome on which of these should land next.
