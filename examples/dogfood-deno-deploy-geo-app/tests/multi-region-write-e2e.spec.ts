/**
 * Multi-region write e2e spec (geo-replicated + edge-kv axes focus).
 *
 * Sub-Issue GH-917 (v1.24-4) AC — Deno KV multi-region write +
 * eventual-consistency observation + region-scoped range query. Covers
 * the geo-replicated + edge-kv axes (createGeoReplicatedSession /
 * geoPrimaryWrite / markReplicaLagged / syncReplica / createEdgeKvSession
 * / kvWrite / kvRangeQuery) end-to-end.
 *
 * Fidelity axes covered here:
 *  1. Accept-Language + Deno Deploy geo header → deterministic region
 *     resolution across the 4-region routing table.
 *  2. Primary-region write bumps version + marks every replica lagging.
 *  3. Sync collapses lagging replicas back to in-sync when every replica
 *     is caught up.
 *  4. Partial replica sync leaves the session in `lagging` state.
 *  5. Range query returns matching keys sorted lexicographically
 *     (matches Deno KV `list({ prefix })` key order for ASCII strings).
 *  6. Range query on an empty prefix returns [].
 *  7. `/api/kv` POST + GET routes drive the adapter end-to-end.
 *  8. Multiple writes accumulate — version keeps incrementing.
 *  9. Metrics counters + latency samples accumulate on every op.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/lib/mock.js';
import { makeRealAdapter, SkippedError } from '../src/lib/real.js';
import { REGION_CATALOG } from '../src/lib/deno-adapter.js';
import { handleKvRange, handleKvWrite } from '../src/routes/api/kv.js';

describe('mock adapter — Deno KV multi-region write', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;

  beforeEach(() => {
    adapter = makeMockAdapter();
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('axis 1: JP client geo IP resolves to asia-northeast1', async () => {
    const snapshot = await adapter.driveGeoRoute({
      requestId: 'req-jp-1',
      acceptLanguage: 'ja-JP,ja;q=0.9',
      clientCountry: 'JP',
    });
    expect(snapshot.resolvedRegion).toBe('asia-northeast1');
    expect(snapshot.fellBack).toBe(false);
    const traces = adapter.traces();
    expect(traces.filter((t) => t.op === 'driveGeoRoute').length).toBe(1);
    expect(traces.every((t) => t.ok)).toBe(true);
  });

  it('axis 1b: unknown country falls back to Accept-Language', async () => {
    const snapshot = await adapter.driveGeoRoute({
      requestId: 'req-fb-1',
      acceptLanguage: 'de-DE,de;q=0.9',
      clientCountry: '',
    });
    expect(snapshot.resolvedRegion).toBe('europe-west3');
    expect(snapshot.fellBack).toBe(true);
  });

  it('axis 1c: country wins over language when signals disagree', async () => {
    // Japanese browser, US geo IP → country wins → us-east1.
    const snapshot = await adapter.driveGeoRoute({
      requestId: 'req-mix-1',
      acceptLanguage: 'ja-JP',
      clientCountry: 'US',
    });
    expect(snapshot.resolvedRegion).toBe('us-east1');
    expect(snapshot.fellBack).toBe(false);
  });

  it('axis 1d: unknown country + unknown language falls to primary region', async () => {
    const snapshot = await adapter.driveGeoRoute({
      requestId: 'req-default',
      acceptLanguage: 'xx',
      clientCountry: 'ZZ',
    });
    expect(snapshot.resolvedRegion).toBe(REGION_CATALOG.primary);
    expect(snapshot.fellBack).toBe(true);
  });

  it('axis 2: primary-region write bumps version + marks replicas lagging', async () => {
    const write = await adapter.driveGeoPrimaryWrite({ payload: 'hello' });
    expect(write.primaryRegion).toBe(REGION_CATALOG.primary);
    expect(write.version).toBe(1);
    expect(write.laggingReplicas).toEqual([...REGION_CATALOG.replicas]);
  });

  it('axis 3: sync catches all replicas → in-sync', async () => {
    await adapter.driveGeoPrimaryWrite({ payload: 'first' });
    const sync = await adapter.driveGeoReplicaSync({
      replicas: [...REGION_CATALOG.replicas],
    });
    expect(sync.syncedReplicas.length).toBe(REGION_CATALOG.replicas.length);
    expect(sync.finalState).toBe('in-sync');
  });

  it('axis 4: partial replica sync stays lagging', async () => {
    await adapter.driveGeoPrimaryWrite({ payload: 'partial' });
    const sync = await adapter.driveGeoReplicaSync({
      replicas: [REGION_CATALOG.replicas[0]],
    });
    expect(sync.syncedReplicas).toEqual([REGION_CATALOG.replicas[0]]);
    expect(sync.finalState).toBe('lagging');
  });

  it('axis 5: range query returns matching keys sorted lexicographically', async () => {
    // Insertion order intentionally scrambled — output must be sorted.
    await adapter.driveKvWrite({ key: 'retention:20260703:b', value: '2' });
    await adapter.driveKvWrite({ key: 'retention:20260702:a', value: '1' });
    await adapter.driveKvWrite({ key: 'retention:20260704:c', value: '3' });
    await adapter.driveKvWrite({ key: 'session:tok', value: 'x' }); // non-matching
    const range = await adapter.driveKvRangeQuery({ prefix: 'retention:' });
    expect(range.keys).toEqual([
      'retention:20260702:a',
      'retention:20260703:b',
      'retention:20260704:c',
    ]);
    expect(range.count).toBe(3);
  });

  it('axis 6: range query on an empty prefix returns []', async () => {
    await adapter.driveKvWrite({ key: 'other:1', value: 'x' });
    const range = await adapter.driveKvRangeQuery({ prefix: 'nomatch:' });
    expect(range.keys).toEqual([]);
    expect(range.count).toBe(0);
  });

  it('axis 7: /api/kv POST drives write + geo primary-write end-to-end', async () => {
    const response = await handleKvWrite(adapter, {
      key: 'kv:multi:1',
      value: 'multi-region',
    });
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.key).toBe('kv:multi:1');
    expect(response.body.primaryRegion).toBe(REGION_CATALOG.primary);
    expect(response.body.version).toBe(1);
    expect(response.body.laggingReplicas).toEqual([...REGION_CATALOG.replicas]);
  });

  it('axis 7b: /api/kv GET range drives range query end-to-end', async () => {
    await adapter.driveKvWrite({ key: 'cart:u1:item:a', value: '1' });
    await adapter.driveKvWrite({ key: 'cart:u1:item:b', value: '2' });
    await adapter.driveKvWrite({ key: 'cart:u2:item:a', value: '3' });
    const response = await handleKvRange(adapter, { prefix: 'cart:u1:' });
    expect(response.status).toBe(200);
    expect(response.body.keys).toEqual(['cart:u1:item:a', 'cart:u1:item:b']);
    expect(response.body.count).toBe(2);
  });

  it('axis 8: multiple primary writes accumulate; version keeps incrementing', async () => {
    const w1 = await adapter.driveGeoPrimaryWrite({ payload: 'v1' });
    const w2 = await adapter.driveGeoPrimaryWrite({ payload: 'v2' });
    const w3 = await adapter.driveGeoPrimaryWrite({ payload: 'v3' });
    expect(w1.version).toBe(1);
    expect(w2.version).toBe(2);
    expect(w3.version).toBe(3);
  });

  it('axis 9: metrics counters + latency samples accumulate on every op', async () => {
    await adapter.driveGeoRoute({
      requestId: 'r1',
      acceptLanguage: 'en',
      clientCountry: 'US',
    });
    await adapter.driveGeoPrimaryWrite({ payload: 'v' });
    await adapter.driveGeoReplicaSync({
      replicas: [REGION_CATALOG.replicas[0]],
    });
    await adapter.driveKvWrite({ key: 'metrics:k', value: 'v' });
    await adapter.driveKvRangeQuery({ prefix: 'metrics:' });
    const m = adapter.metrics();
    expect(m.geoRouteCount).toBe(1);
    expect(m.geoPrimaryWriteCount).toBe(1);
    expect(m.geoReplicaSyncCount).toBe(1);
    expect(m.kvWriteCount).toBe(1);
    expect(m.kvRangeQueryCount).toBe(1);
    expect(m.latencySamplesMs.length).toBe(5);
  });
});

describe('real adapter — env-gate skip path', () => {
  it('records KIWA_DENO_DEPLOY_ENV_MISSING for geo route when env absent', async () => {
    const real = makeRealAdapter();
    await expect(
      real.driveGeoRoute({
        requestId: 'req-real-1',
        acceptLanguage: 'en',
        clientCountry: 'US',
      }),
    ).rejects.toBeInstanceOf(SkippedError);
    const traces = real.traces();
    expect(traces[0]?.op).toBe('driveGeoRoute');
    expect(traces[0]?.errorKind).toBe('KIWA_DENO_DEPLOY_ENV_MISSING');
    expect(traces[0]?.ok).toBe(false);
  });

  it('records KIWA_DENO_DEPLOY_ENV_MISSING for geo primary write when env absent', async () => {
    const real = makeRealAdapter();
    await expect(
      real.driveGeoPrimaryWrite({ payload: 'x' }),
    ).rejects.toBeInstanceOf(SkippedError);
    expect(real.traces()[0]?.errorKind).toBe('KIWA_DENO_DEPLOY_ENV_MISSING');
  });

  it('records KIWA_DENO_DEPLOY_ENV_MISSING for KV write when env absent', async () => {
    const real = makeRealAdapter();
    await expect(
      real.driveKvWrite({ key: 'r', value: 'v' }),
    ).rejects.toBeInstanceOf(SkippedError);
    expect(real.traces()[0]?.errorKind).toBe('KIWA_DENO_DEPLOY_ENV_MISSING');
  });

  it('records KIWA_DENO_DEPLOY_ENV_MISSING for KV range query when env absent', async () => {
    const real = makeRealAdapter();
    await expect(
      real.driveKvRangeQuery({ prefix: 'user:' }),
    ).rejects.toBeInstanceOf(SkippedError);
    expect(real.traces()[0]?.errorKind).toBe('KIWA_DENO_DEPLOY_ENV_MISSING');
  });
});
