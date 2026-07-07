import { describe, expect, it } from 'vitest';
import {
  applyCustomRanking,
  scoreBm25,
  scoreTfIdf,
  seedRelevanceDocuments,
  selectAbVariant,
  startRelevanceSession,
} from '../../src/semantics/index.js';

const sampleDocs = [
  { id: 'a', content: 'search engine mock kiwa realtime' },
  { id: 'b', content: 'kiwa release gate mock' },
  { id: 'c', content: 'random unrelated text' },
  { id: 'd', content: 'kiwa kiwa kiwa dense hit' },
];

describe('relevance axis — happy path', () => {
  it('BM25 ranks documents with more term matches higher', () => {
    const s = startRelevanceSession({ target: 'meilisearch', indexId: 'x' });
    seedRelevanceDocuments(s, sampleDocs);
    const { hits } = scoreBm25(s, 'kiwa');
    expect(hits[0]?.id).toBe('d');
  });

  it('TF-IDF ranks documents where term is relatively rare', () => {
    const s = startRelevanceSession({ target: 'typesense', indexId: 'x' });
    seedRelevanceDocuments(s, sampleDocs);
    const { hits } = scoreTfIdf(s, 'random');
    expect(hits[0]?.id).toBe('c');
  });

  it('custom ranking boosts by attribute signal', () => {
    const s = startRelevanceSession({ target: 'algolia', indexId: 'x' });
    seedRelevanceDocuments(s, [
      { id: 'a', content: 'kiwa', boostSignal: 1 },
      { id: 'b', content: 'kiwa kiwa', boostSignal: 10 },
    ]);
    const { hits } = scoreBm25(s, 'kiwa');
    const { ranked } = applyCustomRanking(s, hits, {
      boostFn: (d) => d.boostSignal ?? 1,
    });
    expect(ranked[0]?.id).toBe('b');
  });

  it('A/B variant is stable per userId', () => {
    const s = startRelevanceSession({ target: 'opensearch-oss', indexId: 'x' });
    const first = selectAbVariant(s, { variants: ['A', 'B'], userId: 'user-1' });
    const second = selectAbVariant(s, { variants: ['A', 'B'], userId: 'user-1' });
    expect(first.variant).toBe(second.variant);
  });

  it('A/B variant distributes across users', () => {
    const s = startRelevanceSession({ target: 'meilisearch', indexId: 'x' });
    const variants = new Set<string>();
    for (let i = 0; i < 200; i += 1) {
      const { variant } = selectAbVariant(s, { variants: ['A', 'B', 'C'], userId: `u-${i}` });
      variants.add(variant);
    }
    expect(variants.size).toBeGreaterThanOrEqual(2);
  });

  it('state transitions through all 4 events', () => {
    const s = startRelevanceSession({ target: 'meilisearch', indexId: 'x' });
    seedRelevanceDocuments(s, sampleDocs);
    const { hits } = scoreBm25(s, 'kiwa');
    scoreTfIdf(s, 'kiwa');
    applyCustomRanking(s, hits, { boostFn: () => 1 });
    selectAbVariant(s, { variants: ['A', 'B'], userId: 'x' });
    expect(s.history.map((h) => h.neutralEvent)).toEqual([
      'relevance.bm25_scored',
      'relevance.tfidf_scored',
      'relevance.custom_ranking_applied',
      'relevance.ab_variant_selected',
    ]);
  });

  it('BM25 tuning params k1 / b are configurable', () => {
    const s = startRelevanceSession({ target: 'meilisearch', indexId: 'x', bm25K1: 1.5, bm25B: 0.5 });
    expect(s.bm25K1).toBe(1.5);
    expect(s.bm25B).toBe(0.5);
    seedRelevanceDocuments(s, sampleDocs);
    const { step } = scoreBm25(s, 'kiwa');
    expect(step.metadata.k1).toBe(1.5);
    expect(step.metadata.b).toBe(0.5);
  });

  it('translates provider events for each target', () => {
    for (const target of ['meilisearch', 'typesense', 'algolia', 'opensearch-oss'] as const) {
      const s = startRelevanceSession({ target, indexId: 'x' });
      seedRelevanceDocuments(s, sampleDocs);
      const { step } = scoreBm25(s, 'kiwa');
      expect(step.providerEvent).not.toBe(step.neutralEvent);
    }
  });
});

describe('relevance axis — invariant guards', () => {
  it('rejects empty indexId', () => {
    expect(() => startRelevanceSession({ target: 'meilisearch', indexId: '' })).toThrow(
      /indexId must not be empty/,
    );
  });

  it('rejects bad bm25K1', () => {
    expect(() => startRelevanceSession({ target: 'meilisearch', indexId: 'x', bm25K1: 0 })).toThrow(
      /bm25K1 must be positive/,
    );
  });

  it('rejects out-of-range bm25B', () => {
    expect(() => startRelevanceSession({ target: 'meilisearch', indexId: 'x', bm25B: 1.5 })).toThrow(
      /bm25B must be within/,
    );
  });

  it('BM25 rejects empty query', () => {
    const s = startRelevanceSession({ target: 'meilisearch', indexId: 'x' });
    seedRelevanceDocuments(s, sampleDocs);
    expect(() => scoreBm25(s, '')).toThrow(/at least one token/);
  });

  it('BM25 rejects empty document seed', () => {
    const s = startRelevanceSession({ target: 'meilisearch', indexId: 'x' });
    expect(() => scoreBm25(s, 'k')).toThrow(/no documents seeded/);
  });

  it('TF-IDF rejects empty query', () => {
    const s = startRelevanceSession({ target: 'meilisearch', indexId: 'x' });
    seedRelevanceDocuments(s, sampleDocs);
    expect(() => scoreTfIdf(s, '')).toThrow(/at least one token/);
  });

  it('TF-IDF rejects empty document seed', () => {
    const s = startRelevanceSession({ target: 'meilisearch', indexId: 'x' });
    expect(() => scoreTfIdf(s, 'k')).toThrow(/no documents seeded/);
  });

  it('A/B rejects empty variants', () => {
    const s = startRelevanceSession({ target: 'meilisearch', indexId: 'x' });
    expect(() => selectAbVariant(s, { variants: [], userId: 'x' })).toThrow(
      /variants must not be empty/,
    );
  });

  it('A/B rejects empty userId', () => {
    const s = startRelevanceSession({ target: 'meilisearch', indexId: 'x' });
    expect(() => selectAbVariant(s, { variants: ['A'], userId: '' })).toThrow(
      /userId must not be empty/,
    );
  });
});
