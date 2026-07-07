import { describe, expect, it } from 'vitest';
import {
  applyRefinedFilter,
  computeNestedFacets,
  countDistinct,
  seedFacetedDocuments,
  startFacetedSession,
  traverseHierarchy,
} from '../../src/semantics/index.js';

describe('faceted-advanced axis — happy path', () => {
  it('nested facets group inner values per outer value', () => {
    const s = startFacetedSession({ target: 'meilisearch', indexId: 'products' });
    seedFacetedDocuments(s, [
      { id: '1', facets: { category: 'shoes', color: 'red' } },
      { id: '2', facets: { category: 'shoes', color: 'red' } },
      { id: '3', facets: { category: 'shoes', color: 'blue' } },
      { id: '4', facets: { category: 'hats', color: 'red' } },
    ]);
    const { tree } = computeNestedFacets(s, {
      facetField: 'category',
      subFacetField: 'color',
    });
    const shoes = tree.find((n) => n.value === 'shoes');
    expect(shoes?.count).toBe(3);
    const red = shoes?.children?.find((c) => c.value === 'red');
    expect(red?.count).toBe(2);
  });

  it('hierarchy traversal counts each path level', () => {
    const s = startFacetedSession({ target: 'typesense', indexId: 'catalog' });
    seedFacetedDocuments(s, [
      { id: '1', facets: { path: 'a>b>c' } },
      { id: '2', facets: { path: 'a>b>d' } },
      { id: '3', facets: { path: 'a>x' } },
    ]);
    const { levels } = traverseHierarchy(s, { field: 'path' });
    expect(levels['a']).toBe(3);
    expect(levels['a>b']).toBe(2);
    expect(levels['a>b>c']).toBe(1);
    expect(levels['a>x']).toBe(1);
  });

  it('hierarchy accepts custom separator', () => {
    const s = startFacetedSession({ target: 'algolia', indexId: 'x' });
    seedFacetedDocuments(s, [{ id: '1', facets: { path: 'a/b/c' } }]);
    const { levels } = traverseHierarchy(s, { field: 'path', separator: '/' });
    expect(levels['a']).toBe(1);
    expect(levels['a/b']).toBe(1);
  });

  it('distinct count deduplicates single-valued facet', () => {
    const s = startFacetedSession({ target: 'opensearch-oss', indexId: 'x' });
    seedFacetedDocuments(s, [
      { id: '1', facets: { brand: 'apple' } },
      { id: '2', facets: { brand: 'apple' } },
      { id: '3', facets: { brand: 'sony' } },
    ]);
    const { distinct } = countDistinct(s, { field: 'brand' });
    expect(distinct).toBe(2);
  });

  it('distinct count expands array-valued facet', () => {
    const s = startFacetedSession({ target: 'meilisearch', indexId: 'x' });
    seedFacetedDocuments(s, [
      { id: '1', facets: { tags: ['red', 'blue'] } },
      { id: '2', facets: { tags: ['blue', 'green'] } },
    ]);
    const { distinct } = countDistinct(s, { field: 'tags' });
    expect(distinct).toBe(3);
  });

  it('refined filter narrows single-valued facet', () => {
    const s = startFacetedSession({ target: 'typesense', indexId: 'x' });
    seedFacetedDocuments(s, [
      { id: '1', facets: { category: 'shoes' } },
      { id: '2', facets: { category: 'hats' } },
      { id: '3', facets: { category: 'shoes' } },
    ]);
    const { remaining } = applyRefinedFilter(s, { field: 'category', value: 'shoes' });
    expect(remaining).toHaveLength(2);
    expect(remaining.every((d) => d.facets['category'] === 'shoes')).toBe(true);
  });

  it('refined filter matches array-valued facet', () => {
    const s = startFacetedSession({ target: 'meilisearch', indexId: 'x' });
    seedFacetedDocuments(s, [
      { id: '1', facets: { tags: ['a', 'b'] } },
      { id: '2', facets: { tags: ['c'] } },
    ]);
    const { remaining } = applyRefinedFilter(s, { field: 'tags', value: 'a' });
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.id).toBe('1');
  });

  it('state transitions through all 4 events', () => {
    const s = startFacetedSession({ target: 'meilisearch', indexId: 'x' });
    seedFacetedDocuments(s, [
      { id: '1', facets: { c: 'a', s: 'x', p: 'a>b' } },
      { id: '2', facets: { c: 'a', s: 'y', p: 'a>c' } },
    ]);
    computeNestedFacets(s, { facetField: 'c', subFacetField: 's' });
    traverseHierarchy(s, { field: 'p' });
    countDistinct(s, { field: 'c' });
    applyRefinedFilter(s, { field: 'c', value: 'a' });
    expect(s.history.map((h) => h.neutralEvent)).toEqual([
      'facet.nested_computed',
      'facet.hierarchy_traversed',
      'facet.distinct_counted',
      'facet.refined_filter_applied',
    ]);
  });

  it('translates provider events for each target', () => {
    for (const target of ['meilisearch', 'typesense', 'algolia', 'opensearch-oss'] as const) {
      const s = startFacetedSession({ target, indexId: 'x' });
      seedFacetedDocuments(s, [{ id: '1', facets: { c: 'x', s: 'y' } }]);
      const { step } = computeNestedFacets(s, { facetField: 'c', subFacetField: 's' });
      expect(step.providerEvent).not.toBe(step.neutralEvent);
    }
  });
});

describe('faceted-advanced axis — invariant guards', () => {
  it('rejects empty indexId', () => {
    expect(() => startFacetedSession({ target: 'meilisearch', indexId: '' })).toThrow(
      /indexId must not be empty/,
    );
  });

  it('rejects nested facet compute on empty session', () => {
    const s = startFacetedSession({ target: 'meilisearch', indexId: 'x' });
    expect(() => computeNestedFacets(s, { facetField: 'c', subFacetField: 's' })).toThrow(
      /no documents seeded/,
    );
  });

  it('ignores docs without facet field in nested compute', () => {
    const s = startFacetedSession({ target: 'meilisearch', indexId: 'x' });
    seedFacetedDocuments(s, [{ id: '1', facets: { other: 'x' } }]);
    const { tree } = computeNestedFacets(s, { facetField: 'c', subFacetField: 's' });
    expect(tree).toHaveLength(0);
  });

  it('hierarchy traversal ignores docs without path field', () => {
    const s = startFacetedSession({ target: 'meilisearch', indexId: 'x' });
    seedFacetedDocuments(s, [{ id: '1', facets: {} }]);
    const { levels } = traverseHierarchy(s, { field: 'p' });
    expect(Object.keys(levels)).toHaveLength(0);
  });

  it('distinct counts 0 for missing field', () => {
    const s = startFacetedSession({ target: 'meilisearch', indexId: 'x' });
    seedFacetedDocuments(s, [{ id: '1', facets: {} }]);
    const { distinct } = countDistinct(s, { field: 'brand' });
    expect(distinct).toBe(0);
  });

  it('refined filter returns 0 hits on no match', () => {
    const s = startFacetedSession({ target: 'meilisearch', indexId: 'x' });
    seedFacetedDocuments(s, [{ id: '1', facets: { c: 'a' } }]);
    const { remaining } = applyRefinedFilter(s, { field: 'c', value: 'z' });
    expect(remaining).toHaveLength(0);
  });
});
