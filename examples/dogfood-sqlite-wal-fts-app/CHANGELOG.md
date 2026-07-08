# dogfood-sqlite-wal-fts-app CHANGELOG

## 0.0.1 (v1.32-4)

Initial dogfood for the v1.32 Database 深化 II milestone. Drives the
SQLite WAL + FTS5 + Bun-style edge deployment semantics that the
`@kiwa/orm` v0.10 8-axis surface promises for SQLite, from a
provider-neutral adapter (`src/adapters/interface.ts`) with mock +
`SQLITE_KEY`-gated real implementations.

- **AC1** — SQLite WAL 5-state walk (rollback-journal → wal-enabled →
  threshold-crossed → checkpointed → shared-memory-mapped) + FTS5
  5-state walk (empty → virtual-table-created → tokenized → matched →
  vocab-inspected).
- **AC2** — Bun edge deployment roundtrip simulator with deterministic
  cold + warm request latency profile for `bun` / `node` / `workerd`
  runtimes.
- **AC3** — Playwright e2e specs (wal-fts5-edge-flow /
  testcontainers-probe-flow / emit-fidelity-flow) + fidelity harness
  feeding the `@kiwa/quality-metrics` release gate.
