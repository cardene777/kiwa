/**
 * Semantic lifecycle tests — walk the semantic-axis end-to-end (start
 * session → understand query → classify intent → cross-encoder rerank →
 * cache embedding) and assert every op returns the expected result
 * shape. These tests cover the mock adapter path so the search v0.3
 * semantic axis semantics remain observable.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { SearchHybridAdapter } from '../src/adapters/interface.js';
import { driveSemanticLifecycle } from '../src/flows/search-flows.js';
import { FIXTURE_SEMANTIC_INTENT } from '../src/policies/query-fixtures.js';

function newMock(): SearchHybridAdapter {
  return makeMockAdapter();
}

describe('dogfood-search-vector-app — semantic lifecycle', () => {
  it('T-DFSV-SL-001 startSemanticSession returns the requested backend + sessionId', async () => {
    const mock = newMock();
    const result = await mock.startSemanticSession({
      backend: 'meilisearch',
      sessionId: 'sess-1',
    });
    expect(result.backend).toBe('meilisearch');
    expect(result.sessionId).toBe('sess-1');
    expect(result.rerankModel).toContain('ms-marco');
  });

  it('T-DFSV-SL-002 startSemanticSession accepts custom rerankModel', async () => {
    const mock = newMock();
    const result = await mock.startSemanticSession({
      backend: 'typesense',
      sessionId: 'sess-x',
      rerankModel: 'custom-cross-encoder',
    });
    expect(result.rerankModel).toBe('custom-cross-encoder');
  });

  it('T-DFSV-SL-003 startSemanticSession emits semantic.session_started onto the trace', async () => {
    const mock = newMock();
    await mock.startSemanticSession({
      backend: 'meilisearch',
      sessionId: 'sess-1',
    });
    const trace = mock.trace();
    expect(trace[0]?.op).toBe('startSemanticSession');
    expect(trace[0]?.neutralEvent).toBe('semantic.session_started');
    expect(trace[0]?.ok).toBe(true);
  });

  it('T-DFSV-SL-004 understandQuery normalizes the raw query (trim + lowercase)', async () => {
    const mock = newMock();
    await mock.startSemanticSession({
      backend: 'meilisearch',
      sessionId: 'sess-1',
    });
    const result = await mock.understandQuery({
      bucket: 'meilisearch',
      sessionId: 'sess-1',
      rawQuery: '  HELLO World  ',
    });
    expect(result.normalizedQuery).toBe('hello world');
    expect(result.length).toBe('  HELLO World  '.length);
  });

  it('T-DFSV-SL-005 understandQuery rejects empty rawQuery', async () => {
    const mock = newMock();
    await mock.startSemanticSession({
      backend: 'meilisearch',
      sessionId: 'sess-1',
    });
    await expect(
      mock.understandQuery({
        bucket: 'meilisearch',
        sessionId: 'sess-1',
        rawQuery: '',
      }),
    ).rejects.toThrow(/rawQuery/);
  });

  it('T-DFSV-SL-006 classifyIntent detects transactional intent for a buy query', async () => {
    const mock = newMock();
    await mock.startSemanticSession({
      backend: 'meilisearch',
      sessionId: 'sess-1',
    });
    await mock.understandQuery({
      bucket: 'meilisearch',
      sessionId: 'sess-1',
      rawQuery: 'buy Meilisearch cheap price',
    });
    const result = await mock.classifyIntent({
      bucket: 'meilisearch',
      sessionId: 'sess-1',
    });
    expect(result.intent).toBe('transactional');
  });

  it('T-DFSV-SL-007 classifyIntent detects commercial intent for a compare query', async () => {
    const mock = newMock();
    await mock.startSemanticSession({
      backend: 'meilisearch',
      sessionId: 'sess-1',
    });
    await mock.understandQuery({
      bucket: 'meilisearch',
      sessionId: 'sess-1',
      rawQuery: 'Meilisearch vs Typesense review best',
    });
    const result = await mock.classifyIntent({
      bucket: 'meilisearch',
      sessionId: 'sess-1',
    });
    expect(result.intent).toBe('commercial');
  });

  it('T-DFSV-SL-008 classifyIntent detects navigational intent for a login query', async () => {
    const mock = newMock();
    await mock.startSemanticSession({
      backend: 'meilisearch',
      sessionId: 'sess-1',
    });
    await mock.understandQuery({
      bucket: 'meilisearch',
      sessionId: 'sess-1',
      rawQuery: 'Meilisearch login official homepage',
    });
    const result = await mock.classifyIntent({
      bucket: 'meilisearch',
      sessionId: 'sess-1',
    });
    expect(result.intent).toBe('navigational');
  });

  it('T-DFSV-SL-009 classifyIntent defaults to informational when no keywords match', async () => {
    const mock = newMock();
    await mock.startSemanticSession({
      backend: 'meilisearch',
      sessionId: 'sess-1',
    });
    await mock.understandQuery({
      bucket: 'meilisearch',
      sessionId: 'sess-1',
      rawQuery: 'how to tune index guide tutorial',
    });
    const result = await mock.classifyIntent({
      bucket: 'meilisearch',
      sessionId: 'sess-1',
    });
    expect(result.intent).toBe('informational');
  });

  it('T-DFSV-SL-010 crossEncoderRerank produces fusedScore for every candidate', async () => {
    const mock = newMock();
    await mock.startSemanticSession({
      backend: 'meilisearch',
      sessionId: 'sess-1',
    });
    await mock.understandQuery({
      bucket: 'meilisearch',
      sessionId: 'sess-1',
      rawQuery: 'compare alpha beta review best',
    });
    await mock.classifyIntent({
      bucket: 'meilisearch',
      sessionId: 'sess-1',
    });
    const result = await mock.crossEncoderRerank({
      bucket: 'meilisearch',
      sessionId: 'sess-1',
      candidates: [
        { id: 'a', content: 'alpha compare review', baseScore: 0.8 },
        { id: 'b', content: 'beta compare review', baseScore: 0.7 },
        { id: 'c', content: 'unrelated', baseScore: 0.3 },
      ],
    });
    expect(result.reranked).toHaveLength(3);
    expect(result.candidateCount).toBe(3);
    // fusedScore sorted desc.
    for (let i = 1; i < result.reranked.length; i++) {
      expect(result.reranked[i]!.fusedScore).toBeLessThanOrEqual(
        result.reranked[i - 1]!.fusedScore,
      );
    }
  });

  it('T-DFSV-SL-011 crossEncoderRerank rejects empty candidate list', async () => {
    const mock = newMock();
    await mock.startSemanticSession({
      backend: 'meilisearch',
      sessionId: 'sess-1',
    });
    await mock.understandQuery({
      bucket: 'meilisearch',
      sessionId: 'sess-1',
      rawQuery: 'query',
    });
    await mock.classifyIntent({
      bucket: 'meilisearch',
      sessionId: 'sess-1',
    });
    await expect(
      mock.crossEncoderRerank({
        bucket: 'meilisearch',
        sessionId: 'sess-1',
        candidates: [],
      }),
    ).rejects.toThrow(/candidates/);
  });

  it('T-DFSV-SL-012 cacheEmbedding stores key + increments cacheSize', async () => {
    const mock = newMock();
    await mock.startSemanticSession({
      backend: 'meilisearch',
      sessionId: 'sess-1',
    });
    const r1 = await mock.cacheEmbedding({
      bucket: 'meilisearch',
      sessionId: 'sess-1',
      key: 'q1',
      embedding: [1, 0, 0, 0],
    });
    expect(r1.dim).toBe(4);
    expect(r1.cacheSize).toBe(1);
    const r2 = await mock.cacheEmbedding({
      bucket: 'meilisearch',
      sessionId: 'sess-1',
      key: 'q2',
      embedding: [0, 1, 0, 0],
    });
    expect(r2.cacheSize).toBe(2);
  });

  it('T-DFSV-SL-013 cacheEmbedding rejects empty key', async () => {
    const mock = newMock();
    await mock.startSemanticSession({
      backend: 'meilisearch',
      sessionId: 'sess-1',
    });
    await expect(
      mock.cacheEmbedding({
        bucket: 'meilisearch',
        sessionId: 'sess-1',
        key: '',
        embedding: [1, 0],
      }),
    ).rejects.toThrow(/key/);
  });

  it('T-DFSV-SL-014 driveSemanticLifecycle emits all 5 semantic ops', async () => {
    const mock = newMock();
    await driveSemanticLifecycle(mock, {
      backend: 'meilisearch',
      sessionId: 'lifecycle-sess',
      fixture: FIXTURE_SEMANTIC_INTENT,
    });
    const trace = mock.trace();
    const ops = new Set(trace.map((t) => t.op));
    expect(ops.has('startSemanticSession')).toBe(true);
    expect(ops.has('understandQuery')).toBe(true);
    expect(ops.has('classifyIntent')).toBe(true);
    expect(ops.has('crossEncoderRerank')).toBe(true);
    expect(ops.has('cacheEmbedding')).toBe(true);
  });
});
