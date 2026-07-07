# Serverless cold-start — cold path vs warm pool vs provisioned concurrency + latency observability in 15 min

## What you'll build

A vitest suite wired to `@kiwa-test/edge` v1.2 that models the 3 pieces of a real serverless cold-start observability posture that every non-trivial production edge platform eventually needs — a cold-start `invokeColdStart` step that pins the class (`cold` / `warm` / `provisioned`) an invocation lands in based on pool state (mirroring Cloudflare Workers cold-start telemetry / Vercel Edge warm hits / AWS Lambda provisioned concurrency) so a "why did this request take 250ms instead of 30ms?" question resolves to one telemetry class without walking the raw invocation log, a `preWarmInstance` step that marks an instance warm without producing latency (mirroring `pinger` warm-up cron patterns) so a scheduled ping can amortise cold penalties across the request stream, an `evictExpired` step that reclaims warm instances whose last invocation is older than TTL (mirroring platform GC pressure) so the pool size stays bounded without a per-platform observability probe, and a `startColdStartPool` bootstrap that pins provisioned reservations upfront so an always-on instance never falls back to a cold path. `startColdStartPool()` + `invokeColdStart()` + `preWarmInstance()` + `evictExpired()` give you every one of those pieces without booting a real Cloudflare Workers + Vercel Edge + AWS Lambda stack. This is the pattern kiwa's `examples/dogfood-edge-serverless-cold-start-app` exercises against real Cloudflare Workers + Vercel Edge Functions + AWS Lambda provisioned concurrency + Deno Deploy backends under `KIWA_MODE=real` + the relevant `_URL` env; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "warm pool never fired because `warmedTtlMs` was 60_000 but the ping cron ran every 90 seconds, provisioned invocations reported cold class because `provisionedIds` was set on a different session than the pool, and evictExpired never freed the warm entry because `nowMs - lastInvokeAtMs` used `<` instead of `>`" gap a reviewer sees in a serverless cold-start post-mortem.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-serverless-cold-start && cd kiwa-serverless-cold-start
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

The v1.2 surface exports the cold-start axis (`startColdStartPool` / `invokeColdStart` / `preWarmInstance` / `evictExpired`), the middleware chain axis (`startMiddlewareChain` / `enterMiddleware` / `rewriteRequest` / `shortCircuit` / `completeMiddleware`), the KV eventual consistency axis (`startKvConsistency` / `recordWriteQuorum` / `observeRead` / `forceConvergence`), and 5 more advanced axes directly from the package root. Every v1.2 semantics function takes an `EdgePlatform` (`cloudflare` / `vercel` / `deno`) as first argument — the platform selects the neutral event dialect via `platformEventName(platform, neutralEvent)`. This tutorial focuses on the cold-start axis end-to-end; tutorial 95 covers the DurableObject state migration axis, tutorial 96 covers the global routing chain.

### 2. `invokeColdStart` — pool class classification

`tests/cold-start/invoke.test.ts` — a `ColdStartSession` pins the warm pool state and returns the class each invocation lands in.

```ts
import { describe, expect, it } from 'vitest';
import { invokeColdStart, startColdStartPool } from '@kiwa-test/edge';

describe('cold-start — invocation classification', () => {
  it('first invoke is cold', () => {
    const s = startColdStartPool({ platform: 'cloudflare', warmedTtlMs: 60_000 });
    const step = invokeColdStart(s, { instanceId: 'fn-a', nowMs: 0 });
    expect(step.state).toBe('cold');
    expect(step.neutralEvent).toBe('cold-start.invoked');
  });

  it('second invoke within TTL is warm', () => {
    const s = startColdStartPool({ platform: 'cloudflare', warmedTtlMs: 60_000 });
    invokeColdStart(s, { instanceId: 'fn-a', nowMs: 0 });
    const step = invokeColdStart(s, { instanceId: 'fn-a', nowMs: 30_000 });
    expect(step.state).toBe('warm');
    expect(step.neutralEvent).toBe('cold-start.cache-hit');
  });
});
```

### 3. `preWarmInstance` — scheduled warm-up

`tests/cold-start/prewarm.test.ts` — a warm-up cron marks the instance warm without producing invocation latency.

```ts
import { describe, expect, it } from 'vitest';
import { invokeColdStart, preWarmInstance, startColdStartPool } from '@kiwa-test/edge';

describe('cold-start — pre-warm', () => {
  it('pre-warmed instance skips cold path on next invoke', () => {
    const s = startColdStartPool({ platform: 'vercel' });
    preWarmInstance(s, { instanceId: 'fn-a', nowMs: 0 });
    const step = invokeColdStart(s, { instanceId: 'fn-a', nowMs: 1000 });
    expect(step.state).toBe('warm');
  });
});
```

### 4. `evictExpired` — TTL-based reclaim

`tests/cold-start/evict.test.ts` — warm instances past TTL are evicted, provisioned reservations survive.

```ts
import { describe, expect, it } from 'vitest';
import { evictExpired, invokeColdStart, startColdStartPool } from '@kiwa-test/edge';

describe('cold-start — evict', () => {
  it('removes stale warm entries but keeps provisioned', () => {
    const s = startColdStartPool({
      platform: 'deno',
      warmedTtlMs: 10_000,
      provisionedIds: ['always-on'],
    });
    invokeColdStart(s, { instanceId: 'fn-a', nowMs: 0 });
    invokeColdStart(s, { instanceId: 'always-on', nowMs: 0 });
    const evicted = evictExpired(s, { nowMs: 100_000 });
    expect(evicted).toBe(1);
    expect(s.warmedIds.has('fn-a')).toBe(false);
    expect(s.provisionedIds.has('always-on')).toBe(true);
  });
});
```

## Run it

```bash
pnpm test
```

All 3 test files pass. You now have a serverless cold-start observability suite that models cold / warm / provisioned paths deterministically without a live Cloudflare Workers + Vercel Edge + AWS Lambda stack. Extend it by chaining a middleware pipeline (tutorial 95) and a global routing decision (tutorial 96) to cover the full "cold pool → warm ping → middleware pipeline → geo route" edge posture.
