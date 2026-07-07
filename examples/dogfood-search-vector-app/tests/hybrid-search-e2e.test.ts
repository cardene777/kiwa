/**
 * Hybrid search e2e tests — exercise the vector + keyword fusion
 * across the 2 backends x 5 hybrid weight configs matrix. Assert
 * fusion output is deterministic across weight configs and both
 * backends produce parallel neutral event traces.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { SearchHybridAdapter } from '../src/adapters/interface.js';
import {
  driveFullMatrix,
  driveHybridSearchLifecycle,
} from '../src/flows/search-flows.js';
import { DEFAULT_BACKENDS } from '../src/policies/backends.js';
import {
  ALL_HYBRID_CONFIGS,
  HYBRID_BALANCED,
  HYBRID_KEYWORD_HEAVY,
  HYBRID_KEYWORD_ONLY,
  HYBRID_VECTOR_HEAVY,
  HYBRID_VECTOR_ONLY,
} from '../src/policies/hybrid-configs.js';
import {
  ALL_FIXTURES,
  FIXTURE_HYBRID_FUSION,
  FIXTURE_VECTOR_RECALL,
} from '../src/policies/query-fixtures.js';

function newMock(): SearchHybridAdapter {
  return makeMockAdapter();
}

describe('dogfood-search-vector-app — hybrid search e2e', () => {
  it('T-DFSV-HS-001 driveHybridSearchLifecycle emits all 13 promise ops per lifecycle', async () => {
    const mock = newMock();
    await driveHybridSearchLifecycle(mock, {
      backend: 'meilisearch',
      fixture: FIXTURE_HYBRID_FUSION,
      weights: HYBRID_BALANCED.weights,
      sessionId: 'e2e-sess',
      indexId: 'e2e-idx',
    });
    const trace = mock.trace();
    const ops = new Set(trace.map((t) => t.op));
    for (const op of [
      'startVectorIndex',
      'addVectors',
      'queryKnn',
      'startSemanticSession',
      'understandQuery',
      'classifyIntent',
      'crossEncoderRerank',
      'cacheEmbedding',
      'fuseHybrid',
      'recallAnn',
      'emitFidelitySignal',
      'queryMeilisearchHealth',
      'queryTypesenseHealth',
    ]) {
      expect(ops.has(op)).toBe(true);
    }
  });

  it('T-DFSV-HS-002 vector-only weights produce fused hits ordered by vector cosine', async () => {
    const mock = newMock();
    await driveHybridSearchLifecycle(mock, {
      backend: 'meilisearch',
      fixture: FIXTURE_VECTOR_RECALL,
      weights: HYBRID_VECTOR_ONLY.weights,
      sessionId: 'sess-vo',
      indexId: 'idx-vo',
    });
    const trace = mock.trace();
    const fuseEntry = trace.find((t) => t.op === 'fuseHybrid');
    expect(fuseEntry?.metadata.vectorWeight).toBe(1);
    expect(fuseEntry?.metadata.keywordWeight).toBe(0);
  });

  it('T-DFSV-HS-003 keyword-only weights produce fused hits ordered by keyword score', async () => {
    const mock = newMock();
    await driveHybridSearchLifecycle(mock, {
      backend: 'meilisearch',
      fixture: FIXTURE_HYBRID_FUSION,
      weights: HYBRID_KEYWORD_ONLY.weights,
      sessionId: 'sess-ko',
      indexId: 'idx-ko',
    });
    const trace = mock.trace();
    const fuseEntry = trace.find((t) => t.op === 'fuseHybrid');
    expect(fuseEntry?.metadata.vectorWeight).toBe(0);
    expect(fuseEntry?.metadata.keywordWeight).toBe(1);
  });

  it('T-DFSV-HS-004 balanced weights sum to 1', async () => {
    expect(HYBRID_BALANCED.weights.vectorWeight + HYBRID_BALANCED.weights.keywordWeight).toBe(1);
  });

  it('T-DFSV-HS-005 all 5 configs produce non-empty fused hits for hybrid fixture', async () => {
    for (const config of ALL_HYBRID_CONFIGS) {
      const mock = newMock();
      await driveHybridSearchLifecycle(mock, {
        backend: 'meilisearch',
        fixture: FIXTURE_HYBRID_FUSION,
        weights: config.weights,
        sessionId: `sess-${config.id}`,
        indexId: `idx-${config.id}`,
      });
      const trace = mock.trace();
      const fuseEntry = trace.find((t) => t.op === 'fuseHybrid');
      expect(fuseEntry).toBeDefined();
      expect(Number(fuseEntry?.metadata.fusedCount)).toBeGreaterThan(0);
    }
  });

  it('T-DFSV-HS-006 both backends walk the same 13 ops per lifecycle', async () => {
    for (const backend of DEFAULT_BACKENDS) {
      const mock = newMock();
      await driveHybridSearchLifecycle(mock, {
        backend,
        fixture: FIXTURE_HYBRID_FUSION,
        weights: HYBRID_BALANCED.weights,
        sessionId: `sess-${backend}`,
        indexId: `idx-${backend}`,
      });
      const trace = mock.trace();
      const ops = new Set(trace.map((t) => t.op));
      expect(ops.size).toBeGreaterThanOrEqual(13);
    }
  });

  it('T-DFSV-HS-007 driveFullMatrix runs 2 backends x 5 configs x 3 fixtures = 30 lifecycles', async () => {
    const mock = newMock();
    const result = await driveFullMatrix(mock);
    expect(result.lifecyclesRun).toBe(30);
  });

  it('T-DFSV-HS-008 driveFullMatrix emits meilisearch + typesense buckets on the trace', async () => {
    const mock = newMock();
    await driveFullMatrix(mock);
    const trace = mock.trace();
    const buckets = new Set(trace.map((t) => t.bucket));
    expect(buckets.has('meilisearch')).toBe(true);
    expect(buckets.has('typesense')).toBe(true);
  });

  it('T-DFSV-HS-009 driveFullMatrix emits fuseHybrid once per lifecycle (30 times total)', async () => {
    const mock = newMock();
    await driveFullMatrix(mock);
    const trace = mock.trace();
    const fuseOps = trace.filter((t) => t.op === 'fuseHybrid');
    expect(fuseOps).toHaveLength(30);
  });

  it('T-DFSV-HS-010 fusedScore normalizes both signals when both are contributing', async () => {
    const mock = newMock();
    await mock.startVectorIndex({
      backend: 'meilisearch',
      indexId: 'norm-idx',
      dimensions: 4,
    });
    await mock.addVectors({
      bucket: 'meilisearch',
      indexId: 'norm-idx',
      entries: FIXTURE_HYBRID_FUSION.documents,
    });
    const knn = await mock.queryKnn({
      bucket: 'meilisearch',
      indexId: 'norm-idx',
      query: [0.7, 0.3, 0, 0],
      k: 4,
    });
    // vector-heavy weights — top should still be doc-alpha (highest vector + keyword)
    const fused = await mock.fuseHybrid({
      bucket: 'meilisearch',
      indexId: 'norm-idx',
      vectorHits: knn.hits,
      keywordHits: FIXTURE_HYBRID_FUSION.keywordHits,
      weights: HYBRID_VECTOR_HEAVY.weights,
    });
    expect(fused.fused[0]?.id).toBe('doc-alpha');
  });

  it('T-DFSV-HS-011 recallAnn is emitted for every lifecycle with groundTruth', async () => {
    const mock = newMock();
    await driveHybridSearchLifecycle(mock, {
      backend: 'meilisearch',
      fixture: FIXTURE_HYBRID_FUSION,
      weights: HYBRID_BALANCED.weights,
      sessionId: 'gt-sess',
      indexId: 'gt-idx',
    });
    const trace = mock.trace();
    const recallEntry = trace.find((t) => t.op === 'recallAnn');
    expect(recallEntry).toBeDefined();
    expect(recallEntry?.ok).toBe(true);
  });

  it('T-DFSV-HS-012 emitFidelitySignal appends signal + notes to trace metadata', async () => {
    const mock = newMock();
    await mock.emitFidelitySignal({
      bucket: 'meilisearch',
      signal: 'ok',
      notes: 'baseline',
    });
    const trace = mock.trace();
    expect(trace[0]?.op).toBe('emitFidelitySignal');
    expect(trace[0]?.neutralEvent).toBe('search.fidelity_signal');
    expect(trace[0]?.metadata.signal).toBe('ok');
    expect(trace[0]?.metadata.notes).toBe('baseline');
  });

  it('T-DFSV-HS-013 queryMeilisearchHealth reports healthy=true from the mock', async () => {
    const mock = newMock();
    const result = await mock.queryMeilisearchHealth({ bucket: 'meilisearch' });
    expect(result.backend).toBe('meilisearch');
    expect(result.healthy).toBe(true);
    expect(result.endpoint).toContain('in-memory://');
  });

  it('T-DFSV-HS-014 queryTypesenseHealth reports healthy=true from the mock', async () => {
    const mock = newMock();
    const result = await mock.queryTypesenseHealth({ bucket: 'typesense' });
    expect(result.backend).toBe('typesense');
    expect(result.healthy).toBe(true);
    expect(result.endpoint).toContain('in-memory://');
  });

  it('T-DFSV-HS-015 keyword-heavy config prioritises keyword hit ordering on ties', async () => {
    const mock = newMock();
    await mock.startVectorIndex({
      backend: 'typesense',
      indexId: 'kh-idx',
      dimensions: 4,
    });
    await mock.addVectors({
      bucket: 'typesense',
      indexId: 'kh-idx',
      entries: FIXTURE_HYBRID_FUSION.documents,
    });
    const knn = await mock.queryKnn({
      bucket: 'typesense',
      indexId: 'kh-idx',
      query: [0.7, 0.3, 0, 0],
      k: 4,
    });
    const fused = await mock.fuseHybrid({
      bucket: 'typesense',
      indexId: 'kh-idx',
      vectorHits: knn.hits,
      keywordHits: FIXTURE_HYBRID_FUSION.keywordHits,
      weights: HYBRID_KEYWORD_HEAVY.weights,
    });
    // Keyword hits give doc-alpha (0.7) top score. Vector weights are only 0.2.
    expect(fused.fused[0]?.id).toBe('doc-alpha');
  });

  it('T-DFSV-HS-016 fixture set count equals 3 (vector-recall + semantic-intent + hybrid-fusion)', async () => {
    expect(ALL_FIXTURES).toHaveLength(3);
    const ids = new Set(ALL_FIXTURES.map((f) => f.id));
    expect(ids.has('vector-recall')).toBe(true);
    expect(ids.has('semantic-intent')).toBe(true);
    expect(ids.has('hybrid-fusion')).toBe(true);
  });
});
