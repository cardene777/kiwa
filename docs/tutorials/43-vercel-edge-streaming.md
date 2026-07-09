# Vercel Edge streaming — SSE + geo routing + KV in 15 min

## What you'll build

A Next.js 15 middleware + edge runtime app wired to `@kiwa-lab/edge` v0.2's `geo-replicated` + `edge-kv` + `streaming-response` semantics. The suite covers the full edge journey — Accept-Language + `x-vercel-ip-country` region resolution, primary + replica multi-region writes, cache read-through + invalidation on the edge KV layer, and Server-Sent Events with high-water-mark backpressure. Every event goes through the same neutral envelope, so the `KIWA_MODE=real` switch flips the run to a Vercel Edge sandbox without touching the test bodies.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-vercel-edge && cd kiwa-vercel-edge
pnpm init
pnpm add -D @kiwa-lab/edge@^0.2 vitest typescript @types/node
```

Add the vitest script in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:real": "KIWA_MODE=real VERCEL_KEY=1 vitest run"
  }
}
```

### 2. Wire the Vercel Edge mock

`src/adapters/mock.ts` — a thin factory that returns the shared session objects used by every route.

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
  openStream,
  sendChunk,
  closeStream,
} from '@kiwa-lab/edge';

export function makeMockAdapter() {
  return {
    geo: createGeoReplicatedSession({
      platform: 'vercel',
      primaryRegion: 'iad1',
      replicaRegions: ['fra1', 'hnd1', 'syd1'],
    }),
    kv: createEdgeKvSession({ platform: 'vercel', state: 'eventually-consistent' }),
    driveGeoPrimaryWrite(data: string) {
      return geoPrimaryWrite(this.geo, { data });
    },
    driveGeoReplicaSync(region: string) {
      markReplicaLagged(this.geo, { region, lagMs: 500 });
      return syncReplica(this.geo, { region });
    },
    driveKvRead(key: string) {
      return kvRead(this.kv, { key });
    },
    driveKvWrite(key: string, value: string) {
      return kvWrite(this.kv, { key, value });
    },
    driveKvRangeQuery(prefix: string) {
      return kvRangeQuery(this.kv, { prefix });
    },
    driveSseOpen(id: string, highWaterMark = 64) {
      return openStream({ id, platform: 'vercel', kind: 'sse', highWaterMark });
    },
  };
}
```

`createGeoReplicatedSession` returns a session with a primary region (`iad1` here) and N replicas — every primary write bumps a version and marks each replica lagged. `createEdgeKvSession` returns a per-POP cache + backing store pair. `openStream({ kind: 'sse' })` returns a stream session that flips to `backpressure` once buffered bytes exceed the high-water mark.

### 3. Test the geo routing flow

`tests/geo-routing.test.ts` — resolve region from Accept-Language + `x-vercel-ip-country`, then walk a primary → replica sync.

```ts
import { describe, expect, it } from 'vitest';
import {
  createGeoReplicatedSession,
  geoPrimaryWrite,
  markReplicaLagged,
  syncReplica,
} from '@kiwa-lab/edge';

const REGION_BY_COUNTRY: Record<string, string> = {
  US: 'iad1',
  DE: 'fra1',
  JP: 'hnd1',
  AU: 'syd1',
};

function resolveRegion(acceptLanguage: string, vercelCountry: string): string {
  return REGION_BY_COUNTRY[vercelCountry] ?? REGION_BY_COUNTRY.US;
}

describe('geo routing', () => {
  it('routes a DE visitor to fra1 and syncs the lagged replica', () => {
    const region = resolveRegion('de-DE,de;q=0.9', 'DE');
    expect(region).toBe('fra1');

    const geo = createGeoReplicatedSession({
      platform: 'vercel',
      primaryRegion: 'iad1',
      replicaRegions: ['fra1', 'hnd1', 'syd1'],
    });

    const write = geoPrimaryWrite(geo, { data: 'v' });
    expect(write.neutralEvent).toBe('geo.primary-write');
    expect(geo.state).toBe('lagging');
    expect(geo.version).toBe(1);
    expect(geo.lagMs.fra1).toBeGreaterThan(0);

    markReplicaLagged(geo, { region: 'fra1', lagMs: 300 });
    const sync = syncReplica(geo, { region: 'fra1' });
    expect(sync.neutralEvent).toBe('geo.replica-synced');
    expect(geo.lagMs.fra1).toBe(0);
  });
});
```

The mock records `state: 'lagging'` on every primary write and only flips back to `in-sync` when every replica lag returns to 0. Downstream fidelity assertions can compare the ordered `history` against the same trace produced by a real Vercel Edge sandbox.

### 4. Test the edge KV read-through + invalidation

`tests/cache-invalidation.test.ts` — cold read → cached read → write invalidates → miss on the absent key.

```ts
import { describe, expect, it } from 'vitest';
import {
  createEdgeKvSession,
  kvRead,
  kvWrite,
  kvRangeQuery,
} from '@kiwa-lab/edge';

describe('edge KV read-through cache', () => {
  it('populates the cache on the first read, serves warm on the second', () => {
    const kv = createEdgeKvSession({ platform: 'vercel', state: 'eventually-consistent' });
    kvWrite(kv, { key: 'user:1', value: '{"name":"alice"}' });

    const cold = kvRead(kv, { key: 'user:1' });
    expect(cold.neutralEvent).toBe('kv.read');

    const warm = kvRead(kv, { key: 'user:1' });
    expect(warm.neutralEvent).toBe('kv.cache-hit');
  });

  it('invalidates the cache on write and misses on an unknown key', () => {
    const kv = createEdgeKvSession({ platform: 'vercel', state: 'eventually-consistent' });
    kvWrite(kv, { key: 'user:2', value: '{"name":"bob"}' });
    kvRead(kv, { key: 'user:2' }); // populates cache
    kvWrite(kv, { key: 'user:2', value: '{"name":"bob-v2"}' });

    const afterWrite = kvRead(kv, { key: 'user:2' });
    expect(afterWrite.neutralEvent).toBe('kv.read'); // cache was invalidated

    const miss = kvRead(kv, { key: 'unknown' });
    expect(miss.neutralEvent).toBe('kv.cache-miss');
  });

  it('range-queries keys under a prefix in lexicographic order', () => {
    const kv = createEdgeKvSession({ platform: 'vercel' });
    kvWrite(kv, { key: 'log:2026-07-01', value: 'a' });
    kvWrite(kv, { key: 'log:2026-07-02', value: 'b' });
    kvWrite(kv, { key: 'log:2026-07-03', value: 'c' });
    kvWrite(kv, { key: 'other', value: 'x' });

    const { matches, step } = kvRangeQuery(kv, { prefix: 'log:' });
    expect(step.neutralEvent).toBe('kv.read');
    expect(matches).toEqual(['log:2026-07-01', 'log:2026-07-02', 'log:2026-07-03']);
    expect(step.metadata?.matched).toBe(3);
  });
});
```

The 4 neutral events distinguish the read-through paths — `kv.read` for a cold read, `kv.cache-hit` for the warm read, `kv.write` for the persisting write, and `kv.cache-miss` for an absent key. Range queries emit a single `kv.read` with a `matched` array so the trace stays flat.

### 5. Test the SSE stream with backpressure

`tests/sse-stream.test.ts` — open a stream, push chunks until the high-water mark, resume after drain.

```ts
import { describe, expect, it } from 'vitest';
import {
  openStream,
  sendChunk,
  resumeStream,
  closeStream,
} from '@kiwa-lab/edge';

describe('SSE stream backpressure', () => {
  it('flips to backpressure when bytesSent exceeds the high-water mark', () => {
    const stream = openStream({
      id: 'stream-1',
      platform: 'vercel',
      kind: 'sse',
      highWaterMark: 32,
    });
    expect(stream.state).toBe('open');
    expect(stream.history[0]?.neutralEvent).toBe('stream.opened');

    const first = sendChunk(stream, { data: 'event: message\ndata: hello\n\n' });
    expect(first.neutralEvent).toBe('stream.chunk-sent');
    expect(stream.state).toBe('open');

    const second = sendChunk(stream, { data: 'event: message\ndata: world\n\n' });
    expect(second.neutralEvent).toBe('stream.backpressure');
    expect(stream.state).toBe('backpressure');
  });

  it('resumes after the consumer drains and closes cleanly', () => {
    const stream = openStream({
      id: 'stream-2',
      platform: 'vercel',
      kind: 'sse',
      highWaterMark: 16,
    });
    sendChunk(stream, { data: 'a'.repeat(20) }); // → backpressure
    expect(stream.state).toBe('backpressure');

    const resumed = resumeStream(stream);
    expect(resumed.neutralEvent).toBe('stream.chunk-sent');
    expect(stream.state).toBe('open');

    const closed = closeStream(stream, { reason: 'client-disconnect' });
    expect(closed.neutralEvent).toBe('stream.closed');
    expect(stream.state).toBe('closed');
  });
});
```

The `stream.chunk-sent` neutral event fires while `bytesSent` stays under `highWaterMark`. Once the buffer overflows the stream flips to `backpressure` and emits `stream.backpressure` — the merchant app is expected to stop pushing until `resumeStream` returns. `closeStream` is a terminal transition and further `sendChunk` calls throw.

### 6. Real driver mode (opt-in)

Every op in the middleware reads `KIWA_MODE`:

```ts
const mode = process.env.KIWA_MODE ?? 'mock';
export function makeAdapter() {
  return mode === 'real' && process.env.VERCEL_KEY === '1'
    ? makeRealAdapter()  // Vercel Edge sandbox + KV Redis + real SSE
    : makeMockAdapter(); // @kiwa-lab/edge v0.2 semantics
}
```

In `mock only` mode (`KIWA_MODE` unset), the vitest suite runs against the pure mock — zero network, sub-100 ms per test, safe on every laptop. In `KIWA_MODE=real VERCEL_KEY=1` mode, the same tests re-run against a local Vercel Edge sandbox. The 8-op surface stays in the driver's seat — only the underlying adapter swaps.

### 7. Run it

```bash
pnpm test        # mock only, no network
pnpm test:real   # requires VERCEL_KEY=1 + vercel dev sandbox
```

The full end-to-end example lives in `examples/dogfood-vercel-edge-function-app` — a Next.js 15 middleware app with `geo-routing-e2e.spec.ts` + `cache-invalidation-e2e.spec.ts` + `sse-stream-e2e.spec.ts`, all wired through the same 8-op surface (3 `geo-replicated` + 3 `edge-kv` + 2 `streaming-response`) you just built.

## Where to next

- [Concept doc — Edge runtime testing (8 axis SSOT)](../concepts/edge-runtime-testing)
- [Tutorial 42 — Cloudflare Durable Object](./42-cloudflare-durable-object)
- [Tutorial 44 — Deno Deploy geo](./44-deno-deploy-geo)
- [Migration guide v1.23 → v1.24](../migrations/v1.23-to-v1.24)
