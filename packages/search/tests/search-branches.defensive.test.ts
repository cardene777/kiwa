import { describe, expect, it } from 'vitest';
import { createTypesenseMock } from '../src/typesense.js';

const INDEX = 'test-idx';

describe('createTypesenseMock defensive branches', () => {
  it('defaults typoTolerance to false when config omitted', () => {
    const mock = createTypesenseMock();
    expect(mock.provider).toBe('typesense');
  });

  it('accepts explicit typoTolerance=true', () => {
    const mock = createTypesenseMock({ typoTolerance: true });
    expect(mock.provider).toBe('typesense');
  });

  it('accepts explicit typoTolerance=false', () => {
    const mock = createTypesenseMock({ typoTolerance: false });
    expect(mock.provider).toBe('typesense');
  });
});

describe('SearchEngine sort defensive branches', () => {
  it('sorts documents ascending by field', async () => {
    const mock = createTypesenseMock();
    await mock.addDocuments(INDEX, [
      { id: '1', name: 'banana', price: 200 },
      { id: '2', name: 'apple', price: 100 },
      { id: '3', name: 'cherry', price: 150 },
    ]);
    const result = await mock.search(INDEX, { q: '', sort: ['price'] });
    expect(result.hits[0]?.document.id).toBe('2');
  });

  it('sorts documents descending with - prefix', async () => {
    const mock = createTypesenseMock();
    await mock.addDocuments(INDEX, [
      { id: '1', name: 'banana', price: 200 },
      { id: '2', name: 'apple', price: 100 },
    ]);
    const result = await mock.search(INDEX, { q: '', sort: ['-price'] });
    expect(result.hits[0]?.document.id).toBe('1');
  });

  it('handles equal sort values (falls through to score)', async () => {
    const mock = createTypesenseMock();
    await mock.addDocuments(INDEX, [
      { id: '1', name: 'apple', price: 100 },
      { id: '2', name: 'banana', price: 100 },
    ]);
    const result = await mock.search(INDEX, { q: '', sort: ['price'] });
    expect(result.hits).toHaveLength(2);
  });

  it('handles undefined sort values (pushed to end)', async () => {
    const mock = createTypesenseMock();
    await mock.addDocuments(INDEX, [
      { id: '1', name: 'apple', price: 100 },
      { id: '2', name: 'banana' },
    ]);
    const result = await mock.search(INDEX, { q: '', sort: ['price'] });
    expect(result.hits[0]?.document.id).toBe('1');
  });

  it('buildFacets returns empty when no facets specified', async () => {
    const mock = createTypesenseMock();
    await mock.addDocuments(INDEX, [
      { id: '1', category: 'a' },
      { id: '2', category: 'b' },
    ]);
    const result = await mock.search(INDEX, { q: '' });
    expect(result.facetDistribution).toEqual({});
  });

  it('buildFacets counts occurrences of string facet values', async () => {
    const mock = createTypesenseMock();
    await mock.addDocuments(INDEX, [
      { id: '1', category: 'a' },
      { id: '2', category: 'a' },
      { id: '3', category: 'b' },
    ]);
    const result = await mock.search(INDEX, {
      q: '',
      facets: ['category'],
    });
    expect(result.facetDistribution.category?.a).toBe(2);
    expect(result.facetDistribution.category?.b).toBe(1);
  });

  it('buildFacets skips non-string non-number facet values', async () => {
    const mock = createTypesenseMock();
    await mock.addDocuments(INDEX, [
      { id: '1', tags: ['x', 'y'] },
      { id: '2', tags: ['z'] },
    ]);
    const result = await mock.search(INDEX, {
      q: '',
      facets: ['tags'],
    });
    expect(result.facetDistribution.tags).toEqual({});
  });
});
