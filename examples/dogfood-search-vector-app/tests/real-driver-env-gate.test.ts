/**
 * Real-driver env-gate tests — cover the KIWA_MODE=real gate. When
 * env vars are missing the real adapter emits a KIWA_SEARCH_ENV_MISSING
 * sentinel on the trace instead of crashing; when env vars are wired
 * (or `forceEnvPresent` in test) it walks the same neutral event
 * ordering as the mock. This is the seam the fidelity harness uses to
 * measure behavioural drift between mock semantics and the real
 * Meilisearch + Typesense wire surface.
 */

import { describe, expect, it } from 'vitest';
import { makeRealAdapter } from '../src/adapters/real.js';
import { KIWA_SEARCH_ENV_MISSING } from '../src/adapters/interface.js';

describe('dogfood-search-vector-app — real driver env-gate', () => {
  it('T-DFSV-RD-001 env missing → startVectorIndex emits KIWA_SEARCH_ENV_MISSING', async () => {
    const real = makeRealAdapter({ env: {} });
    await real.startVectorIndex({
      backend: 'meilisearch',
      indexId: 'idx',
      dimensions: 4,
    });
    const trace = real.trace();
    expect(trace).toHaveLength(1);
    expect(trace[0]?.ok).toBe(false);
    expect(trace[0]?.errorKind).toBe(KIWA_SEARCH_ENV_MISSING);
  });

  it('T-DFSV-RD-002 env missing → every vector-axis op reports the sentinel', async () => {
    const real = makeRealAdapter({ env: {} });
    await real.startVectorIndex({
      backend: 'meilisearch',
      indexId: 'idx',
      dimensions: 4,
    });
    await real.addVectors({
      bucket: 'meilisearch',
      indexId: 'idx',
      entries: [{ id: 'x', vector: [1, 0, 0, 0] }],
    });
    await real.queryKnn({
      bucket: 'meilisearch',
      indexId: 'idx',
      query: [1, 0, 0, 0],
      k: 1,
    });
    const trace = real.trace();
    for (const entry of trace) {
      expect(entry.ok).toBe(false);
      expect(entry.errorKind).toBe(KIWA_SEARCH_ENV_MISSING);
    }
  });

  it('T-DFSV-RD-003 forceEnvPresent → ops execute and emit ok=true', async () => {
    const real = makeRealAdapter({ forceEnvPresent: true });
    await real.startVectorIndex({
      backend: 'meilisearch',
      indexId: 'idx',
      dimensions: 4,
    });
    const trace = real.trace();
    expect(trace[0]?.ok).toBe(true);
    expect(trace[0]?.errorKind).toBeUndefined();
  });

  it('T-DFSV-RD-004 KIWA_MODE=real requires both KIWA_MEILI_URL + KIWA_TYPESENSE_URL', async () => {
    const partial = {
      KIWA_MODE: 'real',
      KIWA_MEILI_URL: 'http://localhost:7700',
      // Missing KIWA_TYPESENSE_URL.
    };
    const real = makeRealAdapter({ env: partial });
    await real.startVectorIndex({
      backend: 'meilisearch',
      indexId: 'idx',
      dimensions: 4,
    });
    const trace = real.trace();
    expect(trace[0]?.ok).toBe(false);
    expect(trace[0]?.errorKind).toBe(KIWA_SEARCH_ENV_MISSING);
  });

  it('T-DFSV-RD-005 KIWA_MODE=real with both endpoints wired flips envReady=true', async () => {
    const full = {
      KIWA_MODE: 'real',
      KIWA_MEILI_URL: 'http://localhost:7700',
      KIWA_TYPESENSE_URL: 'http://localhost:8108',
    };
    const real = makeRealAdapter({ env: full });
    await real.startVectorIndex({
      backend: 'meilisearch',
      indexId: 'idx',
      dimensions: 4,
    });
    const trace = real.trace();
    expect(trace[0]?.ok).toBe(true);
    expect(trace[0]?.metadata.envReady).toBe(true);
  });

  it('T-DFSV-RD-006 queryMeilisearchHealth uses KIWA_MEILI_URL endpoint when ready', async () => {
    const env = {
      KIWA_MODE: 'real',
      KIWA_MEILI_URL: 'http://meili.example:7700',
      KIWA_TYPESENSE_URL: 'http://typesense.example:8108',
    };
    const real = makeRealAdapter({ env });
    const result = await real.queryMeilisearchHealth({ bucket: 'meilisearch' });
    expect(result.endpoint).toBe('http://meili.example:7700');
    expect(result.healthy).toBe(true);
    const trace = real.trace();
    const healthEntry = trace.find((t) => t.op === 'queryMeilisearchHealth');
    expect(String(healthEntry?.metadata.url ?? '')).toContain('meili.example');
    expect(String(healthEntry?.metadata.url ?? '')).toContain('/health');
  });

  it('T-DFSV-RD-007 queryTypesenseHealth uses KIWA_TYPESENSE_URL endpoint when ready', async () => {
    const env = {
      KIWA_MODE: 'real',
      KIWA_MEILI_URL: 'http://m:7700',
      KIWA_TYPESENSE_URL: 'http://typesense.example:8108',
    };
    const real = makeRealAdapter({ env });
    const result = await real.queryTypesenseHealth({ bucket: 'typesense' });
    expect(result.endpoint).toBe('http://typesense.example:8108');
    const trace = real.trace();
    const healthEntry = trace.find((t) => t.op === 'queryTypesenseHealth');
    expect(String(healthEntry?.metadata.url ?? '')).toContain('typesense.example');
    expect(String(healthEntry?.metadata.url ?? '')).toContain('/health');
  });

  it('T-DFSV-RD-008 semantic-axis ops emit the sentinel when env is missing', async () => {
    const real = makeRealAdapter({ env: {} });
    await real.startSemanticSession({ backend: 'meilisearch', sessionId: 'sess-1' });
    await real.understandQuery({
      bucket: 'meilisearch',
      sessionId: 'sess-1',
      rawQuery: 'q',
    });
    await real.classifyIntent({ bucket: 'meilisearch', sessionId: 'sess-1' });
    await real.crossEncoderRerank({
      bucket: 'meilisearch',
      sessionId: 'sess-1',
      candidates: [{ id: 'a', content: 'x', baseScore: 0.5 }],
    });
    await real.cacheEmbedding({
      bucket: 'meilisearch',
      sessionId: 'sess-1',
      key: 'k',
      embedding: [1, 0],
    });
    const trace = real.trace();
    expect(trace.length).toBe(5);
    for (const entry of trace) {
      expect(entry.errorKind).toBe(KIWA_SEARCH_ENV_MISSING);
    }
  });

  it('T-DFSV-RD-009 emitFidelitySignal walks even without env (instrumentation-only op)', async () => {
    const real = makeRealAdapter({ env: {} });
    const result = await real.emitFidelitySignal({
      bucket: 'meilisearch',
      signal: 'ok',
    });
    expect(result.signal).toBe('ok');
    const trace = real.trace();
    const entry = trace.find((t) => t.op === 'emitFidelitySignal');
    expect(entry?.ok).toBe(true);
    expect(entry?.neutralEvent).toBe('search.fidelity_signal');
  });

  it('T-DFSV-RD-010 forceEnvPresent → both health checks execute against a real endpoint', async () => {
    const real = makeRealAdapter({ forceEnvPresent: true });
    const meili = await real.queryMeilisearchHealth({ bucket: 'meilisearch' });
    const typesense = await real.queryTypesenseHealth({ bucket: 'typesense' });
    expect(meili.healthy).toBe(true);
    expect(typesense.healthy).toBe(true);
  });

  it('T-DFSV-RD-011 reset clears env-missing trace as well', async () => {
    const real = makeRealAdapter({ env: {} });
    await real.startVectorIndex({
      backend: 'meilisearch',
      indexId: 'idx',
      dimensions: 4,
    });
    await real.reset();
    expect(real.trace()).toHaveLength(0);
  });

  it('T-DFSV-RD-012 real adapter surfaces envReady=false + sentinel in metadata under env-missing', async () => {
    const real = makeRealAdapter({ env: {} });
    await real.startVectorIndex({
      backend: 'typesense',
      indexId: 'idx',
      dimensions: 4,
    });
    const trace = real.trace();
    expect(trace[0]?.metadata.envReady).toBe(false);
    expect(trace[0]?.metadata.sentinel).toBe(KIWA_SEARCH_ENV_MISSING);
  });
});
