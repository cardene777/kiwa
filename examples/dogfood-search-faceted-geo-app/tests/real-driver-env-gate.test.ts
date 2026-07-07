/**
 * Real driver env-gate tests — asserts the real adapter reads
 * `KIWA_MODE=real` + `KIWA_ALGOLIA_URL` + `ALGOLIA_KEY` and only walks
 * the real path when all three are present. When any is missing every
 * op reports the sentinel `KIWA_SEARCH_ENV_MISSING` on the trace.
 *
 * The AC anchors this dogfood on the Algolia sandbox (real production
 * HTTP API), so these tests cover the boundary between the env-missing
 * fallback and the env-ready happy path.
 */

import { describe, expect, it } from 'vitest';
import { makeRealAdapter } from '../src/adapters/real.js';
import { KIWA_SEARCH_ENV_MISSING } from '../src/adapters/interface.js';
import { FIXTURE_RESTAURANTS } from '../src/policies/query-fixtures.js';

describe('dogfood-search-faceted-geo-app — real driver env-gate', () => {
  it('T-DFSFG-EG-001 env missing (no KIWA_MODE) — startFacetedSession emits search.env_missing', async () => {
    const real = makeRealAdapter({ env: {} });
    await real.startFacetedSession({ backend: 'algolia', indexId: 'idx' });
    const trace = real.trace();
    expect(trace).toHaveLength(1);
    expect(trace[0]?.neutralEvent).toBe('search.env_missing');
    expect(trace[0]?.ok).toBe(false);
    expect(trace[0]?.errorKind).toBe(KIWA_SEARCH_ENV_MISSING);
  });

  it('T-DFSFG-EG-002 KIWA_MODE=real but URL missing — still emits search.env_missing', async () => {
    const real = makeRealAdapter({ env: { KIWA_MODE: 'real', ALGOLIA_KEY: 'k' } });
    await real.startFacetedSession({ backend: 'algolia', indexId: 'idx' });
    expect(real.trace()[0]?.neutralEvent).toBe('search.env_missing');
  });

  it('T-DFSFG-EG-003 KIWA_MODE=real + URL but KEY missing — still emits search.env_missing', async () => {
    const real = makeRealAdapter({
      env: { KIWA_MODE: 'real', KIWA_ALGOLIA_URL: 'https://x-dsn.algolia.net' },
    });
    await real.startGeoSession({ backend: 'algolia', indexId: 'idx' });
    expect(real.trace()[0]?.neutralEvent).toBe('search.env_missing');
  });

  it('T-DFSFG-EG-004 KIWA_MODE=real + URL + KEY all present — walks the real path', async () => {
    const real = makeRealAdapter({
      env: {
        KIWA_MODE: 'real',
        KIWA_ALGOLIA_URL: 'https://sandbox-dsn.algolia.net',
        ALGOLIA_KEY: 'sandbox-admin-key',
      },
    });
    await real.startFacetedSession({ backend: 'algolia', indexId: 'idx' });
    const trace = real.trace();
    expect(trace[0]?.neutralEvent).toBe('facet.session_started');
    expect(trace[0]?.ok).toBe(true);
  });

  it('T-DFSFG-EG-005 forceEnvPresent bypasses env check even with empty env', async () => {
    const real = makeRealAdapter({ env: {}, forceEnvPresent: true });
    await real.startFacetedSession({ backend: 'algolia', indexId: 'idx' });
    expect(real.trace()[0]?.neutralEvent).toBe('facet.session_started');
  });

  it('T-DFSFG-EG-006 env-missing seedFacetedDocuments returns zero-count sentinel result', async () => {
    const real = makeRealAdapter({ env: {} });
    const result = await real.seedFacetedDocuments({
      bucket: 'algolia',
      indexId: 'idx',
      documents: [],
    });
    expect(result.seededCount).toBe(0);
    expect(result.totalCount).toBe(0);
  });

  it('T-DFSFG-EG-007 env-missing queryBoundingBox returns empty hits', async () => {
    const real = makeRealAdapter({ env: {} });
    const result = await real.queryBoundingBox({
      bucket: 'algolia',
      indexId: 'idx',
      bbox: { swLat: 35.5, swLng: 139.5, neLat: 35.8, neLng: 139.85 },
    });
    expect(result.hitCount).toBe(0);
    expect(result.hits).toEqual([]);
  });

  it('T-DFSFG-EG-008 env-missing queryRadius returns zero-hit sentinel result', async () => {
    const real = makeRealAdapter({ env: {} });
    const result = await real.queryRadius({
      bucket: 'algolia',
      indexId: 'idx',
      centerLat: 35.65,
      centerLng: 139.7,
      radiusMeters: 1000,
    });
    expect(result.hitCount).toBe(0);
  });

  it('T-DFSFG-EG-009 env-missing queryAlgoliaHealth reports unreachable + unhealthy', async () => {
    const real = makeRealAdapter({ env: {} });
    const result = await real.queryAlgoliaHealth({ bucket: 'algolia' });
    expect(result.endpoint).toBe('unreachable');
    expect(result.healthy).toBe(false);
  });

  it('T-DFSFG-EG-010 env-missing emitFidelitySignal walks even without env (instrumentation semantics)', async () => {
    const real = makeRealAdapter({ env: {} });
    const result = await real.emitFidelitySignal({
      bucket: 'algolia',
      signal: 'ok',
    });
    expect(result.signal).toBe('ok');
    // The op emits `search.fidelity_signal` even in env-missing mode.
    const emitted = real
      .trace()
      .find((e) => e.neutralEvent === 'search.fidelity_signal');
    expect(emitted).toBeDefined();
    expect(emitted?.ok).toBe(true);
  });

  it('T-DFSFG-EG-011 env-ready path runs the full restaurant fixture without KIWA_SEARCH_ENV_MISSING sentinels', async () => {
    const real = makeRealAdapter({ forceEnvPresent: true });
    await real.startGeoSession({ backend: 'algolia', indexId: 'idx-r' });
    await real.seedGeoDocuments({
      bucket: 'algolia',
      indexId: 'idx-r',
      documents: FIXTURE_RESTAURANTS.geoDocuments,
    });
    await real.queryBoundingBox({
      bucket: 'algolia',
      indexId: 'idx-r',
      bbox: { swLat: 35.5, swLng: 139.5, neLat: 35.8, neLng: 139.85 },
    });
    const envMissing = real
      .trace()
      .filter((e) => e.neutralEvent === 'search.env_missing');
    expect(envMissing).toHaveLength(0);
  });
});
