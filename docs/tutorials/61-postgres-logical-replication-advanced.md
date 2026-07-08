# Postgres logical replication advanced — streaming start + replication origin + two-safe commit + cascaded subscription in 15 min

## What you'll build

A vitest suite wired to `@kiwa/orm` v0.10 that models the 4 advanced pieces of Postgres logical replication that every non-trivial CDC pipeline eventually trips over — `START_REPLICATION` protocol handshake with `pgoutput` (KIP-style protocol version + start LSN), replication origin tracking (`pg_replication_origin_advance` so a subscriber can survive a restart without re-reading the whole slot), two-safe commit confirmation (`synchronous_commit = remote_apply` with at least one synchronous standby), and cascaded subscription sync (an upstream subscriber that itself becomes a publisher for a downstream). `createLogicalReplicationAdvancedSession()` gives you every one of those pieces as a deterministic state machine — `idle` → `streaming` → `origin-tracked` → `two-safe-confirmed` → `cascade-synced`. No `pg_ctl start`, no `docker run postgres`, no `wal_level = logical` PGDATA edit. This is the pattern kiwa's Postgres dogfood app (v1.32-2) exercises against real Postgres 16 testcontainers under the fidelity harness; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "the subscriber restarted and re-read 40 MB of WAL" case reviewers ask about.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-pg-logical-adv && cd kiwa-pg-logical-adv
pnpm init
pnpm add -D @kiwa/orm@^0.10 vitest typescript @types/node
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

The v0.10 surface exports `createLogicalReplicationAdvancedSession` from the semantics barrel. This tutorial focuses on axis 9 of the 16-axis grid; tutorial 62 covers axis 11 (MySQL cluster group replication), tutorial 63 covers axis 13 (SQLite WAL + FTS5).

### 2. `startLogicalStreaming` — the pgoutput handshake

`tests/logical-adv/streaming-started.test.ts` — the first thing a subscriber does after `pg_create_logical_replication_slot` is call `START_REPLICATION SLOT ... LOGICAL <lsn>`. The broker replies with `CopyBoth` and the subscriber consumes `pgoutput` messages from the start LSN onward.

```ts
import { describe, expect, it } from 'vitest';
import { createLogicalReplicationAdvancedSession, startLogicalStreaming } from '@kiwa/orm';

describe('logical replication — startLogicalStreaming', () => {
  it('opens a pgoutput stream from a positive start LSN and protocol version 1+', () => {
    const session = createLogicalReplicationAdvancedSession({
      streamId: 'orders-outbox',
      provider: 'drizzle',
      backend: 'postgres',
    });

    const step = startLogicalStreaming(session, { startLsn: 42_000_000, protocolVersion: 2 });

    expect(step.state).toBe('streaming');
    expect(step.neutralEvent).toBe('logical-advanced.streaming-started');
    expect(step.backendEvent).toBe('pgoutput.start_replication');
    expect(step.metadata.startLsn).toBe(42_000_000);
    expect(step.metadata.protocolVersion).toBe(2);
  });

  it('rejects a non-positive start LSN — a subscriber that starts at 0 gets the whole slot re-read', () => {
    const session = createLogicalReplicationAdvancedSession({
      streamId: 'orders-outbox',
      provider: 'drizzle',
      backend: 'postgres',
    });
    expect(() =>
      startLogicalStreaming(session, { startLsn: 0, protocolVersion: 2 }),
    ).toThrow(/startLsn must be positive/);
  });
});
```

The rule of thumb is that the start LSN is what makes a subscriber restart cheap. A real subscriber persists `confirmed_flush_lsn` on shutdown and passes that as `startLsn` on restart; the mock enforces `startLsn > 0` so a test that forgets to persist the LSN fails immediately instead of silently re-reading the entire slot on every reboot. The backend event dialect `pgoutput.start_replication` is the string real `pg_replication_origin_progress` emits when the walsender flips into `CopyBoth`.

### 3. `trackReplicationOrigin` — survive a subscriber restart

`tests/logical-adv/origin-tracked.test.ts` — every logical subscriber advances a named replication origin as it applies remote transactions. `pg_replication_origin_advance('sub_orders', <lsn>)` persists the position so a restart re-uses it instead of paying the walsender for the same WAL twice.

```ts
import { describe, expect, it } from 'vitest';
import {
  createLogicalReplicationAdvancedSession,
  startLogicalStreaming,
  trackReplicationOrigin,
} from '@kiwa/orm';

describe('replication origin — advance', () => {
  it('records the remote LSN and switches to origin-tracked', () => {
    const session = createLogicalReplicationAdvancedSession({
      streamId: 'orders-outbox',
      provider: 'drizzle',
      backend: 'postgres',
    });
    startLogicalStreaming(session, { startLsn: 42_000_000, protocolVersion: 2 });

    const step = trackReplicationOrigin(session, { originId: 'sub_orders', remoteLsn: 42_010_000 });

    expect(step.state).toBe('origin-tracked');
    expect(step.metadata.originId).toBe('sub_orders');
    expect(step.metadata.remoteLsn).toBe(42_010_000);
    expect(session.confirmedLsn).toBe(42_010_000);
  });

  it('rejects a remote LSN that precedes the stream start — origin can only move forward', () => {
    const session = createLogicalReplicationAdvancedSession({
      streamId: 'orders-outbox',
      provider: 'drizzle',
      backend: 'postgres',
    });
    startLogicalStreaming(session, { startLsn: 42_000_000, protocolVersion: 2 });
    expect(() =>
      trackReplicationOrigin(session, { originId: 'sub_orders', remoteLsn: 41_999_000 }),
    ).toThrow(/remoteLsn cannot precede startLsn/);
  });
});
```

The invariant is monotonic — `remoteLsn >= startLsn` always. A subscriber that gets a `remoteLsn` smaller than its own `startLsn` has drifted off the slot, and the guard fires before the fake origin bakes into a downstream test. Real Postgres emits `pg_replication_origin.progress` on every apply; the mock's `backendEvent` string mirrors that dialect so tests wired to runtime telemetry keep matching after the switch to real driver mode.

### 4. `confirmTwoSafeCommit` — synchronous_commit = remote_apply

`tests/logical-adv/two-safe-confirmed.test.ts` — a two-safe commit waits for at least one synchronous standby to `remote_apply` before the primary acks the client. The mock enforces (1) at least one synchronous standby, (2) `confirmedFlushLsn` never regresses.

```ts
import { describe, expect, it } from 'vitest';
import {
  createLogicalReplicationAdvancedSession,
  startLogicalStreaming,
  trackReplicationOrigin,
  confirmTwoSafeCommit,
} from '@kiwa/orm';

describe('two-safe commit — synchronous_commit = remote_apply', () => {
  it('advances confirmedLsn when >= 1 synchronous standby applies', () => {
    const session = createLogicalReplicationAdvancedSession({
      streamId: 'orders-outbox',
      provider: 'drizzle',
      backend: 'postgres',
    });
    startLogicalStreaming(session, { startLsn: 42_000_000, protocolVersion: 2 });
    trackReplicationOrigin(session, { originId: 'sub_orders', remoteLsn: 42_010_000 });

    const step = confirmTwoSafeCommit(session, {
      confirmedFlushLsn: 42_020_000,
      synchronousStandbys: 2,
    });

    expect(step.state).toBe('two-safe-confirmed');
    expect(step.backendEvent).toBe('synchronous_commit.remote_apply');
    expect(step.metadata.confirmedFlushLsn).toBe(42_020_000);
    expect(step.metadata.synchronousStandbys).toBe(2);
  });

  it('rejects a zero synchronous standby count — asynchronous commit is not two-safe', () => {
    const session = createLogicalReplicationAdvancedSession({
      streamId: 'orders-outbox',
      provider: 'drizzle',
      backend: 'postgres',
    });
    startLogicalStreaming(session, { startLsn: 42_000_000, protocolVersion: 2 });
    trackReplicationOrigin(session, { originId: 'sub_orders', remoteLsn: 42_010_000 });
    expect(() =>
      confirmTwoSafeCommit(session, { confirmedFlushLsn: 42_020_000, synchronousStandbys: 0 }),
    ).toThrow(/at least one synchronous standby is required/);
  });

  it('rejects a regressed confirmedFlushLsn — LSN progress is one-way', () => {
    const session = createLogicalReplicationAdvancedSession({
      streamId: 'orders-outbox',
      provider: 'drizzle',
      backend: 'postgres',
    });
    startLogicalStreaming(session, { startLsn: 42_000_000, protocolVersion: 2 });
    trackReplicationOrigin(session, { originId: 'sub_orders', remoteLsn: 42_010_000 });
    expect(() =>
      confirmTwoSafeCommit(session, { confirmedFlushLsn: 42_009_000, synchronousStandbys: 1 }),
    ).toThrow(/confirmedFlushLsn cannot regress/);
  });
});
```

The two-safe contract is what makes `synchronous_commit = remote_apply` different from `local`. `remote_apply` waits for the standby to have applied the transaction — a standby that only flushed but did not apply is not counted. The mock treats the standby count as a threshold, so a test can dial in "at least 2 synchronous standbys" without booting the standbys. Real Postgres surfaces this as `pg_stat_replication.write_lsn` vs `pg_stat_replication.replay_lsn`; the mock's `backendEvent` maps to the standby-side event `synchronous_commit.remote_apply`.

### 5. `syncCascadedSubscription` — subscriber becomes publisher

`tests/logical-adv/cascade-synced.test.ts` — a subscriber that itself becomes a publisher for a downstream is a cascaded topology. The mock guards against the classic self-loop bug (`upstreamId === subscriberId`).

```ts
import { describe, expect, it } from 'vitest';
import {
  createLogicalReplicationAdvancedSession,
  startLogicalStreaming,
  trackReplicationOrigin,
  confirmTwoSafeCommit,
  syncCascadedSubscription,
} from '@kiwa/orm';

describe('cascaded subscription', () => {
  it('adds a downstream subscriber and tracks the cascaded count', () => {
    const session = createLogicalReplicationAdvancedSession({
      streamId: 'orders-outbox',
      provider: 'drizzle',
      backend: 'postgres',
    });
    startLogicalStreaming(session, { startLsn: 42_000_000, protocolVersion: 2 });
    trackReplicationOrigin(session, { originId: 'sub_orders', remoteLsn: 42_010_000 });
    confirmTwoSafeCommit(session, { confirmedFlushLsn: 42_020_000, synchronousStandbys: 2 });

    const first = syncCascadedSubscription(session, {
      upstreamId: 'primary',
      subscriberId: 'analytics-eu',
    });
    expect(first.state).toBe('cascade-synced');
    expect(first.metadata.cascadedCount).toBe(1);

    const second = syncCascadedSubscription(session, {
      upstreamId: 'primary',
      subscriberId: 'analytics-us',
    });
    expect(second.metadata.cascadedCount).toBe(2);
  });

  it('rejects a self-loop where upstream and subscriber are the same node', () => {
    const session = createLogicalReplicationAdvancedSession({
      streamId: 'orders-outbox',
      provider: 'drizzle',
      backend: 'postgres',
    });
    startLogicalStreaming(session, { startLsn: 42_000_000, protocolVersion: 2 });
    trackReplicationOrigin(session, { originId: 'sub_orders', remoteLsn: 42_010_000 });
    confirmTwoSafeCommit(session, { confirmedFlushLsn: 42_020_000, synchronousStandbys: 2 });
    expect(() =>
      syncCascadedSubscription(session, { upstreamId: 'primary', subscriberId: 'primary' }),
    ).toThrow(/upstreamId and subscriberId must differ/);
  });
});
```

The self-loop guard is the shape of the bug that eats a weekend — a cascaded topology mis-configured with the same node as both upstream and downstream creates a WAL feedback loop that fills the slot and eventually stalls the primary. The mock reproduces it in one line and refuses to advance state. The `metadata.cascadedCount` is the field a release-gate check reads to assert "no cascaded topology has more than N hops"; tests iterating the grid can assert on that number without walking the `cascadedSubscribers` set.

## What you learned

The 4 advanced-replication pieces the tutorial covered — pgoutput handshake, replication origin tracking, two-safe commit confirmation, and cascaded subscription sync — are the ones every non-trivial Postgres CDC pipeline hits. `@kiwa/orm` v0.10 models them with an explicit state machine so tests run in milliseconds. Under `KIWA_MODE=real POSTGRES_KEY=...`, the fidelity harness runs the same assertions against real Postgres 16 testcontainers — the v1.32-2 `dogfood-postgres-cdc-outbox-app` v2 does exactly that.

## Next

- Tutorial 62 — MySQL group replication (member join / primary election / conflict detection / member leave)
- Tutorial 63 — SQLite WAL + FTS5 (journal_mode switch + checkpoint + virtual table + tokenizer + rank)
- Concept — `docs/concepts/database-real-driver-testing.md` (16 axis × 3 provider = 48 row grid + testcontainers pattern SSOT)
- Migration — `docs/migrations/v1.31-to-v1.32.md` (orm v0.9 → v0.10 opt-in surface + no breakage)
