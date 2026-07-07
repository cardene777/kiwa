/**
 * Geo lifecycle tests — walk the geo-axis end-to-end (start session →
 * seed docs → bounding-box → radius → polygon) and assert every op
 * appears on the neutral trace and returns the expected result shape.
 * Covers the mock adapter path so the search v0.3 geo semantics remain
 * observable.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { FacetedGeoSearchAdapter } from '../src/adapters/interface.js';
import { driveGeoLifecycle } from '../src/flows/search-flows.js';
import { FIXTURE_RESTAURANTS } from '../src/policies/query-fixtures.js';

function newMock(): FacetedGeoSearchAdapter {
  return makeMockAdapter();
}

describe('dogfood-search-faceted-geo-app — geo lifecycle', () => {
  it('T-DFSFG-GL-001 startGeoSession returns the requested backend + indexId', async () => {
    const mock = newMock();
    const result = await mock.startGeoSession({
      backend: 'algolia',
      indexId: 'idx-geo',
    });
    expect(result.backend).toBe('algolia');
    expect(result.indexId).toBe('idx-geo');
  });

  it('T-DFSFG-GL-002 startGeoSession emits geo.session_started onto the trace', async () => {
    const mock = newMock();
    await mock.startGeoSession({ backend: 'algolia', indexId: 'idx-geo' });
    const trace = mock.trace();
    expect(trace).toHaveLength(1);
    expect(trace[0]?.op).toBe('startGeoSession');
    expect(trace[0]?.neutralEvent).toBe('geo.session_started');
    expect(trace[0]?.ok).toBe(true);
  });

  it('T-DFSFG-GL-003 seedGeoDocuments records totalCount for all 5 restaurants', async () => {
    const mock = newMock();
    await mock.startGeoSession({ backend: 'algolia', indexId: 'idx-geo' });
    const result = await mock.seedGeoDocuments({
      bucket: 'algolia',
      indexId: 'idx-geo',
      documents: FIXTURE_RESTAURANTS.geoDocuments,
    });
    expect(result.seededCount).toBe(FIXTURE_RESTAURANTS.geoDocuments.length);
    expect(result.totalCount).toBe(FIXTURE_RESTAURANTS.geoDocuments.length);
  });

  it('T-DFSFG-GL-004 seedGeoDocuments emits geo.documents_seeded', async () => {
    const mock = newMock();
    await mock.startGeoSession({ backend: 'algolia', indexId: 'idx-geo' });
    await mock.seedGeoDocuments({
      bucket: 'algolia',
      indexId: 'idx-geo',
      documents: FIXTURE_RESTAURANTS.geoDocuments,
    });
    const trace = mock.trace();
    expect(trace.some((e) => e.neutralEvent === 'geo.documents_seeded')).toBe(true);
  });

  it('T-DFSFG-GL-005 queryBoundingBox returns all 5 restaurants for the broad Tokyo bbox', async () => {
    const mock = newMock();
    await mock.startGeoSession({ backend: 'algolia', indexId: 'idx-geo' });
    await mock.seedGeoDocuments({
      bucket: 'algolia',
      indexId: 'idx-geo',
      documents: FIXTURE_RESTAURANTS.geoDocuments,
    });
    const result = await mock.queryBoundingBox({
      bucket: 'algolia',
      indexId: 'idx-geo',
      bbox: {
        swLat: 35.5,
        swLng: 139.5,
        neLat: 35.8,
        neLng: 139.85,
      },
    });
    expect(result.hitCount).toBe(5);
    const ids = result.hits.map((h) => h.id).sort();
    expect(ids).toContain('rest-shibuya-ramen');
    expect(ids).toContain('rest-akihabara-curry');
  });

  it('T-DFSFG-GL-006 queryBoundingBox excludes points outside the Tokyo bbox', async () => {
    const mock = newMock();
    await mock.startGeoSession({ backend: 'algolia', indexId: 'idx-geo' });
    await mock.seedGeoDocuments({
      bucket: 'algolia',
      indexId: 'idx-geo',
      documents: [
        { id: 'inside', lat: 35.65, lng: 139.7 },
        { id: 'outside-south', lat: 35.3, lng: 139.7 },
        { id: 'outside-east', lat: 35.65, lng: 139.9 },
      ],
    });
    const result = await mock.queryBoundingBox({
      bucket: 'algolia',
      indexId: 'idx-geo',
      bbox: { swLat: 35.5, swLng: 139.5, neLat: 35.8, neLng: 139.85 },
    });
    expect(result.hitCount).toBe(1);
    expect(result.hits[0]?.id).toBe('inside');
  });

  it('T-DFSFG-GL-007 queryBoundingBox throws for inverted sw/ne corners', async () => {
    const mock = newMock();
    await mock.startGeoSession({ backend: 'algolia', indexId: 'idx-geo' });
    await mock.seedGeoDocuments({
      bucket: 'algolia',
      indexId: 'idx-geo',
      documents: FIXTURE_RESTAURANTS.geoDocuments,
    });
    await expect(
      mock.queryBoundingBox({
        bucket: 'algolia',
        indexId: 'idx-geo',
        // Inverted — sw is north of ne.
        bbox: { swLat: 35.8, swLng: 139.5, neLat: 35.5, neLng: 139.85 },
      }),
    ).rejects.toThrow(/south-west of ne/);
  });

  it('T-DFSFG-GL-008 queryRadius (1km from Shibuya) hits both Shibuya restaurants', async () => {
    const mock = newMock();
    await mock.startGeoSession({ backend: 'algolia', indexId: 'idx-geo' });
    await mock.seedGeoDocuments({
      bucket: 'algolia',
      indexId: 'idx-geo',
      documents: FIXTURE_RESTAURANTS.geoDocuments,
    });
    const result = await mock.queryRadius({
      bucket: 'algolia',
      indexId: 'idx-geo',
      centerLat: 35.6595,
      centerLng: 139.7005,
      radiusMeters: 1000,
    });
    expect(result.hitCount).toBe(2);
    const ids = result.hits.map((h) => h.id);
    expect(ids).toContain('rest-shibuya-ramen');
    expect(ids).toContain('rest-shibuya-sushi');
  });

  it('T-DFSFG-GL-009 queryRadius orders hits by ascending distance', async () => {
    const mock = newMock();
    await mock.startGeoSession({ backend: 'algolia', indexId: 'idx-geo' });
    await mock.seedGeoDocuments({
      bucket: 'algolia',
      indexId: 'idx-geo',
      documents: FIXTURE_RESTAURANTS.geoDocuments,
    });
    const result = await mock.queryRadius({
      bucket: 'algolia',
      indexId: 'idx-geo',
      centerLat: 35.6595,
      centerLng: 139.7005,
      radiusMeters: 3000,
    });
    for (let i = 1; i < result.hits.length; i++) {
      const prev = result.hits[i - 1]!.distanceMeters;
      const cur = result.hits[i]!.distanceMeters;
      expect(cur).toBeGreaterThanOrEqual(prev);
    }
  });

  it('T-DFSFG-GL-010 queryRadius throws for non-positive radius', async () => {
    const mock = newMock();
    await mock.startGeoSession({ backend: 'algolia', indexId: 'idx-geo' });
    await mock.seedGeoDocuments({
      bucket: 'algolia',
      indexId: 'idx-geo',
      documents: FIXTURE_RESTAURANTS.geoDocuments,
    });
    await expect(
      mock.queryRadius({
        bucket: 'algolia',
        indexId: 'idx-geo',
        centerLat: 35.6595,
        centerLng: 139.7005,
        radiusMeters: 0,
      }),
    ).rejects.toThrow(/positive/);
  });

  it('T-DFSFG-GL-011 queryPolygon hits Shinjuku only via tight polygon', async () => {
    const mock = newMock();
    await mock.startGeoSession({ backend: 'algolia', indexId: 'idx-geo' });
    await mock.seedGeoDocuments({
      bucket: 'algolia',
      indexId: 'idx-geo',
      documents: FIXTURE_RESTAURANTS.geoDocuments,
    });
    const result = await mock.queryPolygon({
      bucket: 'algolia',
      indexId: 'idx-geo',
      polygon: {
        vertices: [
          { lat: 35.685, lng: 139.6955 },
          { lat: 35.685, lng: 139.706 },
          { lat: 35.694, lng: 139.706 },
          { lat: 35.694, lng: 139.6955 },
        ],
      },
    });
    expect(result.hitCount).toBe(1);
    expect(result.hits[0]?.id).toBe('rest-shinjuku-izakaya');
  });

  it('T-DFSFG-GL-012 queryPolygon throws for polygon with fewer than 3 vertices', async () => {
    const mock = newMock();
    await mock.startGeoSession({ backend: 'algolia', indexId: 'idx-geo' });
    await mock.seedGeoDocuments({
      bucket: 'algolia',
      indexId: 'idx-geo',
      documents: FIXTURE_RESTAURANTS.geoDocuments,
    });
    await expect(
      mock.queryPolygon({
        bucket: 'algolia',
        indexId: 'idx-geo',
        polygon: { vertices: [{ lat: 35.68, lng: 139.7 }] },
      }),
    ).rejects.toThrow(/3 vertices/);
  });

  it('T-DFSFG-GL-013 seedGeoDocuments on unstarted bucket throws', async () => {
    const mock = newMock();
    await expect(
      mock.seedGeoDocuments({
        bucket: 'algolia',
        indexId: 'nope',
        documents: [{ id: 'x', lat: 35, lng: 139 }],
      }),
    ).rejects.toThrow(/has not been started/);
  });

  it('T-DFSFG-GL-014 seedGeoDocuments rejects invalid lat/lng', async () => {
    const mock = newMock();
    await mock.startGeoSession({ backend: 'algolia', indexId: 'idx-geo' });
    await expect(
      mock.seedGeoDocuments({
        bucket: 'algolia',
        indexId: 'idx-geo',
        documents: [{ id: 'bad', lat: 200, lng: 400 }],
      }),
    ).rejects.toThrow(/invalid/);
  });

  it('T-DFSFG-GL-015 driveGeoLifecycle emits every geo op onto the trace', async () => {
    const mock = newMock();
    await driveGeoLifecycle(mock, {
      backend: 'algolia',
      indexId: 'lifecycle-geo',
      fixture: FIXTURE_RESTAURANTS,
    });
    const ops = new Set(mock.trace().map((t) => t.op));
    expect(ops.has('startGeoSession')).toBe(true);
    expect(ops.has('seedGeoDocuments')).toBe(true);
    expect(ops.has('queryBoundingBox')).toBe(true);
    expect(ops.has('queryRadius')).toBe(true);
    expect(ops.has('queryPolygon')).toBe(true);
  });
});
