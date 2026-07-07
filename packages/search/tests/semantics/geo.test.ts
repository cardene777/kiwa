import { describe, expect, it } from 'vitest';
import {
  filterBoundingBox,
  filterPolygon,
  filterRadius,
  resolveIsochrone,
  seedGeoDocuments,
  startGeoSession,
} from '../../src/semantics/index.js';

// Rough coordinates (Tokyo area)
const sampleDocs = [
  { id: 'tokyo-station', lat: 35.681, lng: 139.767 },
  { id: 'shinjuku', lat: 35.69, lng: 139.7 },
  { id: 'yokohama', lat: 35.44, lng: 139.64 },
  { id: 'sapporo', lat: 43.06, lng: 141.35 },
];

describe('geo axis — happy path', () => {
  it('bounding box filter selects tokyo area docs', () => {
    const s = startGeoSession({ target: 'meilisearch', indexId: 'places' });
    seedGeoDocuments(s, sampleDocs);
    const { hits } = filterBoundingBox(s, {
      swLat: 35.4,
      swLng: 139.5,
      neLat: 35.75,
      neLng: 139.85,
    });
    const ids = hits.map((h) => h.id);
    expect(ids).toContain('tokyo-station');
    expect(ids).toContain('shinjuku');
    expect(ids).toContain('yokohama');
    expect(ids).not.toContain('sapporo');
  });

  it('radius filter returns hits within radius and sorted by distance', () => {
    const s = startGeoSession({ target: 'typesense', indexId: 'places' });
    seedGeoDocuments(s, sampleDocs);
    const { hits } = filterRadius(s, {
      centerLat: 35.681,
      centerLng: 139.767,
      radiusMeters: 10_000,
    });
    expect(hits[0]?.id).toBe('tokyo-station');
    expect(hits[0]?.distanceMeters).toBeLessThan(1);
    expect(hits.map((h) => h.id)).not.toContain('sapporo');
  });

  it('polygon filter uses ray casting', () => {
    const s = startGeoSession({ target: 'algolia', indexId: 'places' });
    seedGeoDocuments(s, sampleDocs);
    const { hits } = filterPolygon(s, {
      vertices: [
        { lat: 35.4, lng: 139.5 },
        { lat: 35.4, lng: 139.85 },
        { lat: 35.75, lng: 139.85 },
        { lat: 35.75, lng: 139.5 },
      ],
    });
    const ids = hits.map((h) => h.id);
    expect(ids).toContain('tokyo-station');
    expect(ids).toContain('shinjuku');
    expect(ids).not.toContain('sapporo');
  });

  it('isochrone converts travel time to reachable area', () => {
    const s = startGeoSession({ target: 'opensearch-oss', indexId: 'places' });
    seedGeoDocuments(s, sampleDocs);
    const { hits } = resolveIsochrone(s, {
      centerLat: 35.681,
      centerLng: 139.767,
      travelTimeMinutes: 30,
      avgSpeedKmh: 30,
    });
    expect(hits.map((h) => h.id)).toContain('tokyo-station');
    expect(hits.map((h) => h.id)).toContain('shinjuku');
  });

  it('translates provider events for each target', () => {
    for (const target of ['meilisearch', 'typesense', 'algolia', 'opensearch-oss'] as const) {
      const s = startGeoSession({ target, indexId: 'x' });
      seedGeoDocuments(s, sampleDocs);
      const { step } = filterBoundingBox(s, {
        swLat: 35,
        swLng: 139,
        neLat: 36,
        neLng: 140,
      });
      expect(step.providerEvent).not.toBe(step.neutralEvent);
    }
  });

  it('state transitions through 4 events', () => {
    const s = startGeoSession({ target: 'meilisearch', indexId: 'x' });
    seedGeoDocuments(s, sampleDocs);
    filterBoundingBox(s, { swLat: 35, swLng: 139, neLat: 36, neLng: 140 });
    filterRadius(s, { centerLat: 35.68, centerLng: 139.76, radiusMeters: 10000 });
    filterPolygon(s, {
      vertices: [
        { lat: 35, lng: 139 },
        { lat: 35, lng: 140 },
        { lat: 36, lng: 140 },
      ],
    });
    resolveIsochrone(s, { centerLat: 35.68, centerLng: 139.76, travelTimeMinutes: 60 });
    expect(s.history.map((h) => h.neutralEvent)).toEqual([
      'geo.bounding_box_filtered',
      'geo.radius_filtered',
      'geo.polygon_filtered',
      'geo.isochrone_resolved',
    ]);
  });
});

describe('geo axis — invariant guards', () => {
  it('rejects invalid lat/lng in seed', () => {
    const s = startGeoSession({ target: 'meilisearch', indexId: 'x' });
    expect(() => seedGeoDocuments(s, [{ id: 'x', lat: 91, lng: 0 }])).toThrow(/invalid lat/);
    expect(() => seedGeoDocuments(s, [{ id: 'x', lat: 0, lng: 181 }])).toThrow(/invalid lat/);
  });

  it('rejects sw >= ne in bbox', () => {
    const s = startGeoSession({ target: 'meilisearch', indexId: 'x' });
    seedGeoDocuments(s, sampleDocs);
    expect(() =>
      filterBoundingBox(s, { swLat: 36, swLng: 140, neLat: 35, neLng: 139 }),
    ).toThrow(/south-west/);
  });

  it('rejects invalid center in radius filter', () => {
    const s = startGeoSession({ target: 'meilisearch', indexId: 'x' });
    expect(() => filterRadius(s, { centerLat: 100, centerLng: 0, radiusMeters: 1000 })).toThrow(
      /invalid center/,
    );
  });

  it('rejects non-positive radius', () => {
    const s = startGeoSession({ target: 'meilisearch', indexId: 'x' });
    expect(() =>
      filterRadius(s, { centerLat: 35, centerLng: 139, radiusMeters: 0 }),
    ).toThrow(/radiusMeters must be positive/);
  });

  it('rejects polygon with < 3 vertices', () => {
    const s = startGeoSession({ target: 'meilisearch', indexId: 'x' });
    expect(() =>
      filterPolygon(s, {
        vertices: [
          { lat: 35, lng: 139 },
          { lat: 36, lng: 140 },
        ],
      }),
    ).toThrow(/at least 3 vertices/);
  });

  it('rejects non-positive travel time in isochrone', () => {
    const s = startGeoSession({ target: 'meilisearch', indexId: 'x' });
    expect(() =>
      resolveIsochrone(s, { centerLat: 35, centerLng: 139, travelTimeMinutes: 0 }),
    ).toThrow(/travelTimeMinutes must be positive/);
  });

  it('empty session gives 0 hits from bbox', () => {
    const s = startGeoSession({ target: 'meilisearch', indexId: 'x' });
    const { hits } = filterBoundingBox(s, { swLat: 35, swLng: 139, neLat: 36, neLng: 140 });
    expect(hits).toHaveLength(0);
  });
});
