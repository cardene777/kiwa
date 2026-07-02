import { describe, expect, it } from 'vitest';
import { createMeilisearchMock, createAlgoliaMock, createTypesenseMock } from '../src/index.js';

describe('search — ranking + pagination + filter + facet', () => {
  it('meilisearch ranks by word overlap and includes matched fields', async () => {
    const search = createMeilisearchMock({ typoTolerance: false });
    await search.addDocuments('docs', [
      { id: '1', title: 'kiwa release gate' },
      { id: '2', title: 'kiwa realtime' },
      { id: '3', title: 'random other thing' },
    ]);
    const r = await search.search('docs', { q: 'kiwa release' });
    expect(r.hits[0]?.document.id).toBe('1');
    expect(r.hits[0]?.score).toBeCloseTo(1);
    expect(r.hits[0]?.matchedFields).toContain('title');
    expect(r.totalHits).toBe(2);
  });

  it('offset + limit slice hits deterministically', async () => {
    const algolia = createAlgoliaMock({ typoTolerance: false });
    await algolia.addDocuments(
      'docs',
      Array.from({ length: 20 }, (_, i) => ({ id: `${i}`, title: `alpha item ${i}` })),
    );
    const page1 = await algolia.search('docs', { q: 'alpha', limit: 5, offset: 0 });
    const page2 = await algolia.search('docs', { q: 'alpha', limit: 5, offset: 5 });
    expect(page1.hits).toHaveLength(5);
    expect(page2.hits).toHaveLength(5);
    // pages should not overlap (assumes stable insertion-order tie-break)
    const ids1 = page1.hits.map((h) => h.document.id);
    const ids2 = page2.hits.map((h) => h.document.id);
    for (const id of ids1) expect(ids2).not.toContain(id);
  });

  it('filter narrows hits by exact key/value', async () => {
    const typesense = createTypesenseMock();
    await typesense.addDocuments('books', [
      { id: '1', title: 'kiwa', category: 'testing' },
      { id: '2', title: 'kiwa', category: 'infra' },
    ]);
    const r = await typesense.search('books', { q: 'kiwa', filter: { category: 'testing' } });
    expect(r.hits).toHaveLength(1);
    expect(r.hits[0]?.document.id).toBe('1');
  });

  it('facets return per-value counts', async () => {
    const meili = createMeilisearchMock({ typoTolerance: false });
    await meili.addDocuments('books', [
      { id: '1', title: 'a', category: 'testing' },
      { id: '2', title: 'a', category: 'testing' },
      { id: '3', title: 'a', category: 'infra' },
    ]);
    const r = await meili.search('books', { q: 'a', facets: ['category'] });
    expect(r.facetDistribution.category).toEqual({ testing: 2, infra: 1 });
  });

  it('sort ascending / descending overrides ranking', async () => {
    const meili = createMeilisearchMock({ typoTolerance: false });
    await meili.addDocuments('books', [
      { id: '1', title: 'kiwa a', year: 2020 },
      { id: '2', title: 'kiwa b', year: 2024 },
      { id: '3', title: 'kiwa c', year: 2018 },
    ]);
    const asc = await meili.search('books', { q: 'kiwa', sort: ['year'] });
    const desc = await meili.search('books', { q: 'kiwa', sort: ['-year'] });
    expect(asc.hits.map((h) => h.document.id)).toEqual(['3', '1', '2']);
    expect(desc.hits.map((h) => h.document.id)).toEqual(['2', '1', '3']);
  });

  it('empty query returns all filtered docs with zero score', async () => {
    const algolia = createAlgoliaMock();
    await algolia.addDocuments('books', [
      { id: '1', title: 'a', category: 'x' },
      { id: '2', title: 'b', category: 'y' },
    ]);
    const r = await algolia.search('books', { q: '' });
    expect(r.totalHits).toBe(2);
    expect(r.hits.every((h) => h.score === 0)).toBe(true);
  });
});

describe('search — typo tolerance', () => {
  it('meilisearch matches near-typo when typoTolerance = true (default)', async () => {
    const search = createMeilisearchMock();
    await search.addDocuments('docs', [{ id: '1', title: 'realtime' }]);
    const r = await search.search('docs', { q: 'raltime' });
    expect(r.totalHits).toBe(1);
  });

  it('typesense rejects typo when typoTolerance = false (default)', async () => {
    const search = createTypesenseMock();
    await search.addDocuments('docs', [{ id: '1', title: 'realtime' }]);
    const r = await search.search('docs', { q: 'raltime' });
    expect(r.totalHits).toBe(0);
  });
});
