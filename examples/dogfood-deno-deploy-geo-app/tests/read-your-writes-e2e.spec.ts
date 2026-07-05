/**
 * Read-your-writes e2e spec (edge-kv axis focus — consistency guarantee).
 *
 * Sub-Issue GH-917 (v1.24-4) AC — write followed by read of the same
 * key. Deno KV documents strong consistency at the primary region and
 * eventual consistency at replicas. The spec covers both paths through
 * `driveReadYourWrites`:
 *
 *  1. Primary-region read after a primary-region write is strongly
 *     consistent — the read returns the written value verbatim.
 *  2. Multiple sequential writes are read back in order — each read
 *     observes the most recent write.
 *  3. Reading from a lagging replica returns null (has not yet applied
 *     the write) — the consistency window is observable.
 *  4. `consistency` field distinguishes 'strong' (primary) from
 *     'eventual' (replica) so downstream tests can assert on the routing
 *     path taken.
 *  5. `consistent` field flips to false only on the lagging-replica path
 *     — primary reads must never observe `consistent=false`.
 *  6. `/api/read-your-writes` route drives the adapter end-to-end.
 *  7. Multi-write, single-read pipeline preserves the last-writer-wins
 *     semantics of Deno KV.
 *  8. Metrics counters + latency samples accumulate on every op.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/lib/mock.js';
import { makeRealAdapter, SkippedError } from '../src/lib/real.js';
import { handleReadYourWrites } from '../src/routes/api/read-your-writes.js';

describe('mock adapter — read-your-writes consistency', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;

  beforeEach(() => {
    adapter = makeMockAdapter();
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('axis 1: primary-region read after primary-region write is strongly consistent', async () => {
    const snapshot = await adapter.driveReadYourWrites({
      key: 'ryw:1',
      value: 'hello-world',
    });
    expect(snapshot.readValue).toBe('hello-world');
    expect(snapshot.consistent).toBe(true);
    expect(snapshot.consistency).toBe('strong');
  });

  it('axis 2: multiple sequential writes read back in write order', async () => {
    const r1 = await adapter.driveReadYourWrites({ key: 'ryw:seq', value: 'v1' });
    const r2 = await adapter.driveReadYourWrites({ key: 'ryw:seq', value: 'v2' });
    const r3 = await adapter.driveReadYourWrites({ key: 'ryw:seq', value: 'v3' });
    expect(r1.readValue).toBe('v1');
    expect(r2.readValue).toBe('v2');
    expect(r3.readValue).toBe('v3');
    expect(r1.consistent).toBe(true);
    expect(r2.consistent).toBe(true);
    expect(r3.consistent).toBe(true);
  });

  it('axis 3: lagging-replica read returns null (eventual-consistency window observed)', async () => {
    // Prime the key at the primary region.
    await adapter.driveReadYourWrites({ key: 'ryw:replica', value: 'primary' });
    // Now overwrite + immediately read from a lagging replica.
    const snapshot = await adapter.driveReadYourWrites({
      key: 'ryw:replica',
      value: 'newer',
      fromLaggingReplica: true,
    });
    expect(snapshot.consistency).toBe('eventual');
    // The lagging replica has not yet applied the newer write.
    expect(snapshot.consistent).toBe(false);
    // The returned value is the prior state (mock model: prior store
    // value, or null if the replica had no state at all).
    expect(snapshot.readValue).toBe('primary');
  });

  it('axis 3b: lagging-replica read on a brand-new key returns null', async () => {
    // No prior write — the replica has literally no state.
    const snapshot = await adapter.driveReadYourWrites({
      key: 'ryw:brandnew',
      value: 'first-write',
      fromLaggingReplica: true,
    });
    expect(snapshot.consistency).toBe('eventual');
    expect(snapshot.consistent).toBe(false);
    expect(snapshot.readValue).toBeNull();
  });

  it('axis 4: consistency field distinguishes strong from eventual reliably', async () => {
    const primary = await adapter.driveReadYourWrites({
      key: 'ryw:consistency:p',
      value: 'p',
    });
    const replica = await adapter.driveReadYourWrites({
      key: 'ryw:consistency:r',
      value: 'r',
      fromLaggingReplica: true,
    });
    expect(primary.consistency).toBe('strong');
    expect(replica.consistency).toBe('eventual');
  });

  it('axis 5: consistent=true never observed on lagging-replica path', async () => {
    // Perform 5 lagging-replica reads on 5 distinct keys — none should
    // report `consistent=true`. This locks the invariant.
    for (let i = 0; i < 5; i += 1) {
      const snapshot = await adapter.driveReadYourWrites({
        key: `ryw:invariant:${i}`,
        value: `v-${i}`,
        fromLaggingReplica: true,
      });
      expect(snapshot.consistent).toBe(false);
    }
  });

  it('axis 6: /api/read-your-writes route drives primary path end-to-end', async () => {
    const response = await handleReadYourWrites(adapter, {
      key: 'ryw:route:1',
      value: 'route-value',
    });
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.readValue).toBe('route-value');
    expect(response.body.consistent).toBe(true);
    expect(response.body.consistency).toBe('strong');
  });

  it('axis 6b: /api/read-your-writes route surfaces eventual-consistency window', async () => {
    // Prime primary, then read from replica.
    await handleReadYourWrites(adapter, {
      key: 'ryw:route:replica',
      value: 'v1',
    });
    const response = await handleReadYourWrites(adapter, {
      key: 'ryw:route:replica',
      value: 'v2',
      fromLaggingReplica: true,
    });
    expect(response.status).toBe(200);
    expect(response.body.consistent).toBe(false);
    expect(response.body.consistency).toBe('eventual');
  });

  it('axis 7: last-writer-wins — a later write overrides an earlier one on the primary', async () => {
    await adapter.driveReadYourWrites({ key: 'ryw:lww', value: 'old' });
    const snapshot = await adapter.driveReadYourWrites({
      key: 'ryw:lww',
      value: 'new',
    });
    expect(snapshot.readValue).toBe('new');
    expect(snapshot.consistent).toBe(true);
  });

  it('axis 8: metrics counters + latency samples accumulate on every op', async () => {
    await adapter.driveReadYourWrites({ key: 'm1', value: 'v' });
    await adapter.driveReadYourWrites({
      key: 'm2',
      value: 'v',
      fromLaggingReplica: true,
    });
    const m = adapter.metrics();
    expect(m.readYourWritesCount).toBe(2);
    expect(m.latencySamplesMs.length).toBe(2);
  });
});

describe('real adapter — env-gate skip path', () => {
  it('records KIWA_DENO_DEPLOY_ENV_MISSING for read-your-writes when env absent', async () => {
    const real = makeRealAdapter();
    await expect(
      real.driveReadYourWrites({ key: 'r', value: 'v' }),
    ).rejects.toBeInstanceOf(SkippedError);
    expect(real.traces()[0]?.errorKind).toBe('KIWA_DENO_DEPLOY_ENV_MISSING');
  });

  it('records KIWA_DENO_DEPLOY_ENV_MISSING for lagging-replica read-your-writes when env absent', async () => {
    const real = makeRealAdapter();
    await expect(
      real.driveReadYourWrites({ key: 'r', value: 'v', fromLaggingReplica: true }),
    ).rejects.toBeInstanceOf(SkippedError);
    expect(real.traces()[0]?.errorKind).toBe('KIWA_DENO_DEPLOY_ENV_MISSING');
  });
});
