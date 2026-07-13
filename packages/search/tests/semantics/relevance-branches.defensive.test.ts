import { describe, expect, it } from 'vitest';
import {
  applyCustomRanking,
  scoreBm25,
  scoreTfIdf,
  seedRelevanceDocuments,
  selectAbVariant,
  startRelevanceSession,
} from '../../src/semantics/index.js';

describe('relevance defensive branches', () => {
  it('scoreBm25 without seeded documents throws error', () => {
    const s = startRelevanceSession({ target: 'algolia', indexId: 'x' });
    expect(() => scoreBm25(s, 'hello world')).toThrow(/no documents seeded/);
  });

  it('scoreBm25 with tf=0 for query token skips continue branch', () => {
    const s = startRelevanceSession({ target: 'algolia', indexId: 'x' });
    seedRelevanceDocuments(s, [
      { id: 'a', content: 'hello world' },
      { id: 'b', content: 'foo bar' },
    ]);
    const { hits } = scoreBm25(s, 'unmatched-token');
    expect(hits.every((h) => h.score === 0)).toBe(true);
  });

  it('scoreBm25 with all-empty documents falls back to avgDocLen guard', () => {
    const s = startRelevanceSession({ target: 'algolia', indexId: 'x' });
    seedRelevanceDocuments(s, [{ id: 'empty', content: '' }]);
    const { hits } = scoreBm25(s, 'any');
    expect(hits).toBeDefined();
  });

  it('scoreTfIdf without seeded documents throws error', () => {
    const s = startRelevanceSession({ target: 'meilisearch', indexId: 'x' });
    expect(() => scoreTfIdf(s, 'query')).toThrow(/no documents seeded/);
  });

  it('scoreTfIdf with tf=0 for query token skips continue branch', () => {
    const s = startRelevanceSession({ target: 'meilisearch', indexId: 'x' });
    seedRelevanceDocuments(s, [
      { id: 'doc-a', content: 'apple banana' },
      { id: 'doc-b', content: 'cherry date' },
    ]);
    const { hits } = scoreTfIdf(s, 'nomatch');
    expect(hits.every((h) => h.score === 0)).toBe(true);
  });

  it('scoreTfIdf with empty document content uses docLen=1 fallback', () => {
    const s = startRelevanceSession({ target: 'meilisearch', indexId: 'x' });
    seedRelevanceDocuments(s, [
      { id: 'empty', content: '' },
      { id: 'ok', content: 'hello' },
    ]);
    const { hits } = scoreTfIdf(s, 'hello');
    expect(hits).toBeDefined();
  });

  it('applyCustomRanking with unknown doc id in hits uses boost=1 fallback', () => {
    const s = startRelevanceSession({ target: 'algolia', indexId: 'x' });
    seedRelevanceDocuments(s, [{ id: 'a', content: 'test' }]);
    const { hits: bm } = scoreBm25(s, 'test');
    const withOrphan = [...bm, { id: 'ghost', score: 5 }];
    const { ranked } = applyCustomRanking(s, withOrphan, {
      boostFn: (doc) => (doc.id === 'a' ? 2 : 1),
    });
    expect(ranked.length).toBe(2);
  });

  it('selectAbVariant throws when variants array is empty', () => {
    const s = startRelevanceSession({ target: 'algolia', indexId: 'x' });
    expect(() =>
      selectAbVariant(s, { userId: 'u1', variants: [] }),
    ).toThrow(/variants must not be empty/);
  });

  it('selectAbVariant with custom salt returns deterministic variant', () => {
    const s = startRelevanceSession({ target: 'algolia', indexId: 'x' });
    const result = selectAbVariant(s, {
      userId: 'user-42',
      variants: ['A', 'B', 'C'],
      salt: 'custom-salt-value',
    });
    expect(['A', 'B', 'C']).toContain(result.variant);
  });

  it('selectAbVariant deterministic for same user + salt across sessions', () => {
    const s1 = startRelevanceSession({ target: 'algolia', indexId: 'x' });
    const s2 = startRelevanceSession({ target: 'algolia', indexId: 'x' });
    const r1 = selectAbVariant(s1, {
      userId: 'user-99',
      variants: ['V1', 'V2', 'V3'],
      salt: 'stable-salt',
    });
    const r2 = selectAbVariant(s2, {
      userId: 'user-99',
      variants: ['V1', 'V2', 'V3'],
      salt: 'stable-salt',
    });
    expect(r1.variant).toBe(r2.variant);
  });
});
