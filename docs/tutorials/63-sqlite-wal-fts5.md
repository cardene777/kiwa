# SQLite WAL + FTS5 — journal_mode switch + wal_checkpoint + virtual table + tokenizer + BM25 rank in 15 min

## What you'll build

A vitest suite wired to `@kiwa-lab/orm` v0.10 that models the pieces of SQLite that every edge-deployed dApp eventually needs — `PRAGMA journal_mode = WAL` (switching from rollback-journal to write-ahead log so multiple readers stop blocking a single writer), `wal_autocheckpoint` size threshold (the WAL file grows until `wal_checkpoint` runs — either automatically or explicitly), `PRAGMA wal_checkpoint(TRUNCATE)` (advancing the WAL, checkpointing dirty pages, and truncating the WAL file when possible), shared-memory `-shm` region mapping (the wal-index that turns "read the WAL" into "read a memory-mapped array"), plus FTS5 virtual tables (`CREATE VIRTUAL TABLE ... USING fts5`), tokenizer configuration (`unicode61` / `porter` / `trigram`), `MATCH` queries with BM25 ranking, and `fts5vocab` term inspection. `createSqliteWalSession()` and `createFts5Session()` give you every one of those pieces as a deterministic state machine — `rollback-journal` → `wal-enabled` → `threshold-crossed` → `checkpointed` → `shared-memory-mapped`, and `empty` → `virtual-table-created` → `tokenized` → `matched` → `vocab-inspected`. No `sqlite3` binary boot, no `libsql-server`, no `-shm` on-disk poking. This is the pattern kiwa's v1.32-4 dogfood app exercises against real libsql / SQLite testcontainers under the fidelity harness.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-sqlite-wal-fts && cd kiwa-sqlite-wal-fts
pnpm init
pnpm add -D @kiwa-lab/orm@^0.10 vitest typescript @types/node
```

Add the vitest scripts in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run"
  }
}
```

The v0.10 surface exports `createSqliteWalSession` and `createFts5Session` from the semantics barrel. This tutorial covers axes 13 (SQLite WAL) and 14 (FTS5) of the 16-axis grid; tutorial 61 covers axis 9 (Postgres logical replication advanced), tutorial 62 covers axis 11 (MySQL cluster group replication).

### 2. `switchJournalMode` — flip to WAL mode

`tests/wal/journal-mode.test.ts` — the first thing a WAL-mode SQLite app does is run `PRAGMA journal_mode = WAL`. The mock enforces that the switch runs from `rollback-journal` state (the SQLite default) — a test that tries to switch again after already being in WAL is a mis-configuration.

```ts
import { describe, expect, it } from 'vitest';
import { createSqliteWalSession, switchJournalMode } from '@kiwa-lab/orm';

describe('WAL — switchJournalMode', () => {
  it('flips journal_mode from DELETE to WAL and records the event', () => {
    const session = createSqliteWalSession({
      databasePath: '/tmp/kiwa.db',
      provider: 'kysely',
      backend: 'sqlite',
    });

    const step = switchJournalMode(session, { mode: 'WAL' });

    expect(step.state).toBe('wal-enabled');
    expect(step.neutralEvent).toBe('wal.journal-mode-switched');
    expect(step.backendEvent).toBe('pragma_journal_mode.wal');
    expect(step.metadata.mode).toBe('WAL');
    expect(session.journalMode).toBe('WAL');
  });

  it('rejects a second switch — journal_mode is one-way in this state machine', () => {
    const session = createSqliteWalSession({
      databasePath: '/tmp/kiwa.db',
      provider: 'kysely',
      backend: 'sqlite',
    });
    switchJournalMode(session, { mode: 'WAL' });
    expect(() => switchJournalMode(session, { mode: 'WAL' })).toThrow(
      /requires rollback-journal state/,
    );
  });
});
```

The rule of thumb is that `PRAGMA journal_mode = WAL` is idempotent in real SQLite but the state machine keeps it strict — a test that tries to switch twice has a bug in setup order. The backend event dialect `pragma_journal_mode.wal` matches the SQLite instrumentation string real deployments trace on.

### 3. `crossWalSizeThreshold` — WAL grows past the checkpoint threshold

`tests/wal/threshold-crossed.test.ts` — SQLite writes go to the WAL file first. When the WAL file exceeds `wal_autocheckpoint * page_size` bytes, a checkpoint is triggered. The mock enforces the check `walSizeBytes > thresholdBytes` — a test that claims a threshold cross with `walSizeBytes <= thresholdBytes` has a copy-paste bug.

```ts
import { describe, expect, it } from 'vitest';
import {
  createSqliteWalSession,
  switchJournalMode,
  crossWalSizeThreshold,
} from '@kiwa-lab/orm';

describe('WAL — crossWalSizeThreshold', () => {
  it('records the WAL size and transitions to threshold-crossed', () => {
    const session = createSqliteWalSession({
      databasePath: '/tmp/kiwa.db',
      provider: 'kysely',
      backend: 'sqlite',
    });
    switchJournalMode(session, { mode: 'WAL' });

    const step = crossWalSizeThreshold(session, {
      walSizeBytes: 8_192_000,
      thresholdBytes: 4_096_000,
    });

    expect(step.state).toBe('threshold-crossed');
    expect(step.metadata.walSizeBytes).toBe(8_192_000);
    expect(step.metadata.thresholdBytes).toBe(4_096_000);
    expect(session.walSizeBytes).toBe(8_192_000);
  });

  it('rejects walSizeBytes <= thresholdBytes — not a threshold cross', () => {
    const session = createSqliteWalSession({
      databasePath: '/tmp/kiwa.db',
      provider: 'kysely',
      backend: 'sqlite',
    });
    switchJournalMode(session, { mode: 'WAL' });
    expect(() =>
      crossWalSizeThreshold(session, { walSizeBytes: 4_096_000, thresholdBytes: 4_096_000 }),
    ).toThrow(/must exceed thresholdBytes/);
  });
});
```

The threshold is why WAL mode does not grow the WAL file forever — the auto-checkpoint kicks in and copies dirty pages from the WAL into the main DB file. On a busy write-heavy edge deployment, tuning `wal_autocheckpoint` down from the default 1000 pages to something like 100 pages keeps the WAL small at the cost of more frequent checkpoint I/O; the mock lets you test both boundaries deterministically.

### 4. `triggerWalCheckpoint` — copy WAL pages + truncate

`tests/wal/checkpointed.test.ts` — a `PRAGMA wal_checkpoint(TRUNCATE)` runs the copy phase (WAL → main DB) and then truncates the WAL file back to zero when there are no active readers.

```ts
import { describe, expect, it } from 'vitest';
import {
  createSqliteWalSession,
  switchJournalMode,
  crossWalSizeThreshold,
  triggerWalCheckpoint,
} from '@kiwa-lab/orm';

describe('WAL — triggerWalCheckpoint', () => {
  it('runs a TRUNCATE checkpoint and resets the WAL size to 0', () => {
    const session = createSqliteWalSession({
      databasePath: '/tmp/kiwa.db',
      provider: 'kysely',
      backend: 'sqlite',
    });
    switchJournalMode(session, { mode: 'WAL' });
    crossWalSizeThreshold(session, { walSizeBytes: 8_192_000, thresholdBytes: 4_096_000 });

    const step = triggerWalCheckpoint(session, { mode: 'TRUNCATE' });

    expect(step.state).toBe('checkpointed');
    expect(step.backendEvent).toBe('pragma_wal_checkpoint');
    expect(step.metadata.mode).toBe('TRUNCATE');
    expect(step.metadata.checkpointCount).toBe(1);
    expect(step.metadata.walSizeBytes).toBe(0);
  });

  it('keeps the WAL size for a PASSIVE checkpoint — non-truncate modes leave the file', () => {
    const session = createSqliteWalSession({
      databasePath: '/tmp/kiwa.db',
      provider: 'kysely',
      backend: 'sqlite',
    });
    switchJournalMode(session, { mode: 'WAL' });
    crossWalSizeThreshold(session, { walSizeBytes: 8_192_000, thresholdBytes: 4_096_000 });

    const step = triggerWalCheckpoint(session, { mode: 'PASSIVE' });

    expect(step.state).toBe('checkpointed');
    expect(step.metadata.walSizeBytes).toBe(8_192_000);
  });
});
```

The 4 modes (`PASSIVE` / `FULL` / `RESTART` / `TRUNCATE`) each have different trade-offs — `PASSIVE` is the softest (best-effort, safe under concurrent readers), `TRUNCATE` is the most aggressive (shrinks the file back to zero, requires no readers). The mock only truncates on `TRUNCATE` mode, matching the real SQLite behavior. Tests that assert on WAL size after checkpoint can catch a regression where the mode was silently switched.

### 5. `mapSharedMemory` — the wal-index

`tests/wal/shared-memory.test.ts` — SQLite in WAL mode uses a `-shm` file that is memory-mapped into every connection's address space. This is what lets readers see the newest committed data without opening the WAL file itself.

```ts
import { describe, expect, it } from 'vitest';
import {
  createSqliteWalSession,
  switchJournalMode,
  crossWalSizeThreshold,
  triggerWalCheckpoint,
  mapSharedMemory,
} from '@kiwa-lab/orm';

describe('WAL — mapSharedMemory', () => {
  it('maps a positive region and flips the shared-memory-mapped flag', () => {
    const session = createSqliteWalSession({
      databasePath: '/tmp/kiwa.db',
      provider: 'kysely',
      backend: 'sqlite',
    });
    switchJournalMode(session, { mode: 'WAL' });
    crossWalSizeThreshold(session, { walSizeBytes: 8_192_000, thresholdBytes: 4_096_000 });
    triggerWalCheckpoint(session, { mode: 'TRUNCATE' });

    const step = mapSharedMemory(session, { regionBytes: 32_768 });

    expect(step.state).toBe('shared-memory-mapped');
    expect(step.backendEvent).toBe('wal_index.shm_mapped');
    expect(step.metadata.regionBytes).toBe(32_768);
    expect(session.sharedMemoryMapped).toBe(true);
  });

  it('rejects a zero region — the wal-index needs a positive mapping', () => {
    const session = createSqliteWalSession({
      databasePath: '/tmp/kiwa.db',
      provider: 'kysely',
      backend: 'sqlite',
    });
    switchJournalMode(session, { mode: 'WAL' });
    crossWalSizeThreshold(session, { walSizeBytes: 8_192_000, thresholdBytes: 4_096_000 });
    triggerWalCheckpoint(session, { mode: 'TRUNCATE' });
    expect(() => mapSharedMemory(session, { regionBytes: 0 })).toThrow(
      /regionBytes must be positive/,
    );
  });
});
```

The `-shm` file is the piece that makes WAL mode fast — but it also creates the "the -shm file is stuck open after a crash" recovery mode that read-only tools need to handle. The mock enforces `regionBytes > 0` because a zero-byte mapping is what a stale `-shm` looks like.

### 6. FTS5 — virtual table + tokenizer + MATCH + rank

`tests/fts5/full-flow.test.ts` — FTS5 is SQLite's built-in full-text search. The lifecycle is `CREATE VIRTUAL TABLE ... USING fts5` → tokenize documents → `MATCH` queries with BM25 rank → `fts5vocab` inspection.

```ts
import { describe, expect, it } from 'vitest';
import {
  createFts5Session,
  createFts5VirtualTable,
  tokenizeFts5Document,
  matchFts5Query,
  inspectFts5Vocab,
} from '@kiwa-lab/orm';

describe('FTS5 — full lifecycle', () => {
  it('creates the virtual table with unicode61 tokenizer', () => {
    const session = createFts5Session({
      tableName: 'docs_fts',
      provider: 'kysely',
      backend: 'sqlite',
    });

    const step = createFts5VirtualTable(session, {
      columns: ['title', 'body'],
      tokenizer: 'unicode61',
    });

    expect(step.state).toBe('virtual-table-created');
    expect(step.backendEvent).toBe('fts5.virtual_table_created');
    expect(step.metadata.columnCount).toBe(2);
    expect(step.metadata.tokenizer).toBe('unicode61');
  });

  it('rejects an empty columns array — FTS5 needs at least one column', () => {
    const session = createFts5Session({
      tableName: 'docs_fts',
      provider: 'kysely',
      backend: 'sqlite',
    });
    expect(() =>
      createFts5VirtualTable(session, { columns: [], tokenizer: 'unicode61' }),
    ).toThrow(/at least one column/);
  });

  it('tokenizes a document and counts tokens', () => {
    const session = createFts5Session({
      tableName: 'docs_fts',
      provider: 'kysely',
      backend: 'sqlite',
    });
    createFts5VirtualTable(session, { columns: ['title', 'body'], tokenizer: 'porter' });

    const step = tokenizeFts5Document(session, {
      document: 'the quick brown fox jumps',
    });

    expect(step.state).toBe('tokenized');
    expect(step.backendEvent).toBe('fts5.tokenizer_configured');
    expect(step.metadata.tokenCount).toBe(5);
    expect(step.metadata.tokenizer).toBe('porter');
  });

  it('matches a query and records the BM25 rank', () => {
    const session = createFts5Session({
      tableName: 'docs_fts',
      provider: 'kysely',
      backend: 'sqlite',
    });
    createFts5VirtualTable(session, { columns: ['title', 'body'], tokenizer: 'trigram' });
    tokenizeFts5Document(session, { document: 'the quick brown fox jumps' });

    const step = matchFts5Query(session, { query: 'quick fox', rank: -1.234 });

    expect(step.state).toBe('matched');
    expect(step.backendEvent).toBe('fts5.bm25_rank');
    expect(step.metadata.query).toBe('quick fox');
    expect(step.metadata.rank).toBe(-1.234);
    expect(session.lastRank).toBe(-1.234);
  });

  it('inspects the vocab table for a term', () => {
    const session = createFts5Session({
      tableName: 'docs_fts',
      provider: 'kysely',
      backend: 'sqlite',
    });
    createFts5VirtualTable(session, { columns: ['title', 'body'], tokenizer: 'unicode61' });
    tokenizeFts5Document(session, { document: 'the quick brown fox' });
    matchFts5Query(session, { query: 'quick', rank: -0.5 });

    const step = inspectFts5Vocab(session, { term: 'fox', occurrences: 42 });

    expect(step.state).toBe('vocab-inspected');
    expect(step.backendEvent).toBe('fts5vocab.inspected');
    expect(step.metadata.term).toBe('fox');
    expect(step.metadata.occurrences).toBe(42);
  });
});
```

The 3 tokenizer options (`unicode61` / `porter` / `trigram`) each fit a different use case — `unicode61` for locale-neutral tokenization (default in most apps), `porter` for English-only stemming (`jumps` → `jump`), `trigram` for character-level match on languages without whitespace (Japanese / Chinese). BM25 rank is negative in SQLite FTS5 (lower = more relevant); the mock's `rank` field takes a `number` so tests can assert on ordering. The `fts5vocab` inspection is what a "did this term ever get indexed?" test asks — a term with 0 occurrences means the tokenizer skipped it (e.g., a stopword removed by porter).

## What you learned

The 5 WAL pieces (journal_mode switch, threshold cross, checkpoint, shared memory) + the 4 FTS5 pieces (virtual table, tokenize, match+rank, vocab) are the ones every edge SQLite deployment hits. `@kiwa-lab/orm` v0.10 models them with deterministic state machines so tests run in milliseconds. Under `KIWA_MODE=real SQLITE_KEY=...`, the fidelity harness runs the same assertions against real libsql / SQLite testcontainers — the v1.32-4 `dogfood-sqlite-wal-fts-app` does exactly that.

## Next

- Tutorial 61 — Postgres logical replication advanced (streaming + origin + two-safe + cascade)
- Tutorial 62 — MySQL group replication (member join / primary election / conflict detection / member leave)
- Concept — `docs/concepts/database-real-driver-testing.md` (16 axis × 3 provider = 48 row grid + testcontainers pattern SSOT)
- Migration — `docs/migrations/v1.31-to-v1.32.md` (orm v0.9 → v0.10 opt-in surface + no breakage)
