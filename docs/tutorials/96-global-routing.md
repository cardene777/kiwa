# Global routing — Anycast + geo matching + latency-based failover + D1 read replica affinity in 15 min

## What you'll build

A vitest suite wired to `@kiwa-lab/edge` v1.2 that models the 4 pieces of a real global routing posture that every non-trivial production edge platform eventually needs — a `receiveAnycast` step that pins per-request POP visibility (mirroring Cloudflare Anycast + Vercel Edge Network + Deno Deploy anycast entry) so a "which POP handled this request?" question resolves to one telemetry event without walking the raw egress log, a `matchGeo` step that filters POPs by request region (mirroring Cloudflare `smart_placement` region hints) so a "how many POPs are in the user's region?" question lands on one number, a `selectByLatency` step that picks the lowest-latency healthy POP with `preferredRegion` bias (mirroring Cloudflare Argo Smart Routing + AWS Global Accelerator) so a "why did this request land 200ms away?" question maps to one probe result, and a `markUnhealthy` step that flips a POP out of rotation (mirroring health probe failures) so a bad POP is skipped without a full pool restart. `startRoutingPool()` + `receiveAnycast()` + `matchGeo()` + `selectByLatency()` + `markUnhealthy()` give you every one of those pieces for the routing decision tree, plus D1 read replica affinity with `startD1()` + `readFromReplica()` + `reportLag()` for the database side, without booting a real Cloudflare + Vercel + Deno Deploy stack. This is the pattern kiwa's `examples/dogfood-edge-global-routing-app` exercises against real Cloudflare + Vercel + Deno Deploy backends under `KIWA_MODE=real` + the relevant `_URL` env; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "the failover picked a POP outside the preferred region because `selectByLatency` scanned globally when in-region was empty and did not emit `routing.failover-triggered`, the geo match returned 0 because the `region` filter was `===` but the POP registry used a case-different string, and the replica read fell back to primary because `lagMs < maxLagMs` used `<=` instead of `<`" gap a reviewer sees in a routing post-mortem.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-global-routing && cd kiwa-global-routing
pnpm init
pnpm add -D @kiwa-lab/edge@^1.2 vitest typescript @types/node
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

### 2. `receiveAnycast` + `matchGeo` — routing entry point

`tests/routing/entry.test.ts` — the Anycast entry visits every POP and geo-filter narrows to the request's region.

```ts
import { describe, expect, it } from 'vitest';
import { matchGeo, receiveAnycast, startRoutingPool } from '@kiwa-lab/edge';

describe('routing — anycast + geo', () => {
  it('receiveAnycast emits anycast-received', () => {
    const session = startRoutingPool({
      platform: 'cloudflare',
      pops: [
        { popId: 'us-1', region: 'us', latencyMs: 30, healthy: true },
        { popId: 'eu-1', region: 'eu', latencyMs: 50, healthy: true },
      ],
    });
    const step = receiveAnycast(session, { requestId: 'req-1' });
    expect(step.neutralEvent).toBe('routing.anycast-received');
    expect(step.metadata.popCount).toBe(2);
  });

  it('matchGeo counts POPs in region', () => {
    const session = startRoutingPool({
      platform: 'vercel',
      pops: [
        { popId: 'us-1', region: 'us', latencyMs: 30, healthy: true },
        { popId: 'us-2', region: 'us', latencyMs: 50, healthy: true },
      ],
    });
    const step = matchGeo(session, { requestId: 'req-1', region: 'us' });
    expect(step.metadata.matchedCount).toBe(2);
  });
});
```

### 3. `selectByLatency` + `markUnhealthy` — decision + guard

`tests/routing/select.test.ts` — the lowest-latency in-region POP wins, unhealthy POPs are skipped.

```ts
import { describe, expect, it } from 'vitest';
import { markUnhealthy, selectByLatency, startRoutingPool } from '@kiwa-lab/edge';

describe('routing — select', () => {
  it('selectByLatency picks lowest latency POP in region', () => {
    const session = startRoutingPool({
      platform: 'deno',
      pops: [
        { popId: 'us-1', region: 'us', latencyMs: 30, healthy: true },
        { popId: 'us-2', region: 'us', latencyMs: 20, healthy: true },
      ],
    });
    const step = selectByLatency(session, { requestId: 'r', preferredRegion: 'us' });
    expect(step.metadata.popId).toBe('us-2');
  });

  it('markUnhealthy excludes POP from selection', () => {
    const session = startRoutingPool({
      platform: 'cloudflare',
      pops: [
        { popId: 'us-1', region: 'us', latencyMs: 30, healthy: true },
        { popId: 'us-2', region: 'us', latencyMs: 50, healthy: true },
      ],
    });
    markUnhealthy(session, { popId: 'us-1' });
    const step = selectByLatency(session, { requestId: 'r', preferredRegion: 'us' });
    expect(step.metadata.popId).toBe('us-2');
  });
});
```

### 4. `readFromReplica` + `reportLag` — D1 replica affinity

`tests/routing/replica.test.ts` — reads route to closest healthy replica, high-lag replicas failover.

```ts
import { describe, expect, it } from 'vitest';
import { readFromReplica, reportLag, startD1 } from '@kiwa-lab/edge';

describe('routing — D1 read replica', () => {
  it('read picks lowest-lag healthy replica in region', () => {
    const session = startD1({
      platform: 'cloudflare',
      primaryId: 'pg-primary',
      replicas: [
        { replicaId: 'r-us-1', region: 'us', lagMs: 100 },
        { replicaId: 'r-us-2', region: 'us', lagMs: 200 },
      ],
      maxLagMs: 500,
    });
    const step = readFromReplica(session, { query: 'SELECT 1', preferredRegion: 'us' });
    expect(step.state).toBe('replica');
    expect(step.metadata.replicaId).toBe('r-us-1');
  });

  it('reportLag flips replica unhealthy when threshold exceeded', () => {
    const session = startD1({
      platform: 'vercel',
      primaryId: 'pg-primary',
      replicas: [{ replicaId: 'r-1', region: 'us', lagMs: 100 }],
      maxLagMs: 500,
    });
    const step = reportLag(session, { replicaId: 'r-1', lagMs: 1000 });
    expect(step.state).toBe('lagged');
  });
});
```

## Run it

```bash
pnpm test
```

All 3 test files pass. You now have a global routing observability suite that models Anycast entry, geo matching, latency selection, and D1 replica affinity deterministically without a live Cloudflare + Vercel + Deno Deploy stack. Combine with tutorial 94 (cold-start) and tutorial 95 (DurableObject migration) for the full "cold pool → state migration → geo route" edge posture.
