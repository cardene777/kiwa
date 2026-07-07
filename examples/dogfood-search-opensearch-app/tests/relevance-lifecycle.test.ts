/**
 * Relevance lifecycle tests — walk the relevance-axis end-to-end (start
 * session → seed docs → BM25 / TF-IDF / custom ranking / A/B variant)
 * and assert every op appears on the neutral trace and returns the
 * expected result shape. Covers the mock adapter path so the search
 * v0.3 relevance semantics remain observable.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { OpenSearchAdapter, RelevanceDocument } from '../src/adapters/interface.js';
import { driveRelevanceLifecycle } from '../src/flows/search-flows.js';
import { FIXTURE_ARTICLES } from '../src/policies/query-fixtures.js';

function newMock(): OpenSearchAdapter {
  return makeMockAdapter();
}

describe('dogfood-search-opensearch-app — relevance lifecycle', () => {
  it('T-DFSOS-RL-001 startRelevanceSession returns the requested backend + indexId', async () => {
    const mock = newMock();
    const result = await mock.startRelevanceSession({
      backend: 'opensearch-oss',
      indexId: 'idx-articles',
    });
    expect(result.backend).toBe('opensearch-oss');
    expect(result.indexId).toBe('idx-articles');
    expect(result.bm25K1).toBe(1.2);
    expect(result.bm25B).toBe(0.75);
  });

  it('T-DFSOS-RL-002 startRelevanceSession emits relevance.session_started onto the trace', async () => {
    const mock = newMock();
    await mock.startRelevanceSession({
      backend: 'opensearch-oss',
      indexId: 'idx-articles',
    });
    const trace = mock.trace();
    expect(trace).toHaveLength(1);
    expect(trace[0]?.op).toBe('startRelevanceSession');
    expect(trace[0]?.neutralEvent).toBe('relevance.session_started');
    expect(trace[0]?.ok).toBe(true);
  });

  it('T-DFSOS-RL-003 startRelevanceSession providerEvent is prefixed by opensearch-oss target', async () => {
    const mock = newMock();
    await mock.startRelevanceSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
    });
    expect(mock.trace()[0]?.providerEvent).toBe('opensearch-oss.relevance.session_started');
  });

  it('T-DFSOS-RL-004 startRelevanceSession accepts custom bm25K1 / bm25B', async () => {
    const mock = newMock();
    const result = await mock.startRelevanceSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
      bm25K1: 1.8,
      bm25B: 0.5,
    });
    expect(result.bm25K1).toBe(1.8);
    expect(result.bm25B).toBe(0.5);
  });

  it('T-DFSOS-RL-005 seedRelevanceDocuments records seededCount + totalCount', async () => {
    const mock = newMock();
    await mock.startRelevanceSession({
      backend: 'opensearch-oss',
      indexId: 'idx-articles',
    });
    const result = await mock.seedRelevanceDocuments({
      bucket: 'opensearch-oss',
      indexId: 'idx-articles',
      documents: FIXTURE_ARTICLES.relevanceDocuments,
    });
    expect(result.seededCount).toBe(FIXTURE_ARTICLES.relevanceDocuments.length);
    expect(result.totalCount).toBe(FIXTURE_ARTICLES.relevanceDocuments.length);
  });

  it('T-DFSOS-RL-006 seedRelevanceDocuments emits relevance.documents_seeded', async () => {
    const mock = newMock();
    await mock.startRelevanceSession({
      backend: 'opensearch-oss',
      indexId: 'idx-articles',
    });
    await mock.seedRelevanceDocuments({
      bucket: 'opensearch-oss',
      indexId: 'idx-articles',
      documents: FIXTURE_ARTICLES.relevanceDocuments,
    });
    const trace = mock.trace();
    expect(trace.some((e) => e.neutralEvent === 'relevance.documents_seeded')).toBe(true);
  });

  it('T-DFSOS-RL-007 scoreBm25 ranks opensearch-heavy docs above database doc', async () => {
    const mock = newMock();
    await mock.startRelevanceSession({
      backend: 'opensearch-oss',
      indexId: 'idx-articles',
    });
    await mock.seedRelevanceDocuments({
      bucket: 'opensearch-oss',
      indexId: 'idx-articles',
      documents: FIXTURE_ARTICLES.relevanceDocuments,
    });
    const result = await mock.scoreBm25({
      bucket: 'opensearch-oss',
      indexId: 'idx-articles',
      query: 'opensearch',
    });
    expect(result.hitCount).toBe(FIXTURE_ARTICLES.relevanceDocuments.length);
    // Top hit must contain "opensearch" in its content.
    const topId = result.hits[0]?.id ?? '';
    expect(topId.startsWith('a-opensearch')).toBe(true);
    // Database doc must not top the ranking.
    expect(topId).not.toBe('a-database-overview');
  });

  it('T-DFSOS-RL-008 scoreBm25 emits relevance.bm25_scored', async () => {
    const mock = newMock();
    await mock.startRelevanceSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
    });
    await mock.seedRelevanceDocuments({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      documents: FIXTURE_ARTICLES.relevanceDocuments,
    });
    await mock.scoreBm25({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      query: 'opensearch',
    });
    expect(mock.trace().some((e) => e.neutralEvent === 'relevance.bm25_scored')).toBe(true);
  });

  it('T-DFSOS-RL-009 scoreTfIdf returns hits with descending score ordering', async () => {
    const mock = newMock();
    await mock.startRelevanceSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
    });
    await mock.seedRelevanceDocuments({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      documents: FIXTURE_ARTICLES.relevanceDocuments,
    });
    const result = await mock.scoreTfIdf({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      query: 'search',
    });
    for (let i = 1; i < result.hits.length; i++) {
      const prev = result.hits[i - 1]!.score;
      const cur = result.hits[i]!.score;
      expect(cur).toBeLessThanOrEqual(prev);
    }
  });

  it('T-DFSOS-RL-010 applyCustomRanking boosts docs via boostSignal', async () => {
    const mock = newMock();
    await mock.startRelevanceSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
    });
    await mock.seedRelevanceDocuments({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      documents: FIXTURE_ARTICLES.relevanceDocuments,
    });
    const bm25 = await mock.scoreBm25({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      query: 'opensearch',
    });
    const boostFn = (d: RelevanceDocument): number => d.boostSignal ?? 1;
    const ranked = await mock.applyCustomRanking({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      hits: bm25.hits,
      boostFn,
    });
    expect(ranked.hitCount).toBe(bm25.hitCount);
    // Custom ranking must not make the top score lower than 0.
    expect(ranked.topScore).toBeGreaterThanOrEqual(0);
  });

  it('T-DFSOS-RL-011 applyCustomRanking emits relevance.custom_ranking_applied', async () => {
    const mock = newMock();
    await mock.startRelevanceSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
    });
    await mock.seedRelevanceDocuments({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      documents: FIXTURE_ARTICLES.relevanceDocuments,
    });
    const bm25 = await mock.scoreBm25({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      query: 'opensearch',
    });
    await mock.applyCustomRanking({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      hits: bm25.hits,
      boostFn: () => 1,
    });
    expect(
      mock.trace().some((e) => e.neutralEvent === 'relevance.custom_ranking_applied'),
    ).toBe(true);
  });

  it('T-DFSOS-RL-012 selectAbVariant chooses one of the input variants deterministically', async () => {
    const mock = newMock();
    await mock.startRelevanceSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
    });
    const variants = ['bm25', 'tfidf', 'custom'] as const;
    const a = await mock.selectAbVariant({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      variants,
      userId: 'user-42',
    });
    const b = await mock.selectAbVariant({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      variants,
      userId: 'user-42',
    });
    expect(variants).toContain(a.variant);
    expect(a.variant).toBe(b.variant);
  });

  it('T-DFSOS-RL-013 selectAbVariant is stable per userId + salt', async () => {
    const mock = newMock();
    await mock.startRelevanceSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
    });
    const a = await mock.selectAbVariant({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      variants: ['A', 'B'],
      userId: 'user-1',
      salt: 'exp',
    });
    const b = await mock.selectAbVariant({
      bucket: 'opensearch-oss',
      indexId: 'idx',
      variants: ['A', 'B'],
      userId: 'user-1',
      salt: 'exp',
    });
    expect(a.variant).toBe(b.variant);
  });

  it('T-DFSOS-RL-014 seedRelevanceDocuments on unstarted bucket throws', async () => {
    const mock = newMock();
    await expect(
      mock.seedRelevanceDocuments({
        bucket: 'opensearch-oss',
        indexId: 'nope',
        documents: [],
      }),
    ).rejects.toThrow(/has not been started/);
  });

  it('T-DFSOS-RL-015 driveRelevanceLifecycle emits every relevance op onto the trace', async () => {
    const mock = newMock();
    await driveRelevanceLifecycle(mock, {
      backend: 'opensearch-oss',
      indexId: 'lifecycle-idx',
      fixture: FIXTURE_ARTICLES,
    });
    const ops = new Set(mock.trace().map((t) => t.op));
    expect(ops.has('startRelevanceSession')).toBe(true);
    expect(ops.has('seedRelevanceDocuments')).toBe(true);
    expect(ops.has('scoreBm25')).toBe(true);
    expect(ops.has('scoreTfIdf')).toBe(true);
    expect(ops.has('applyCustomRanking')).toBe(true);
    expect(ops.has('selectAbVariant')).toBe(true);
  });

  it('T-DFSOS-RL-016 reset drops all state', async () => {
    const mock = newMock();
    await mock.startRelevanceSession({
      backend: 'opensearch-oss',
      indexId: 'idx',
    });
    await mock.reset();
    expect(mock.trace()).toHaveLength(0);
    await expect(
      mock.seedRelevanceDocuments({
        bucket: 'opensearch-oss',
        indexId: 'idx',
        documents: [],
      }),
    ).rejects.toThrow(/has not been started/);
  });
});
