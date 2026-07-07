# DurableObject state migration — schema versioning + data migrate + zero-downtime rollout + rollback in 15 min

## What you'll build

A vitest suite wired to `@kiwa-test/edge` v1.2 that models the 4 pieces of a real DurableObject state migration posture that every non-trivial production stateful edge workload eventually needs — an `initiateMigration` step that pins `fromVersion` + `toVersion` + instance registry so a "which instances need migrating?" question resolves to one bounded set without walking every namespace, a `bumpSchema` step that flips the schema version registry atomically (mirroring Cloudflare Durable Objects `migrations` API + Vercel Edge session-affinity schema bumps) so a downstream reader knows to expect the new shape, a `migrateInstance` step that walks per-instance data conversion (`v1 → v2`) with progress counters so a rollout dashboard can pin `migratedCount / totalCount` without a per-DO probe, a `completeRollout` step that enforces "every instance at toVersion" as a precondition so a partial rollout cannot silently succeed, and a `rollbackMigration` step that unwinds every instance back to `fromVersion` (mirroring `wrangler d1 migrations rollback`) so a bad schema shipping can recover without a per-instance manual revert. `initiateMigration()` + `bumpSchema()` + `migrateInstance()` + `completeRollout()` + `rollbackMigration()` give you every one of those pieces without booting a real Cloudflare Workers Durable Objects + Vercel Edge session-affinity + Deno Deploy stateful-object stack. This is the pattern kiwa's `examples/dogfood-edge-durable-object-migration-app` exercises against real Cloudflare Workers Durable Objects + Vercel Edge session-affinity + Deno Deploy backends under `KIWA_MODE=real` + the relevant `_URL` env; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "the rollout completed with 4/5 instances migrated because `completeRollout` returned early on the first `.every(...)` iteration, the schema bump ran twice because `bumpSchema` did not guard against `state !== 'initiated'`, and the migration data was applied to the wrong instance because `migrateInstance` used `set(id, fromVersion)` instead of `set(id, toVersion)`" gap a reviewer sees in a state migration post-mortem.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-do-migration && cd kiwa-do-migration
pnpm init
pnpm add -D @kiwa-test/edge@^1.2 vitest typescript @types/node
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

### 2. `initiateMigration` + `bumpSchema` — schema bump

`tests/migration/schema.test.ts` — an atomic version bump on the schema registry.

```ts
import { describe, expect, it } from 'vitest';
import { bumpSchema, initiateMigration } from '@kiwa-test/edge';

describe('do-migration — schema bump', () => {
  it('initiate then bump moves state to schema-bumped', () => {
    const session = initiateMigration({
      platform: 'cloudflare',
      fromVersion: 1,
      toVersion: 2,
      instanceIds: ['do-a', 'do-b'],
    });
    expect(session.state).toBe('initiated');
    const step = bumpSchema(session);
    expect(step.state).toBe('schema-bumped');
    expect(step.neutralEvent).toBe('do-migration.schema-bumped');
  });
});
```

### 3. `migrateInstance` — per-DO data migration

`tests/migration/data.test.ts` — each instance carries its own version pointer that advances on migration.

```ts
import { describe, expect, it } from 'vitest';
import { bumpSchema, initiateMigration, migrateInstance } from '@kiwa-test/edge';

describe('do-migration — data migrate', () => {
  it('per-instance version advances to toVersion', () => {
    const session = initiateMigration({
      platform: 'vercel',
      fromVersion: 1,
      toVersion: 2,
      instanceIds: ['do-a'],
    });
    bumpSchema(session);
    const step = migrateInstance(session, { instanceId: 'do-a' });
    expect(step.metadata.toVersion).toBe(2);
    expect(session.instances.get('do-a')).toBe(2);
  });
});
```

### 4. `completeRollout` + `rollbackMigration` — precondition + recovery

`tests/migration/rollout.test.ts` — the rollout only succeeds when every instance is at `toVersion`, and rollback resets to `fromVersion`.

```ts
import { describe, expect, it } from 'vitest';
import {
  bumpSchema,
  completeRollout,
  initiateMigration,
  migrateInstance,
  rollbackMigration,
} from '@kiwa-test/edge';

describe('do-migration — rollout + rollback', () => {
  it('completeRollout rejects partial rollout', () => {
    const session = initiateMigration({
      platform: 'deno',
      fromVersion: 1,
      toVersion: 2,
      instanceIds: ['a', 'b'],
    });
    bumpSchema(session);
    migrateInstance(session, { instanceId: 'a' });
    expect(() => completeRollout(session)).toThrow(/still on old version/);
  });

  it('rollbackMigration resets every instance to fromVersion', () => {
    const session = initiateMigration({
      platform: 'cloudflare',
      fromVersion: 1,
      toVersion: 2,
      instanceIds: ['a', 'b'],
    });
    bumpSchema(session);
    migrateInstance(session, { instanceId: 'a' });
    rollbackMigration(session);
    expect(session.state).toBe('rolled-back');
    expect(session.instances.get('a')).toBe(1);
  });
});
```

## Run it

```bash
pnpm test
```

All 3 test files pass. You now have a DurableObject migration observability suite that models schema bump / data migrate / rollout / rollback deterministically without a live Cloudflare Workers Durable Objects + Vercel Edge session-affinity + Deno Deploy stack. Extend it by chaining a global routing decision (tutorial 96) to cover the full "state migration → geo route" edge posture.
