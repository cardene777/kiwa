/**
 * Real driver env-gate tests — asserts the real adapter reads
 * `KIWA_MODE=real` + `KIWA_OPENSEARCH_URL` + `OPENSEARCH_KEY` and only
 * walks the real path when all three are present. When any is missing
 * every op reports the sentinel `KIWA_SEARCH_ENV_MISSING` on the
 * trace.
 *
 * The AC anchors this dogfood on OpenSearch OSS (testcontainers HTTP
 * API), so these tests cover the boundary between the env-missing
 * fallback and the env-ready happy path.
 */

import { describe, expect, it } from 'vitest';
import { makeRealAdapter } from '../src/adapters/real.js';
import { KIWA_SEARCH_ENV_MISSING } from '../src/adapters/interface.js';
import { FIXTURE_ARTICLES } from '../src/policies/query-fixtures.js';

describe('dogfood-search-opensearch-app — real driver env-gate', () => {
  it('T-DFSOS-EG-001 env missing (no KIWA_MODE) — startRelevanceSession emits search.env_missing', async () => {
    const real = makeRealAdapter({ env: {} });
    await real.startRelevanceSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
    });
    const trace = real.trace();
    expect(trace).toHaveLength(1);
    expect(trace[0]?.neutralEvent).toBe('search.env_missing');
    expect(trace[0]?.ok).toBe(false);
    expect(trace[0]?.errorKind).toBe(KIWA_SEARCH_ENV_MISSING);
  });

  it('T-DFSOS-EG-002 KIWA_MODE=real but URL missing — still emits search.env_missing', async () => {
    const real = makeRealAdapter({
      env: { KIWA_MODE: 'real', OPENSEARCH_KEY: 'k' },
    });
    await real.startRelevanceSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
    });
    expect(real.trace()[0]?.neutralEvent).toBe('search.env_missing');
  });

  it('T-DFSOS-EG-003 KIWA_MODE=real + URL but KEY missing — still emits search.env_missing', async () => {
    const real = makeRealAdapter({
      env: {
        KIWA_MODE: 'real',
        KIWA_OPENSEARCH_URL: 'http://127.0.0.1:9200',
      },
    });
    await real.startSynonymSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
    });
    expect(real.trace()[0]?.neutralEvent).toBe('search.env_missing');
  });

  it('T-DFSOS-EG-004 KIWA_MODE=real + URL + KEY all present — walks the real path', async () => {
    const real = makeRealAdapter({
      env: {
        KIWA_MODE: 'real',
        KIWA_OPENSEARCH_URL: 'http://127.0.0.1:9200',
        OPENSEARCH_KEY: 'admin-cred',
      },
    });
    await real.startRelevanceSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
    });
    const trace = real.trace();
    expect(trace[0]?.neutralEvent).toBe('relevance.session_started');
    expect(trace[0]?.ok).toBe(true);
  });

  it('T-DFSOS-EG-005 forceEnvPresent bypasses env check even with empty env', async () => {
    const real = makeRealAdapter({ env: {}, forceEnvPresent: true });
    await real.startRelevanceSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
    });
    expect(real.trace()[0]?.neutralEvent).toBe('relevance.session_started');
  });

  it('T-DFSOS-EG-006 env-missing seedRelevanceDocuments returns zero-count sentinel result', async () => {
    const real = makeRealAdapter({ env: {} });
    const result = await real.seedRelevanceDocuments({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      documents: [],
    });
    expect(result.seededCount).toBe(0);
    expect(result.totalCount).toBe(0);
  });

  it('T-DFSOS-EG-007 env-missing scoreBm25 returns empty hits', async () => {
    const real = makeRealAdapter({ env: {} });
    const result = await real.scoreBm25({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      query: 'opensearch',
    });
    expect(result.hitCount).toBe(0);
    expect(result.hits).toEqual([]);
  });

  it('T-DFSOS-EG-008 env-missing allocateShards returns zero assignments', async () => {
    const real = makeRealAdapter({ env: {} });
    const result = await real.allocateShards({
      bucket: 'opensearch-oss',
      indexId: 'idx',
    });
    expect(result.totalAssignments).toBe(0);
  });

  it('T-DFSOS-EG-009 env-missing queryOpensearchHealth reports unreachable + unhealthy', async () => {
    const real = makeRealAdapter({ env: {} });
    const result = await real.queryOpensearchHealth({
      bucket: 'opensearch-oss',
    });
    expect(result.endpoint).toBe('unreachable');
    expect(result.healthy).toBe(false);
  });

  it('T-DFSOS-EG-010 env-missing emitFidelitySignal walks even without env (instrumentation semantics)', async () => {
    const real = makeRealAdapter({ env: {} });
    const result = await real.emitFidelitySignal({
      bucket: 'opensearch-oss',
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

  it('T-DFSOS-EG-011 env-ready path runs the full articles fixture without KIWA_SEARCH_ENV_MISSING sentinels', async () => {
    const real = makeRealAdapter({ forceEnvPresent: true });
    await real.startRelevanceSession({
      backend: 'opensearch-oss',
      indexId: 'idx-r',
    });
    await real.seedRelevanceDocuments({
      bucket: 'opensearch-oss',
      indexId: 'idx-r',
      documents: FIXTURE_ARTICLES.relevanceDocuments,
    });
    await real.scoreBm25({
      bucket: 'opensearch-oss',
      indexId: 'idx-r',
      query: 'opensearch',
    });
    const envMissing = real
      .trace()
      .filter((e) => e.neutralEvent === 'search.env_missing');
    expect(envMissing).toHaveLength(0);
  });

  it('T-DFSOS-EG-012 env-missing normalizeStemmer returns 0 normalized tokens', async () => {
    const real = makeRealAdapter({ env: {} });
    const result = await real.normalizeStemmer({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      tokens: ['a', 'b'],
      language: 'en',
    });
    expect(result.normalizedCount).toBe(0);
    expect(result.inputCount).toBe(2);
  });

  it('T-DFSOS-EG-013 env-missing advanceRollingReindex returns 0 progress', async () => {
    const real = makeRealAdapter({ env: {} });
    const result = await real.advanceRollingReindex({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      batchPercent: 50,
    });
    expect(result.progress).toBe(0);
    expect(result.completed).toBe(false);
  });
});
