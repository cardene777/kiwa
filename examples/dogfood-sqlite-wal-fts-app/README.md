# dogfood-sqlite-wal-fts-app

Dogfood app for v1.32-4 — a SQLite WAL + FTS5 full-text-search notebook
backed by Bun-style edge-deployment semantics driven by
`@kiwa-test/orm` v0.10 in `KIWA_MODE=mock` and a libsql / turso edge
driver in `KIWA_MODE=real` (`SQLITE_KEY`-gated).
The dogfood exercises 4 v1.32-4 axes:

1. **SQLite WAL full journey** — 5-state walk (rollback-journal →
   wal-enabled → threshold-crossed → checkpointed →
   shared-memory-mapped) driven through orm v0.10's
   `createSqliteWalSession` + `switchJournalMode` +
   `crossWalSizeThreshold` + `triggerWalCheckpoint` + `mapSharedMemory`.
   Records the final journal mode, checkpoint count, WAL size after
   TRUNCATE, and shared-memory region size.
2. **FTS5 full journey** — 5-state walk (empty → virtual-table-created →
   tokenized → matched → vocab-inspected) driven through orm v0.10's
   `createFts5Session` + `createFts5VirtualTable` +
   `tokenizeFts5Document` + `matchFts5Query` + `inspectFts5Vocab`.
   Records the tokenizer (`unicode61` / `porter` / `trigram`), token
   count, match rank, and vocab occurrence.
3. **Bun edge roundtrip** — deterministic cold + warm request profile
   for `bun` / `node` / `workerd` runtimes across a named edge region
   (defaults to `iad`). Cold start is dominated by runtime boot
   (bun ≈ 4 ms, node ≈ 32 ms, workerd ≈ 1 ms); warm samples decay to
   a sub-millisecond floor with a deterministic region-seeded jitter so
   fidelity samples never depend on wall-clock jitter.
4. **Testcontainers duck-type probe** — libsql / SQLite container image
   lookup + `host:port` echo, `SQLITE_KEY`-gated + `SQLITE_IMAGE` /
   `LIBSQL_IMAGE` overrides for v1.32-6 wiring.

All 5 ops (4 axes + `emitFidelity`) are driven end-to-end through a
provider-neutral adapter (`src/adapters/interface.ts`) with mock
(`src/adapters/mock.ts`) and real (`src/adapters/real.ts`)
implementations. The real adapter is `SQLITE_KEY`-gated so
`KIWA_MODE=real` can hand off to a libsql / turso edge broker without
breaking mock runs.

## Layout

```
src/
  wal/index.ts                  # v1.32-4 axis 1 — WAL 5-state walk flow
  fts5/index.ts                 # v1.32-4 axis 2 — FTS5 5-state walk flow
  edge/index.ts                 # v1.32-4 axis 3 — Bun edge roundtrip simulator
  adapters/
    interface.ts                # 5-op driver contract shared by mock/real
    mock.ts                     # orm-semantics-backed adapter
    real.ts                     # SQLITE_KEY-driven adapter (skip mode default)
  flows/
    fidelity.ts                 # trace diff + quality-metrics release-gate report
tests/
  wal-full-journey.test.ts      # T-DSW-WAL-* — SQLite WAL 5-state walk
  fts5-full-journey.test.ts     # T-DSW-FTS-* — FTS5 5-state walk
  edge-roundtrip.test.ts        # T-DSW-EDGE-* — Bun edge roundtrip
  testcontainers-probe.test.ts  # T-DSW-TC-* — libsql image echo
  fidelity-report.test.ts       # T-DSF-* — fidelity harness output (5-op)
  emit-fidelity-report.test.ts  # T-DSE-EM-* — quality-report/ writeback (5-op)
  e2e-mock-mode.test.ts         # T-DSW-E2E-* — 5-op adapter surface E2E
  real-adapter-probe.test.ts    # T-DSW-REAL-* — env-gated probe
  e2e/
    fixture.ts                  # ad-hoc HTTP server + browser-cache detect
    wal-fts5-edge-flow.spec.ts  # Playwright — WAL + FTS5 + edge flow
    testcontainers-probe-flow.spec.ts  # Playwright — libsql image echo flow
    emit-fidelity-flow.spec.ts  # Playwright — release-gate trace feed
```

## Running

```sh
pnpm --filter dogfood-sqlite-wal-fts-app test
pnpm --filter dogfood-sqlite-wal-fts-app test:e2e
pnpm --filter dogfood-sqlite-wal-fts-app typecheck
```

To exercise the connected real adapter probe (aliveness only in v1.32-4):

```sh
SQLITE_KEY=libsql://kiwa-notebook.turso.io \
  pnpm --filter dogfood-sqlite-wal-fts-app test
```

## Quality report

Latest fidelity snapshot lands at `quality-report/fidelity-latest.md`
after `emit-fidelity-report.test.ts` runs. Combined with the sibling
`dogfood-postgres-cdc-outbox-app` (v1.32-2) + `dogfood-mysql-rls-tenant-app`
(v1.32-3) reports, this feeds the v1.32-6 publish release-smoke harness
alongside the orm v0.10 8-axis 469-test grid.
