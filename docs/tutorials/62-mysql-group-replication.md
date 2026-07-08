# MySQL group replication — member join + primary election + conflict detection + member leave in 15 min

## What you'll build

A vitest suite wired to `@kiwa/orm` v0.10 that models the 4 pieces of MySQL 8 group replication that every InnoDB cluster deployment hits — a member joining the group (`group_replication_start` + weight), single-primary election (`group_replication_switch_to_single_primary_mode` picking the elected member), write conflict detection (`performance_schema.replication_group_member_stats.COUNT_CONFLICTS_DETECTED`), and a member leaving (`STOP GROUP_REPLICATION` shrinks the visible member set). `createMysqlClusterSession()` gives you every one of those pieces as a deterministic state machine — `empty` → `joined` → `primary-elected` → `conflict-detected` → `member-left`. No MySQL Router binary, no `docker run mysql:8.0`, no `group_replication_local_address` config edit. This is the pattern kiwa's MySQL RLS + tenant dogfood app (v1.32-3) exercises against real MySQL 8 testcontainers under the fidelity harness; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "the write got certified on 2 nodes but rejected on the 3rd" case that only shows up in production.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-mysql-cluster && cd kiwa-mysql-cluster
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

The v0.10 surface exports `createMysqlClusterSession` from the semantics barrel. This tutorial focuses on axis 11 of the 16-axis grid; tutorial 61 covers axis 9 (Postgres logical replication advanced), tutorial 63 covers axis 13 (SQLite WAL + FTS5).

### 2. `joinClusterMember` — form the group

`tests/cluster/joined.test.ts` — a member calls `START GROUP_REPLICATION` after configuring `group_replication_group_name` + `group_replication_local_address`. The mock takes an explicit `weight` — a value from 1 to 100 that biases the primary election (real MySQL 8 uses this to promote a member with more RAM or better replication lag).

```ts
import { describe, expect, it } from 'vitest';
import { createMysqlClusterSession, joinClusterMember } from '@kiwa/orm';

describe('group replication — joinClusterMember', () => {
  it('adds a member with a positive weight and grows the visible set', () => {
    const session = createMysqlClusterSession({
      groupName: 'orders-cluster',
      provider: 'prisma',
      backend: 'mysql',
    });

    const step = joinClusterMember(session, { memberId: 'node-1', weight: 50 });

    expect(step.state).toBe('joined');
    expect(step.neutralEvent).toBe('cluster.member-joined');
    expect(step.backendEvent).toBe('group_replication.member_joined');
    expect(step.metadata.memberId).toBe('node-1');
    expect(step.metadata.memberCount).toBe(1);
    expect(session.members.has('node-1')).toBe(true);
  });

  it('rejects a duplicate join — a member that already joined must not join again', () => {
    const session = createMysqlClusterSession({
      groupName: 'orders-cluster',
      provider: 'prisma',
      backend: 'mysql',
    });
    joinClusterMember(session, { memberId: 'node-1', weight: 50 });
    expect(() => joinClusterMember(session, { memberId: 'node-1', weight: 60 })).toThrow(
      /already joined/,
    );
  });

  it('rejects a negative weight — the election bias is non-negative by contract', () => {
    const session = createMysqlClusterSession({
      groupName: 'orders-cluster',
      provider: 'prisma',
      backend: 'mysql',
    });
    expect(() => joinClusterMember(session, { memberId: 'node-1', weight: -1 })).toThrow(
      /weight must be non-negative/,
    );
  });
});
```

The rule of thumb is that the `weight` bias exists for a reason — a real cluster with mixed hardware needs to pin a specific node as the preferred primary, and the mock's constraint (`weight >= 0`) matches the real `group_replication_member_weight` variable. The duplicate-join guard reproduces the classic "the same node came back after a network blip" bug that a stateless mock would silently accept.

### 3. `electClusterPrimary` — the single-primary path

`tests/cluster/primary-elected.test.ts` — the primary is elected among joined members. The mock requires `mode = 'single-primary'` (multi-primary mode is a real MySQL option but requires no election). The elected member must already be joined.

```ts
import { describe, expect, it } from 'vitest';
import {
  createMysqlClusterSession,
  joinClusterMember,
  electClusterPrimary,
} from '@kiwa/orm';

describe('group replication — electClusterPrimary', () => {
  it('elects a joined member as the single-primary and records it', () => {
    const session = createMysqlClusterSession({
      groupName: 'orders-cluster',
      provider: 'prisma',
      backend: 'mysql',
    });
    joinClusterMember(session, { memberId: 'node-1', weight: 60 });
    joinClusterMember(session, { memberId: 'node-2', weight: 40 });

    const step = electClusterPrimary(session, { memberId: 'node-1', mode: 'single-primary' });

    expect(step.state).toBe('primary-elected');
    expect(step.backendEvent).toBe('group_replication.primary_elected');
    expect(step.metadata.memberId).toBe('node-1');
    expect(step.metadata.mode).toBe('single-primary');
    expect(session.primaryId).toBe('node-1');
  });

  it('rejects an unknown member — the primary must exist in the group', () => {
    const session = createMysqlClusterSession({
      groupName: 'orders-cluster',
      provider: 'prisma',
      backend: 'mysql',
    });
    joinClusterMember(session, { memberId: 'node-1', weight: 60 });
    expect(() => electClusterPrimary(session, { memberId: 'ghost', mode: 'single-primary' })).toThrow(
      /unknown member/,
    );
  });

  it('rejects multi-primary mode — election is single-primary only', () => {
    const session = createMysqlClusterSession({
      groupName: 'orders-cluster',
      provider: 'prisma',
      backend: 'mysql',
    });
    joinClusterMember(session, { memberId: 'node-1', weight: 60 });
    expect(() => electClusterPrimary(session, { memberId: 'node-1', mode: 'multi-primary' })).toThrow(
      /requires single-primary/,
    );
  });
});
```

The `mode` field is what makes MySQL 8 group replication different from Galera — MySQL supports both single-primary and multi-primary modes, but only single-primary uses the election machinery. Multi-primary mode has every node accept writes and relies purely on the certification layer to reject conflicts; a test that asks for `multi-primary` here has misconfigured the cluster. Real MySQL emits `group_replication.primary_elected` on `performance_schema.replication_group_members`; the mock's `backendEvent` mirrors that string.

### 4. `detectClusterConflict` — certification says no

`tests/cluster/conflict-detected.test.ts` — group replication certifies every write against the write-set of concurrent transactions. When two members write the same row in overlapping transactions, the earlier certified one wins and the loser is rolled back on the losing member.

```ts
import { describe, expect, it } from 'vitest';
import {
  createMysqlClusterSession,
  joinClusterMember,
  electClusterPrimary,
  detectClusterConflict,
} from '@kiwa/orm';

describe('group replication — detectClusterConflict', () => {
  it('records the winner member and increments the conflict counter', () => {
    const session = createMysqlClusterSession({
      groupName: 'orders-cluster',
      provider: 'prisma',
      backend: 'mysql',
    });
    joinClusterMember(session, { memberId: 'node-1', weight: 60 });
    joinClusterMember(session, { memberId: 'node-2', weight: 40 });
    electClusterPrimary(session, { memberId: 'node-1', mode: 'single-primary' });

    const first = detectClusterConflict(session, {
      transactionId: 'txn-100',
      winnerMemberId: 'node-1',
    });
    expect(first.state).toBe('conflict-detected');
    expect(first.metadata.transactionId).toBe('txn-100');
    expect(first.metadata.winnerMemberId).toBe('node-1');
    expect(first.metadata.conflictCount).toBe(1);

    const second = detectClusterConflict(session, {
      transactionId: 'txn-101',
      winnerMemberId: 'node-2',
    });
    expect(second.metadata.conflictCount).toBe(2);
  });

  it('rejects a winner that is not a member — certification must resolve to a real node', () => {
    const session = createMysqlClusterSession({
      groupName: 'orders-cluster',
      provider: 'prisma',
      backend: 'mysql',
    });
    joinClusterMember(session, { memberId: 'node-1', weight: 60 });
    electClusterPrimary(session, { memberId: 'node-1', mode: 'single-primary' });
    expect(() =>
      detectClusterConflict(session, { transactionId: 'txn-x', winnerMemberId: 'ghost' }),
    ).toThrow(/unknown winner/);
  });
});
```

Certification is the shape of the "we thought writes were fine but 3 out of 100 disappeared" bug that only surfaces under load. Real MySQL surfaces this on `performance_schema.replication_group_member_stats.COUNT_CONFLICTS_DETECTED`; the mock's `metadata.conflictCount` is the same counter. Tests that assert on the counter can catch a certification rate regression before it hits production.

### 5. `leaveClusterMember` — shrink the group

`tests/cluster/member-left.test.ts` — a member calls `STOP GROUP_REPLICATION`. The mock unregisters the member and, if it was the primary, clears the primary slot so a re-election is required.

```ts
import { describe, expect, it } from 'vitest';
import {
  createMysqlClusterSession,
  joinClusterMember,
  electClusterPrimary,
  detectClusterConflict,
  leaveClusterMember,
} from '@kiwa/orm';

describe('group replication — leaveClusterMember', () => {
  it('removes the member and clears the primary slot when the leaver was the primary', () => {
    const session = createMysqlClusterSession({
      groupName: 'orders-cluster',
      provider: 'prisma',
      backend: 'mysql',
    });
    joinClusterMember(session, { memberId: 'node-1', weight: 60 });
    joinClusterMember(session, { memberId: 'node-2', weight: 40 });
    electClusterPrimary(session, { memberId: 'node-1', mode: 'single-primary' });
    detectClusterConflict(session, { transactionId: 'txn-100', winnerMemberId: 'node-1' });

    const step = leaveClusterMember(session, { memberId: 'node-1' });

    expect(step.state).toBe('member-left');
    expect(step.backendEvent).toBe('group_replication.member_left');
    expect(step.metadata.memberCount).toBe(1);
    expect(step.metadata.primaryPresent).toBe(false);
    expect(session.primaryId).toBeNull();
  });
});
```

The `primaryPresent: false` field in the step metadata is the signal that a re-election must run — a downstream test that asserts on it can treat the cluster as "needs primary" without walking the internal state. This is the classic "the primary went down and writes hung for 30 s until failover kicked in" case the mock reproduces deterministically without needing a real network partition.

## What you learned

The 4 group-replication pieces the tutorial covered — member join with weight bias, single-primary election, certification conflict detection, and member leave with primary clearing — are the ones every InnoDB cluster deployment hits. `@kiwa/orm` v0.10 models them with a deterministic state machine so tests run in milliseconds. Under `KIWA_MODE=real MYSQL_KEY=...`, the fidelity harness runs the same assertions against real MySQL 8 testcontainers — the v1.32-3 `dogfood-mysql-rls-tenant-app` v2 does exactly that.

## Next

- Tutorial 61 — Postgres logical replication advanced (streaming + origin + two-safe + cascade)
- Tutorial 63 — SQLite WAL + FTS5 (journal_mode switch + checkpoint + virtual table + tokenizer + rank)
- Concept — `docs/concepts/database-real-driver-testing.md` (16 axis × 3 provider = 48 row grid + testcontainers pattern SSOT)
- Migration — `docs/migrations/v1.31-to-v1.32.md` (orm v0.9 → v0.10 opt-in surface + no breakage)
