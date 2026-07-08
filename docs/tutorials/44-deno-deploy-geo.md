# Deno Deploy geo — Deno KV + read-your-writes + Cron in 15 min

## What you'll build

A Deno Fresh app on Deno Deploy wired to `@kiwa/edge` v0.2's `geo-replicated` + `edge-kv` + `cron-trigger` semantics. The suite covers the full geo journey — multi-region write to Deno KV, read-your-writes consistency on the primary vs eventual consistency on a lagging replica, scheduled + queue cron triggers with retry, and a 24-h retention purge job. Every event goes through the same neutral envelope, so the `KIWA_MODE=real` switch flips the run to a Deno Deploy sandbox without touching the test bodies.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-deno-geo && cd kiwa-deno-geo
pnpm init
pnpm add -D @kiwa/edge@^0.2 vitest typescript @types/node
```

Add the vitest script in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:real": "KIWA_MODE=real DENO_DEPLOY_KEY=1 vitest run"
  }
}
```

### 2. Wire the Deno Deploy mock

`src/adapters/mock.ts` — a thin factory returning per-run session objects for each axis.

```ts
import {
  createGeoReplicatedSession,
  geoPrimaryWrite,
  markReplicaLagged,
  syncReplica,
  createEdgeKvSession,
  kvRead,
  kvWrite,
  kvRangeQuery,
  scheduleCron,
  startCron,
  completeCron,
  failCron,
} from '@kiwa/edge';

export function makeMockAdapter() {
  return {
    geo: createGeoReplicatedSession({
      platform: 'deno',
      primaryRegion: 'ams',
      replicaRegions: ['nrt', 'sfo', 'gru'],
    }),
    primaryKv: createEdgeKvSession({ platform: 'deno', state: 'consistent' }),
    replicaKv: createEdgeKvSession({ platform: 'deno', state: 'eventually-consistent' }),
    driveGeoPrimaryWrite(data: string) {
      return geoPrimaryWrite(this.geo, { data });
    },
    driveGeoReplicaSync(region: string) {
      markReplicaLagged(this.geo, { region, lagMs: 500 });
      return syncReplica(this.geo, { region });
    },
    driveReadYourWrites(key: string, value: string) {
      kvWrite(this.primaryKv, { key, value });
      return kvRead(this.primaryKv, { key });
    },
    driveEventualRead(key: string) {
      return kvRead(this.replicaKv, { key });
    },
    driveCronSchedule(id: string, spec: string) {
      const session = scheduleCron({ id, platform: 'deno', cronSpec: spec, triggerType: 'scheduled' });
      startCron(session);
      return session;
    },
    driveCronComplete(session: ReturnType<typeof scheduleCron>, durationMs = 100) {
      return completeCron(session, { durationMs });
    },
    driveCronFail(session: ReturnType<typeof scheduleCron>, reason: string) {
      return failCron(session, { reason });
    },
  };
}
```

Deno KV is the closest edge KV that offers real read-your-writes on the primary — the `state: 'consistent'` flag on `createEdgeKvSession` distinguishes the primary from the lagging replica.

### 3. Test the multi-region write flow

`tests/multi-region-write.test.ts` — write to primary, mark replicas lagged, sync each replica.

```ts
import { describe, expect, it } from 'vitest';
import {
  createGeoReplicatedSession,
  geoPrimaryWrite,
  markReplicaLagged,
  syncReplica,
} from '@kiwa/edge';

describe('multi-region write', () => {
  it('bumps the version on primary, syncs each replica in turn', () => {
    const geo = createGeoReplicatedSession({
      platform: 'deno',
      primaryRegion: 'ams',
      replicaRegions: ['nrt', 'sfo', 'gru'],
    });

    const write = geoPrimaryWrite(geo, { data: 'payload' });
    expect(write.neutralEvent).toBe('geo.primary-write');
    expect(geo.version).toBe(1);
    expect(geo.state).toBe('lagging');
    for (const region of ['nrt', 'sfo', 'gru']) {
      expect(geo.lagMs[region]).toBeGreaterThan(0);
    }

    markReplicaLagged(geo, { region: 'nrt', lagMs: 800 });
    syncReplica(geo, { region: 'nrt' });
    expect(geo.state).toBe('lagging'); // sfo + gru still lagged

    syncReplica(geo, { region: 'sfo' });
    syncReplica(geo, { region: 'gru' });
    expect(geo.state).toBe('in-sync');
  });
});
```

The mock flips back to `in-sync` only when **every** replica lag has returned to 0 — a partial sync leaves the session `lagging`. That matches Deno KV's actual behaviour where a stale read on any replica means the client cannot trust cross-region read-after-write ordering.

### 4. Test the read-your-writes consistency guarantee

`tests/read-your-writes.test.ts` — same key, two different sessions, distinct consistency states.

```ts
import { describe, expect, it } from 'vitest';
import {
  createEdgeKvSession,
  kvRead,
  kvWrite,
} from '@kiwa/edge';

describe('read-your-writes', () => {
  it('a strong-consistency primary reads back its own write immediately', () => {
    const primary = createEdgeKvSession({ platform: 'deno', state: 'consistent' });
    kvWrite(primary, { key: 'counter', value: '1' });
    const readback = kvRead(primary, { key: 'counter' });
    expect(readback.neutralEvent).toBe('kv.read');
    expect(readback.state).toBe('consistent');
    expect(primary.store.get('counter')).toBe('1');
  });

  it('an eventually-consistent replica may miss the recent write', () => {
    const replica = createEdgeKvSession({ platform: 'deno', state: 'eventually-consistent' });
    // No kvWrite yet — the write is still in flight from the primary.
    const readback = kvRead(replica, { key: 'counter' });
    expect(readback.neutralEvent).toBe('kv.cache-miss');
    expect(readback.state).toBe('eventually-consistent');
  });
});
```

The `state` field on every event distinguishes the consistency model — downstream tests can assert `step.state === 'consistent'` to guarantee read-your-writes semantics or `'eventually-consistent'` to explicitly document a stale-read tolerance.

### 5. Test the cron trigger lifecycle

`tests/cron-trigger.test.ts` — schedule a cron, start it, complete or fail with retry.

```ts
import { describe, expect, it } from 'vitest';
import {
  scheduleCron,
  startCron,
  completeCron,
  failCron,
} from '@kiwa/edge';

describe('cron trigger lifecycle', () => {
  it('walks scheduled → running → completed on success', () => {
    const cron = scheduleCron({
      id: 'purge-daily',
      platform: 'deno',
      cronSpec: '0 0 * * *',
      triggerType: 'scheduled',
    });
    expect(cron.state).toBe('scheduled');

    const start = startCron(cron);
    expect(start.neutralEvent).toBe('cron.started');
    expect(cron.state).toBe('running');

    const done = completeCron(cron, { durationMs: 42 });
    expect(done.neutralEvent).toBe('cron.completed');
    expect(cron.state).toBe('completed');
  });

  it('retries on failure until maxRetries is exhausted', () => {
    const cron = scheduleCron({
      id: 'sync-hourly',
      platform: 'deno',
      cronSpec: '0 * * * *',
      triggerType: 'scheduled',
      maxRetries: 2,
    });
    startCron(cron);
    failCron(cron, { reason: 'network timeout' });
    expect(cron.retryCount).toBe(1);
    expect(cron.state).toBe('scheduled'); // re-scheduled, willRetry=true

    startCron(cron);
    failCron(cron, { reason: 'network timeout' });
    expect(cron.retryCount).toBe(2);
    expect(cron.state).toBe('failed'); // maxRetries exhausted, willRetry=false
  });

  it('accepts a queue trigger as an alternate source', () => {
    const cron = scheduleCron({
      id: 'queue-msg',
      platform: 'deno',
      cronSpec: 'queue:jobs',
      triggerType: 'queue',
    });
    expect(cron.triggerType).toBe('queue');
    startCron(cron);
    completeCron(cron, { durationMs: 10 });
    expect(cron.state).toBe('completed');
  });
});
```

`failCron` decrements the retry budget and re-schedules the cron until `maxRetries` is exhausted, at which point the state pins on `failed`. Queue triggers ride the same lifecycle — Deno Deploy exposes queue consumers under the same scheduled-handler contract.

### 6. Real driver mode (opt-in)

Every op in the app reads `KIWA_MODE`:

```ts
const mode = process.env.KIWA_MODE ?? 'mock';
export function makeAdapter() {
  return mode === 'real' && process.env.DENO_DEPLOY_KEY === '1'
    ? makeRealAdapter()  // Deno Deploy sandbox + Deno KV + Deno Deploy Cron
    : makeMockAdapter(); // @kiwa/edge v0.2 semantics
}
```

In `mock only` mode (`KIWA_MODE` unset), the vitest suite runs against the pure mock — zero network, sub-100 ms per test, safe on every laptop. In `KIWA_MODE=real DENO_DEPLOY_KEY=1` mode, the same tests re-run against a local `deno task dev` sandbox. The 8-op surface stays in the driver's seat — only the underlying adapter swaps.

### 7. Run it

```bash
pnpm test        # mock only, no network
pnpm test:real   # requires DENO_DEPLOY_KEY=1 + deno sandbox
```

The full end-to-end example lives in `examples/dogfood-deno-deploy-geo-app` — a Deno Fresh app with `multi-region-write-e2e.spec.ts` + `read-your-writes-e2e.spec.ts` + `cron-trigger-e2e.spec.ts`, all wired through the same 8-op surface (3 `geo-replicated` + 2 `edge-kv` + 3 `cron-trigger`) you just built.

## Where to next

- [Concept doc — Edge runtime testing (8 axis SSOT)](../concepts/edge-runtime-testing)
- [Tutorial 42 — Cloudflare Durable Object](./42-cloudflare-durable-object)
- [Tutorial 43 — Vercel Edge streaming](./43-vercel-edge-streaming)
- [Migration guide v1.23 → v1.24](../migrations/v1.23-to-v1.24)
