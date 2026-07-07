import { describe, expect, it } from 'vitest';
import {
  bucketHistogram,
  computePercentile,
  evaluateBooleanTree,
  resolveNestedQuery,
  seedQueryDslDocuments,
  startQueryDslSession,
} from '../../src/semantics/index.js';
import type { QueryClause } from '../../src/semantics/index.js';

const sampleDocs = [
  {
    id: 'a',
    fields: { category: 'shoes', price: 100, brand: 'nike' },
    nested: {
      variants: [
        { color: 'red', stock: 5 },
        { color: 'blue', stock: 0 },
      ],
    },
  },
  {
    id: 'b',
    fields: { category: 'shoes', price: 200, brand: 'adidas' },
    nested: {
      variants: [{ color: 'green', stock: 3 }],
    },
  },
  {
    id: 'c',
    fields: { category: 'hats', price: 50, brand: 'nike' },
  },
  {
    id: 'd',
    fields: { category: 'hats', price: 75, brand: 'puma' },
  },
];

describe('query-dsl axis — happy path', () => {
  it('AND of two leaves narrows results', () => {
    const s = startQueryDslSession({ target: 'meilisearch', indexId: 'products' });
    seedQueryDslDocuments(s, sampleDocs);
    const tree: QueryClause = {
      kind: 'bool',
      op: 'and',
      clauses: [
        { kind: 'leaf', field: 'category', op: 'eq', value: 'shoes' },
        { kind: 'leaf', field: 'brand', op: 'eq', value: 'nike' },
      ],
    };
    const { matched } = evaluateBooleanTree(s, tree);
    expect(matched.map((d) => d.id)).toEqual(['a']);
  });

  it('OR of two leaves expands results', () => {
    const s = startQueryDslSession({ target: 'typesense', indexId: 'products' });
    seedQueryDslDocuments(s, sampleDocs);
    const tree: QueryClause = {
      kind: 'bool',
      op: 'or',
      clauses: [
        { kind: 'leaf', field: 'category', op: 'eq', value: 'shoes' },
        { kind: 'leaf', field: 'brand', op: 'eq', value: 'puma' },
      ],
    };
    const { matched } = evaluateBooleanTree(s, tree);
    expect(matched.map((d) => d.id).sort()).toEqual(['a', 'b', 'd']);
  });

  it('NOT excludes matching clauses', () => {
    const s = startQueryDslSession({ target: 'algolia', indexId: 'x' });
    seedQueryDslDocuments(s, sampleDocs);
    const tree: QueryClause = {
      kind: 'bool',
      op: 'not',
      clauses: [{ kind: 'leaf', field: 'category', op: 'eq', value: 'hats' }],
    };
    const { matched } = evaluateBooleanTree(s, tree);
    expect(matched.map((d) => d.id).sort()).toEqual(['a', 'b']);
  });

  it('range operators lt/lte/gt/gte narrow numeric field', () => {
    const s = startQueryDslSession({ target: 'opensearch-oss', indexId: 'x' });
    seedQueryDslDocuments(s, sampleDocs);
    const gt = evaluateBooleanTree(s, {
      kind: 'leaf',
      field: 'price',
      op: 'gt',
      value: 100,
    });
    expect(gt.matched.map((d) => d.id).sort()).toEqual(['b']);
    const lte = evaluateBooleanTree(s, {
      kind: 'leaf',
      field: 'price',
      op: 'lte',
      value: 75,
    });
    expect(lte.matched.map((d) => d.id).sort()).toEqual(['c', 'd']);
  });

  it('contains matches substring in string field', () => {
    const s = startQueryDslSession({ target: 'meilisearch', indexId: 'x' });
    seedQueryDslDocuments(s, sampleDocs);
    const { matched } = evaluateBooleanTree(s, {
      kind: 'leaf',
      field: 'brand',
      op: 'contains',
      value: 'ike',
    });
    expect(matched.map((d) => d.id).sort()).toEqual(['a', 'c']);
  });

  it('nested query matches on inner path', () => {
    const s = startQueryDslSession({ target: 'algolia', indexId: 'x' });
    seedQueryDslDocuments(s, sampleDocs);
    const { matched } = resolveNestedQuery(s, {
      path: 'variants',
      clause: { kind: 'leaf', field: 'color', op: 'eq', value: 'red' },
    });
    expect(matched.map((d) => d.id)).toEqual(['a']);
  });

  it('histogram buckets numeric field by interval', () => {
    const s = startQueryDslSession({ target: 'meilisearch', indexId: 'x' });
    seedQueryDslDocuments(s, sampleDocs);
    const { buckets } = bucketHistogram(s, { field: 'price', interval: 50 });
    const map = new Map(buckets.map((b) => [b.key, b.count]));
    expect(map.get(50)).toBe(2); // 50 and 75
    expect(map.get(100)).toBe(1);
    expect(map.get(200)).toBe(1);
  });

  it('percentile computes median (p50) correctly', () => {
    const s = startQueryDslSession({ target: 'meilisearch', indexId: 'x' });
    seedQueryDslDocuments(s, sampleDocs);
    const { value } = computePercentile(s, { field: 'price', percentile: 50 });
    // sorted: 50, 75, 100, 200 → p50 = (75+100)/2 = 87.5
    expect(value).toBeCloseTo(87.5, 6);
  });

  it('percentile p100 = max', () => {
    const s = startQueryDslSession({ target: 'meilisearch', indexId: 'x' });
    seedQueryDslDocuments(s, sampleDocs);
    const { value } = computePercentile(s, { field: 'price', percentile: 100 });
    expect(value).toBe(200);
  });

  it('percentile p0 = min', () => {
    const s = startQueryDslSession({ target: 'meilisearch', indexId: 'x' });
    seedQueryDslDocuments(s, sampleDocs);
    const { value } = computePercentile(s, { field: 'price', percentile: 0 });
    expect(value).toBe(50);
  });

  it('state transitions through 4 events', () => {
    const s = startQueryDslSession({ target: 'meilisearch', indexId: 'x' });
    seedQueryDslDocuments(s, sampleDocs);
    evaluateBooleanTree(s, {
      kind: 'leaf',
      field: 'category',
      op: 'eq',
      value: 'shoes',
    });
    resolveNestedQuery(s, {
      path: 'variants',
      clause: { kind: 'leaf', field: 'color', op: 'eq', value: 'red' },
    });
    bucketHistogram(s, { field: 'price', interval: 100 });
    computePercentile(s, { field: 'price', percentile: 90 });
    expect(s.history.map((h) => h.neutralEvent)).toEqual([
      'query.boolean_tree_evaluated',
      'query.nested_resolved',
      'query.histogram_bucketed',
      'query.percentile_computed',
    ]);
  });

  it('translates provider events for each target', () => {
    for (const target of ['meilisearch', 'typesense', 'algolia', 'opensearch-oss'] as const) {
      const s = startQueryDslSession({ target, indexId: 'x' });
      seedQueryDslDocuments(s, sampleDocs);
      const { step } = evaluateBooleanTree(s, {
        kind: 'leaf',
        field: 'category',
        op: 'eq',
        value: 'shoes',
      });
      expect(step.providerEvent).not.toBe(step.neutralEvent);
    }
  });
});

describe('query-dsl axis — invariant guards', () => {
  it('rejects empty indexId', () => {
    expect(() => startQueryDslSession({ target: 'meilisearch', indexId: '' })).toThrow(
      /indexId must not be empty/,
    );
  });

  it('rejects non-positive interval in histogram', () => {
    const s = startQueryDslSession({ target: 'meilisearch', indexId: 'x' });
    seedQueryDslDocuments(s, sampleDocs);
    expect(() => bucketHistogram(s, { field: 'price', interval: 0 })).toThrow(
      /interval must be positive/,
    );
  });

  it('rejects percentile out of range', () => {
    const s = startQueryDslSession({ target: 'meilisearch', indexId: 'x' });
    seedQueryDslDocuments(s, sampleDocs);
    expect(() => computePercentile(s, { field: 'price', percentile: 150 })).toThrow(
      /within \[0, 100\]/,
    );
  });

  it('percentile with no numeric values throws', () => {
    const s = startQueryDslSession({ target: 'meilisearch', indexId: 'x' });
    seedQueryDslDocuments(s, [{ id: '1', fields: { category: 'x' } }]);
    expect(() => computePercentile(s, { field: 'nonexistent', percentile: 50 })).toThrow(
      /no numeric values found/,
    );
  });

  it('histogram ignores non-numeric fields', () => {
    const s = startQueryDslSession({ target: 'meilisearch', indexId: 'x' });
    seedQueryDslDocuments(s, [{ id: '1', fields: { category: 'x' } }]);
    const { buckets } = bucketHistogram(s, { field: 'category', interval: 1 });
    expect(buckets).toHaveLength(0);
  });

  it('nested query on missing path yields empty match', () => {
    const s = startQueryDslSession({ target: 'meilisearch', indexId: 'x' });
    seedQueryDslDocuments(s, sampleDocs);
    const { matched } = resolveNestedQuery(s, {
      path: 'nonexistent',
      clause: { kind: 'leaf', field: 'x', op: 'eq', value: 'y' },
    });
    expect(matched).toHaveLength(0);
  });

  it('ne excludes matching field', () => {
    const s = startQueryDslSession({ target: 'meilisearch', indexId: 'x' });
    seedQueryDslDocuments(s, sampleDocs);
    const { matched } = evaluateBooleanTree(s, {
      kind: 'leaf',
      field: 'brand',
      op: 'ne',
      value: 'nike',
    });
    expect(matched.map((d) => d.id).sort()).toEqual(['b', 'd']);
  });

  it('missing field is treated as no-match', () => {
    const s = startQueryDslSession({ target: 'meilisearch', indexId: 'x' });
    seedQueryDslDocuments(s, [{ id: '1', fields: {} }]);
    const { matched } = evaluateBooleanTree(s, {
      kind: 'leaf',
      field: 'x',
      op: 'eq',
      value: 'y',
    });
    expect(matched).toHaveLength(0);
  });
});
