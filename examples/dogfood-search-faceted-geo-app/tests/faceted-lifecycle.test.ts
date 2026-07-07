/**
 * Faceted lifecycle tests — walk the faceted-axis end-to-end (start
 * session → seed docs → nested compute → hierarchy traverse → distinct
 * count → refined filter) and assert every op appears on the neutral
 * trace and returns the expected result shape. Covers the mock adapter
 * path so the search v0.3 faceted-advanced semantics remain observable.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { FacetedGeoSearchAdapter } from '../src/adapters/interface.js';
import { driveFacetedLifecycle } from '../src/flows/search-flows.js';
import { FIXTURE_CATEGORIES } from '../src/policies/query-fixtures.js';

function newMock(): FacetedGeoSearchAdapter {
  return makeMockAdapter();
}

describe('dogfood-search-faceted-geo-app — faceted lifecycle', () => {
  it('T-DFSFG-FL-001 startFacetedSession returns the requested backend + indexId', async () => {
    const mock = newMock();
    const result = await mock.startFacetedSession({
      backend: 'algolia',
      indexId: 'idx-cat',
    });
    expect(result.backend).toBe('algolia');
    expect(result.indexId).toBe('idx-cat');
  });

  it('T-DFSFG-FL-002 startFacetedSession emits facet.session_started onto the trace', async () => {
    const mock = newMock();
    await mock.startFacetedSession({ backend: 'algolia', indexId: 'idx-cat' });
    const trace = mock.trace();
    expect(trace).toHaveLength(1);
    expect(trace[0]?.op).toBe('startFacetedSession');
    expect(trace[0]?.neutralEvent).toBe('facet.session_started');
    expect(trace[0]?.ok).toBe(true);
  });

  it('T-DFSFG-FL-003 startFacetedSession providerEvent is prefixed by algolia target', async () => {
    const mock = newMock();
    await mock.startFacetedSession({ backend: 'algolia', indexId: 'idx-cat' });
    const trace = mock.trace();
    expect(trace[0]?.providerEvent).toBe('algolia.facet.session_started');
  });

  it('T-DFSFG-FL-004 seedFacetedDocuments records seededCount + totalCount', async () => {
    const mock = newMock();
    await mock.startFacetedSession({ backend: 'algolia', indexId: 'idx-cat' });
    const result = await mock.seedFacetedDocuments({
      bucket: 'algolia',
      indexId: 'idx-cat',
      documents: FIXTURE_CATEGORIES.facetedDocuments,
    });
    expect(result.seededCount).toBe(FIXTURE_CATEGORIES.facetedDocuments.length);
    expect(result.totalCount).toBe(FIXTURE_CATEGORIES.facetedDocuments.length);
  });

  it('T-DFSFG-FL-005 seedFacetedDocuments emits facet.documents_seeded', async () => {
    const mock = newMock();
    await mock.startFacetedSession({ backend: 'algolia', indexId: 'idx-cat' });
    await mock.seedFacetedDocuments({
      bucket: 'algolia',
      indexId: 'idx-cat',
      documents: FIXTURE_CATEGORIES.facetedDocuments,
    });
    const trace = mock.trace();
    expect(trace.some((e) => e.neutralEvent === 'facet.documents_seeded')).toBe(true);
  });

  it('T-DFSFG-FL-006 computeNestedFacets builds a 3-outer x 2-inner tree for categories fixture', async () => {
    const mock = newMock();
    await mock.startFacetedSession({ backend: 'algolia', indexId: 'idx-cat' });
    await mock.seedFacetedDocuments({
      bucket: 'algolia',
      indexId: 'idx-cat',
      documents: FIXTURE_CATEGORIES.facetedDocuments,
    });
    const result = await mock.computeNestedFacets({
      bucket: 'algolia',
      indexId: 'idx-cat',
      outerField: 'category',
      innerField: 'subcategory',
    });
    // categories = electronics / apparel / home = 3 outer
    expect(result.outerBucketCount).toBe(3);
    const outerValues = result.tree.map((n) => n.value).sort();
    expect(outerValues).toEqual(['apparel', 'electronics', 'home']);
    // electronics has audio + laptop = 2 children
    const electronics = result.tree.find((n) => n.value === 'electronics');
    expect(electronics?.children?.length).toBe(2);
  });

  it('T-DFSFG-FL-007 computeNestedFacets emits facet.nested_computed', async () => {
    const mock = newMock();
    await mock.startFacetedSession({ backend: 'algolia', indexId: 'idx-cat' });
    await mock.seedFacetedDocuments({
      bucket: 'algolia',
      indexId: 'idx-cat',
      documents: FIXTURE_CATEGORIES.facetedDocuments,
    });
    await mock.computeNestedFacets({
      bucket: 'algolia',
      indexId: 'idx-cat',
      outerField: 'category',
      innerField: 'subcategory',
    });
    const trace = mock.trace();
    expect(trace.some((e) => e.neutralEvent === 'facet.nested_computed')).toBe(true);
  });

  it('T-DFSFG-FL-008 traverseHierarchy counts every path segment across dept_path', async () => {
    const mock = newMock();
    await mock.startFacetedSession({ backend: 'algolia', indexId: 'idx-cat' });
    await mock.seedFacetedDocuments({
      bucket: 'algolia',
      indexId: 'idx-cat',
      documents: FIXTURE_CATEGORIES.facetedDocuments,
    });
    const result = await mock.traverseHierarchy({
      bucket: 'algolia',
      indexId: 'idx-cat',
      field: 'dept_path',
      separator: '>',
    });
    // 3 outer categories = 3 top-level nodes.
    expect(result.levels['electronics']).toBe(3);
    expect(result.levels['apparel']).toBe(2);
    expect(result.levels['home']).toBe(1);
    // Deeper node — trimmed segments rejoined with the raw `>` separator.
    expect(result.levels['electronics>audio']).toBe(2);
  });

  it('T-DFSFG-FL-009 traverseHierarchy uses `>` as default separator', async () => {
    const mock = newMock();
    await mock.startFacetedSession({ backend: 'algolia', indexId: 'idx-cat' });
    await mock.seedFacetedDocuments({
      bucket: 'algolia',
      indexId: 'idx-cat',
      documents: FIXTURE_CATEGORIES.facetedDocuments,
    });
    const result = await mock.traverseHierarchy({
      bucket: 'algolia',
      indexId: 'idx-cat',
      field: 'dept_path',
    });
    expect(result.separator).toBe('>');
    expect(result.levelCount).toBeGreaterThan(0);
  });

  it('T-DFSFG-FL-010 countDistinct returns unique brand count', async () => {
    const mock = newMock();
    await mock.startFacetedSession({ backend: 'algolia', indexId: 'idx-cat' });
    await mock.seedFacetedDocuments({
      bucket: 'algolia',
      indexId: 'idx-cat',
      documents: FIXTURE_CATEGORIES.facetedDocuments,
    });
    const result = await mock.countDistinct({
      bucket: 'algolia',
      indexId: 'idx-cat',
      field: 'brand',
    });
    // sony / bose / apple / nike / adidas / generic = 6 distinct brands
    expect(result.distinct).toBe(6);
    expect(result.documentCount).toBe(6);
  });

  it('T-DFSFG-FL-011 countDistinct treats color as multi-valued', async () => {
    const mock = newMock();
    await mock.startFacetedSession({ backend: 'algolia', indexId: 'idx-cat' });
    await mock.seedFacetedDocuments({
      bucket: 'algolia',
      indexId: 'idx-cat',
      documents: FIXTURE_CATEGORIES.facetedDocuments,
    });
    const result = await mock.countDistinct({
      bucket: 'algolia',
      indexId: 'idx-cat',
      field: 'color',
    });
    // black / white / silver = 3 distinct colors
    expect(result.distinct).toBe(3);
  });

  it('T-DFSFG-FL-012 applyRefinedFilter narrows to black-only 3 docs', async () => {
    const mock = newMock();
    await mock.startFacetedSession({ backend: 'algolia', indexId: 'idx-cat' });
    await mock.seedFacetedDocuments({
      bucket: 'algolia',
      indexId: 'idx-cat',
      documents: FIXTURE_CATEGORIES.facetedDocuments,
    });
    const result = await mock.applyRefinedFilter({
      bucket: 'algolia',
      indexId: 'idx-cat',
      field: 'color',
      value: 'black',
    });
    // headphones-sony / tshirt-nike / mug-generic = 3 black docs
    expect(result.remainingCount).toBe(3);
    expect(result.originalCount).toBe(6);
  });

  it('T-DFSFG-FL-013 applyRefinedFilter with unmatched value returns 0 remaining', async () => {
    const mock = newMock();
    await mock.startFacetedSession({ backend: 'algolia', indexId: 'idx-cat' });
    await mock.seedFacetedDocuments({
      bucket: 'algolia',
      indexId: 'idx-cat',
      documents: FIXTURE_CATEGORIES.facetedDocuments,
    });
    const result = await mock.applyRefinedFilter({
      bucket: 'algolia',
      indexId: 'idx-cat',
      field: 'color',
      value: 'nonexistent',
    });
    expect(result.remainingCount).toBe(0);
  });

  it('T-DFSFG-FL-014 seedFacetedDocuments on unstarted bucket throws', async () => {
    const mock = newMock();
    await expect(
      mock.seedFacetedDocuments({
        bucket: 'algolia',
        indexId: 'nope',
        documents: [],
      }),
    ).rejects.toThrow(/has not been started/);
  });

  it('T-DFSFG-FL-015 driveFacetedLifecycle emits every facet op onto the trace', async () => {
    const mock = newMock();
    await driveFacetedLifecycle(mock, {
      backend: 'algolia',
      indexId: 'lifecycle-idx',
      fixture: FIXTURE_CATEGORIES,
    });
    const ops = new Set(mock.trace().map((t) => t.op));
    expect(ops.has('startFacetedSession')).toBe(true);
    expect(ops.has('seedFacetedDocuments')).toBe(true);
    expect(ops.has('computeNestedFacets')).toBe(true);
    expect(ops.has('traverseHierarchy')).toBe(true);
    expect(ops.has('countDistinct')).toBe(true);
    expect(ops.has('applyRefinedFilter')).toBe(true);
  });

  it('T-DFSFG-FL-016 reset drops all state', async () => {
    const mock = newMock();
    await mock.startFacetedSession({ backend: 'algolia', indexId: 'idx-cat' });
    await mock.reset();
    expect(mock.trace()).toHaveLength(0);
    // After reset, seedFacetedDocuments must throw again (bucket wiped).
    await expect(
      mock.seedFacetedDocuments({
        bucket: 'algolia',
        indexId: 'idx-cat',
        documents: [],
      }),
    ).rejects.toThrow(/has not been started/);
  });
});
