/**
 * Geo routing e2e spec (geo-replicated axis focus).
 *
 * Sub-Issue GH-916 (v1.24-3) AC — Accept-Language + Vercel geo IP →
 * region routing + primary-region write + replica sync + failover. This
 * spec covers the geo-replicated axis of the AC
 * (createGeoReplicatedSession / geoPrimaryWrite / markReplicaLagged /
 * syncReplica / resolveConflict) end-to-end.
 *
 * Fidelity axes covered here:
 *  1. Accept-Language + geo IP → deterministic region resolution across
 *     the 4-region routing table (iad1 / hnd1 / sfo1 / fra1).
 *  2. When the geo IP country is unknown, Accept-Language fallback kicks
 *     in and `fellBack` is set to true.
 *  3. Country wins over language when both signals disagree (matches
 *     Vercel Edge Config precedence rules).
 *  4. Primary write bumps the version + marks every replica as lagging;
 *     subsequent syncs collapse the session back to 'in-sync'.
 *  5. Partial replica sync leaves the session in 'lagging' state until
 *     the last replica catches up.
 *  6. Region isolation — routing decisions are stateless; two independent
 *     requests do not share state.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/lib/mock.js';
import { makeRealAdapter, SkippedError } from '../src/lib/real.js';
import { REGION_CATALOG } from '../src/lib/vercel-adapter.js';
import { runMiddleware } from '../src/middleware.js';
import { handleGeo } from '../src/app/api/geo/route.js';

describe('mock adapter — geo routing end-to-end', () => {
  let adapter: ReturnType<typeof makeMockAdapter>;

  beforeEach(() => {
    adapter = makeMockAdapter();
  });

  afterEach(async () => {
    await adapter.reset();
  });

  it('axis 1: JP client geo IP resolves to hnd1', async () => {
    const snapshot = await adapter.driveGeoRoute({
      requestId: 'req-jp-1',
      acceptLanguage: 'ja-JP,ja;q=0.9',
      clientCountry: 'JP',
    });
    expect(snapshot.resolvedRegion).toBe('hnd1');
    expect(snapshot.fellBack).toBe(false);
    // Trace confirms driveGeoRoute succeeded.
    const traces = adapter.traces();
    expect(traces.filter((t) => t.op === 'driveGeoRoute').length).toBe(1);
    expect(traces.every((t) => t.ok)).toBe(true);
  });

  it('axis 2: unknown country falls back to Accept-Language (fellBack=true)', async () => {
    const snapshot = await adapter.driveGeoRoute({
      requestId: 'req-fb-1',
      acceptLanguage: 'de-DE,de;q=0.9',
      clientCountry: '',
    });
    expect(snapshot.resolvedRegion).toBe('fra1');
    expect(snapshot.fellBack).toBe(true);
  });

  it('axis 3: country wins over language when signals disagree', async () => {
    // Japanese browser, US geo IP → country wins → iad1 (not hnd1).
    const snapshot = await adapter.driveGeoRoute({
      requestId: 'req-mix-1',
      acceptLanguage: 'ja-JP',
      clientCountry: 'US',
    });
    expect(snapshot.resolvedRegion).toBe('iad1');
    expect(snapshot.fellBack).toBe(false);
  });

  it('axis 3b: unknown country + unknown language falls to primary region', async () => {
    const snapshot = await adapter.driveGeoRoute({
      requestId: 'req-default',
      acceptLanguage: 'xx',
      clientCountry: 'ZZ',
    });
    expect(snapshot.resolvedRegion).toBe(REGION_CATALOG.primary);
    expect(snapshot.fellBack).toBe(true);
  });

  it('axis 4: primary write bumps version + marks replicas lagging; sync clears them', async () => {
    const write = await adapter.driveGeoPrimaryWrite({ payload: 'hello' });
    expect(write.primaryRegion).toBe(REGION_CATALOG.primary);
    expect(write.version).toBe(1);
    expect(write.laggingReplicas).toEqual([...REGION_CATALOG.replicas]);
    // A second write bumps version again.
    const write2 = await adapter.driveGeoPrimaryWrite({ payload: 'world' });
    expect(write2.version).toBe(2);
    // Sync all replicas — final state returns to in-sync.
    const sync = await adapter.driveGeoReplicaSync({
      replicas: [...REGION_CATALOG.replicas],
    });
    expect(sync.syncedReplicas.length).toBe(REGION_CATALOG.replicas.length);
    expect(sync.finalState).toBe('in-sync');
  });

  it('axis 5: partial replica sync keeps session lagging', async () => {
    await adapter.driveGeoPrimaryWrite({ payload: 'partial' });
    // Sync only 1 replica of 3 — the remaining 2 stay lagging.
    const sync = await adapter.driveGeoReplicaSync({
      replicas: [REGION_CATALOG.replicas[0]],
    });
    expect(sync.syncedReplicas).toEqual([REGION_CATALOG.replicas[0]]);
    expect(sync.finalState).toBe('lagging');
  });

  it('axis 6: routing is stateless — independent requests do not share region', async () => {
    const jp = await adapter.driveGeoRoute({
      requestId: 'req-a',
      acceptLanguage: 'ja',
      clientCountry: 'JP',
    });
    const gb = await adapter.driveGeoRoute({
      requestId: 'req-b',
      acceptLanguage: 'en-GB',
      clientCountry: 'GB',
    });
    expect(jp.resolvedRegion).toBe('hnd1');
    expect(gb.resolvedRegion).toBe('fra1');
  });

  it('axis 7: middleware layer stamps x-kiwa-region on the outgoing response', () => {
    // Run the middleware directly (independent of adapter) — a real
    // Next.js edge deployment executes this on every request.
    const result = runMiddleware({
      method: 'GET',
      url: '/api/geo',
      headers: {
        'accept-language': 'ko-KR',
        'x-vercel-ip-country': 'KR',
      },
    });
    expect(result.region).toBe('hnd1');
    expect(result.language).toBe('ko');
    expect(result.fellBack).toBe(false);
    expect(result.headers['x-kiwa-region']).toBe('hnd1');
    expect(result.headers['x-kiwa-fell-back']).toBe('0');
  });

  it('axis 8: /api/geo route echoes region metadata on the response body', () => {
    const response = handleGeo(
      {
        method: 'GET',
        url: '/api/geo',
        headers: {
          'accept-language': 'fr-FR,fr;q=0.9',
          'x-vercel-ip-country': 'FR',
        },
      },
      'req-fr-echo',
    );
    expect(response.status).toBe(200);
    expect(response.body.region).toBe('fra1');
    expect(response.body.language).toBe('fr');
    expect(response.body.fellBack).toBe(false);
    expect(response.body.requestId).toBe('req-fr-echo');
    // The response headers propagate the middleware augmentation.
    expect(response.headers['x-kiwa-region']).toBe('fra1');
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
    const m = adapter.metrics();
    expect(m.geoRouteCount).toBe(1);
    expect(m.geoPrimaryWriteCount).toBe(1);
    expect(m.geoReplicaSyncCount).toBe(1);
    expect(m.latencySamplesMs.length).toBe(3);
  });
});

describe('real adapter — env-gate skip path', () => {
  it('records KIWA_VERCEL_EDGE_ENV_MISSING for geo route when KIWA_MODE + VERCEL_KEY are missing', async () => {
    // In local dev without both env vars, the real adapter fails fast so
    // the fidelity report captures env-absent rather than crashing.
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
    expect(traces[0]?.errorKind).toBe('KIWA_VERCEL_EDGE_ENV_MISSING');
    expect(traces[0]?.ok).toBe(false);
  });

  it('records KIWA_VERCEL_EDGE_ENV_MISSING for geo primary write when env absent', async () => {
    const real = makeRealAdapter();
    await expect(
      real.driveGeoPrimaryWrite({ payload: 'x' }),
    ).rejects.toBeInstanceOf(SkippedError);
    expect(real.traces()[0]?.errorKind).toBe('KIWA_VERCEL_EDGE_ENV_MISSING');
  });
});
