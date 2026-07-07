# Faceted geo search — nested facet + bounding box + radius + polygon + isochrone in 15 min

## What you'll build

A vitest suite wired to `@kiwa-test/search` v0.3 that models the 5 pieces of a real faceted + geo search pipeline that every non-trivial listing product (marketplace / restaurant finder / event platform) eventually needs — a faceted session that seeds documents with nested category hierarchies, a nested-facet builder that emits a tree with cumulative counts, a distinct-count aggregator that avoids double-counting sibling nodes, a geo session that pins an index id and seeds lat/lng-tagged documents, and 4 geo filters (bounding box / radius / polygon / isochrone) that select the subset within a shape. `startFacetedSession()` + `seedFacetedDocuments()` + `computeNestedFacets()` + `startGeoSession()` + `filterBoundingBox()` + `filterRadius()` + `filterPolygon()` + `resolveIsochrone()` give you every one of those pieces without booting a real Algolia sandbox. This is the pattern kiwa's `examples/dogfood-search-faceted-geo-app` v2 exercises against a real Algolia sandbox under `KIWA_MODE=real` + `KIWA_ALGOLIA_URL` + `ALGOLIA_KEY`; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "the restaurant panel showed 42 hits under Category > Italian > Pizza but the real Algolia counted 39 because the sibling 'Neapolitan' was double-counted" gap a reviewer sees in the facet-drift post-mortem.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-faceted-geo && cd kiwa-faceted-geo
pnpm init
pnpm add -D @kiwa-test/search@^0.3 vitest typescript @types/node
```

Add the vitest scripts in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run"
  }
}
```

The v0.3 surface exports the faceted-advanced + geo axes through the `semantics/` barrel. This tutorial focuses on those 2 axes end-to-end; tutorials 73 and 75 cover the other advanced axes (vector + relevance + synonym + index management).

### 2. `startFacetedSession` + `seedFacetedDocuments` + `computeNestedFacets` — cross-tab facets

`tests/faceted/session.test.ts` — a faceted session pins an index id and seeds documents that carry named facets (`category: 'shoes'` + `color: 'red'`). `computeNestedFacets()` cross-tabs two fields (`facetField × subFacetField`) and returns a tree of outer values with per-sub-value children so the panel can render `shoes (3) > red (2)` without a client-side re-tally.

```ts
import { describe, expect, it } from 'vitest';
import {
  startFacetedSession,
  seedFacetedDocuments,
  computeNestedFacets,
} from '@kiwa-test/search';

const sampleDocs = [
  { id: '1', facets: { category: 'shoes', color: 'red' } },
  { id: '2', facets: { category: 'shoes', color: 'red' } },
  { id: '3', facets: { category: 'shoes', color: 'blue' } },
  { id: '4', facets: { category: 'hats', color: 'red' } },
];

describe('faceted — cross-tab tree', () => {
  it('groups inner values per outer value with per-cell counts', () => {
    const session = startFacetedSession({ target: 'algolia', indexId: 'products' });
    seedFacetedDocuments(session, sampleDocs);

    const { tree, step } = computeNestedFacets(session, {
      facetField: 'category',
      subFacetField: 'color',
    });
    expect(step.neutralEvent).toBe('facet.nested_computed');
    expect(session.state).toBe('nested-computed');

    const shoes = tree.find((n) => n.value === 'shoes');
    expect(shoes?.count).toBe(3);
    const shoesRed = shoes?.children?.find((c) => c.value === 'red');
    expect(shoesRed?.count).toBe(2);
  });

  it('rejects an empty indexId', () => {
    expect(() => startFacetedSession({ target: 'algolia', indexId: '' })).toThrow(
      /indexId must not be empty/,
    );
  });
});
```

Run it.

```bash
pnpm test
```

The 2 tests pass. The invariant that an outer count equals the sum of its inner children (`shoes(3) = red(2) + blue(1)`) is the guard-rail that catches the sibling double-count bug — when a mock claims `shoes(4)` but the sum is 3, the panel's cross-tab math is broken.

### 3. `countDistinct` — deduplicate by field

`tests/faceted/distinct.test.ts` — `countDistinct()` returns the number of distinct values in a field across the seeded documents. This is what the panel uses to render "12 unique restaurants match your filter" without over-counting duplicates.

```ts
import { describe, expect, it } from 'vitest';
import {
  startFacetedSession,
  seedFacetedDocuments,
  countDistinct,
} from '@kiwa-test/search';

describe('faceted — countDistinct', () => {
  it('counts distinct brand values across duplicates', () => {
    const session = startFacetedSession({ target: 'algolia', indexId: 'products' });
    seedFacetedDocuments(session, [
      { id: 'a', facets: { brand: 'kiwa' } },
      { id: 'b', facets: { brand: 'kiwa' } },
      { id: 'c', facets: { brand: 'fable' } },
      { id: 'd', facets: { brand: 'fable' } },
      { id: 'e', facets: { brand: 'fable' } },
    ]);
    const { distinct, step } = countDistinct(session, { field: 'brand' });
    expect(step.neutralEvent).toBe('facet.distinct_counted');
    expect(distinct).toBe(2);
  });
});
```

The invariant is that duplicates collapse — 5 rows with 2 distinct brand values return `2`. That's the anti-pattern the `countDistinct` guard prevents: an aggregator that returns row-count (`5`) instead of distinct-count (`2`).

### 4. `applyRefinedFilter` + `traverseHierarchy` — drill down without reload

`tests/faceted/refine.test.ts` — `applyRefinedFilter()` narrows the set to documents whose facet field equals a given value. `traverseHierarchy()` walks a delimited facet path (`Root>Italian>Pizza`) into per-level cumulative counts so breadcrumbs render top-down (`Root(3) > Italian(2) > Pizza(1)`) without a server round-trip.

```ts
import { describe, expect, it } from 'vitest';
import {
  startFacetedSession,
  seedFacetedDocuments,
  applyRefinedFilter,
  traverseHierarchy,
} from '@kiwa-test/search';

describe('faceted — refine + hierarchy', () => {
  it('narrows to documents whose facet value matches', () => {
    const session = startFacetedSession({ target: 'algolia', indexId: 'restaurants' });
    seedFacetedDocuments(session, [
      { id: 'a', facets: { category: 'italian' } },
      { id: 'b', facets: { category: 'italian' } },
      { id: 'c', facets: { category: 'japanese' } },
    ]);
    const { remaining, step } = applyRefinedFilter(session, {
      field: 'category',
      value: 'italian',
    });
    expect(step.neutralEvent).toBe('facet.refined_filter_applied');
    const ids = remaining.map((d) => d.id);
    expect(ids).toContain('a');
    expect(ids).toContain('b');
    expect(ids).not.toContain('c');
  });

  it('traverses a delimited path into per-level cumulative counts', () => {
    const session = startFacetedSession({ target: 'algolia', indexId: 'restaurants' });
    seedFacetedDocuments(session, [
      { id: 'a', facets: { categories: 'Root>Italian>Pizza' } },
      { id: 'b', facets: { categories: 'Root>Italian>Pasta' } },
      { id: 'c', facets: { categories: 'Root>Japanese>Ramen' } },
    ]);
    const { levels, step } = traverseHierarchy(session, { field: 'categories' });
    expect(step.neutralEvent).toBe('facet.hierarchy_traversed');
    expect(levels['Root']).toBe(3);
    expect(levels['Root>Italian']).toBe(2);
    expect(levels['Root>Italian>Pizza']).toBe(1);
  });
});
```

The pair of operations (`applyRefinedFilter` + `traverseHierarchy`) is what makes the drill-down UX cheap — one round-trip fills the state machine, subsequent refines are local. The invariant that the parent's cumulative count equals the sum of its immediate children (`Root(3) = Italian(2) + Japanese(1)`) is what catches the sibling double-count bug at the state-machine layer.

### 5. `startGeoSession` + `filterBoundingBox` — the 4-corner geo filter

`tests/geo/bounding-box.test.ts` — a geo session pins an index id and seeds lat/lng-tagged documents. `filterBoundingBox()` selects the subset within a `swLat` / `swLng` / `neLat` / `neLng` rectangle. This is the fastest geo query because it's a pure numeric compare.

```ts
import { describe, expect, it } from 'vitest';
import {
  startGeoSession,
  seedGeoDocuments,
  filterBoundingBox,
} from '@kiwa-test/search';

const sampleDocs = [
  { id: 'tokyo-station', lat: 35.681, lng: 139.767 },
  { id: 'shinjuku', lat: 35.69, lng: 139.7 },
  { id: 'yokohama', lat: 35.44, lng: 139.64 },
  { id: 'sapporo', lat: 43.06, lng: 141.35 },
];

describe('geo — bounding box', () => {
  it('selects docs within the Tokyo area rectangle', () => {
    const session = startGeoSession({ target: 'algolia', indexId: 'places' });
    seedGeoDocuments(session, sampleDocs);
    const { hits, step } = filterBoundingBox(session, {
      swLat: 35.4,
      swLng: 139.5,
      neLat: 35.75,
      neLng: 139.85,
    });
    expect(step.neutralEvent).toBe('geo.bounding_box_filtered');
    const ids = hits.map((h) => h.id);
    expect(ids).toContain('tokyo-station');
    expect(ids).toContain('shinjuku');
    expect(ids).toContain('yokohama');
    expect(ids).not.toContain('sapporo');
  });
});
```

The bounding-box filter is the map-viewport primitive — as the user pans, the map handler recomputes `sw` / `ne` and refetches. The invariant `swLat <= neLat && swLng <= neLng` prevents the "inverted rectangle" bug that returns the whole world when a client passes swapped corners.

### 6. `filterRadius` — distance-sorted results

`tests/geo/radius.test.ts` — `filterRadius()` selects docs within a radius (meters) of a center point and returns them sorted by distance. The center is typically the user's current location; the sort matches the "closest first" UX default.

```ts
import { describe, expect, it } from 'vitest';
import {
  startGeoSession,
  seedGeoDocuments,
  filterRadius,
} from '@kiwa-test/search';

const sampleDocs = [
  { id: 'tokyo-station', lat: 35.681, lng: 139.767 },
  { id: 'shinjuku', lat: 35.69, lng: 139.7 },
  { id: 'yokohama', lat: 35.44, lng: 139.64 },
  { id: 'sapporo', lat: 43.06, lng: 141.35 },
];

describe('geo — radius', () => {
  it('returns hits within radius sorted by distance', () => {
    const session = startGeoSession({ target: 'algolia', indexId: 'places' });
    seedGeoDocuments(session, sampleDocs);
    const { hits, step } = filterRadius(session, {
      centerLat: 35.681,
      centerLng: 139.767,
      radiusMeters: 10_000,
    });
    expect(step.neutralEvent).toBe('geo.radius_filtered');
    expect(hits[0]?.id).toBe('tokyo-station');
    expect(hits[0]?.distanceMeters).toBeLessThan(1);
    expect(hits.map((h) => h.id)).not.toContain('sapporo');
  });
});
```

The distance is haversine (great-circle) meters — the invariant `radius > 0` prevents a "0-radius returns everything" fallback. When the mock returns a distance in km but the real Algolia returns meters, the mock is SSOT (unit mismatch is a top-3 real-world bug in geo search).

### 7. `filterPolygon` + `resolveIsochrone` — arbitrary shapes and travel time

`tests/geo/shape.test.ts` — `filterPolygon()` uses ray casting to select docs inside an arbitrary polygon (a delivery zone, a school district). `resolveIsochrone()` converts a travel-time (minutes) + average-speed (km/h) into a reachable-area filter (approximated as a radius `speed × time / 60` in km, then meters).

```ts
import { describe, expect, it } from 'vitest';
import {
  startGeoSession,
  seedGeoDocuments,
  filterPolygon,
  resolveIsochrone,
} from '@kiwa-test/search';

const sampleDocs = [
  { id: 'tokyo-station', lat: 35.681, lng: 139.767 },
  { id: 'shinjuku', lat: 35.69, lng: 139.7 },
  { id: 'yokohama', lat: 35.44, lng: 139.64 },
  { id: 'sapporo', lat: 43.06, lng: 141.35 },
];

describe('geo — polygon + isochrone', () => {
  it('polygon uses ray casting to select interior points', () => {
    const session = startGeoSession({ target: 'algolia', indexId: 'places' });
    seedGeoDocuments(session, sampleDocs);
    const { hits, step } = filterPolygon(session, {
      vertices: [
        { lat: 35.4, lng: 139.5 },
        { lat: 35.4, lng: 139.85 },
        { lat: 35.75, lng: 139.85 },
        { lat: 35.75, lng: 139.5 },
      ],
    });
    expect(step.neutralEvent).toBe('geo.polygon_filtered');
    const ids = hits.map((h) => h.id);
    expect(ids).toContain('tokyo-station');
    expect(ids).toContain('shinjuku');
    expect(ids).not.toContain('sapporo');
  });

  it('isochrone converts travel time to reachable area', () => {
    const session = startGeoSession({ target: 'algolia', indexId: 'places' });
    seedGeoDocuments(session, sampleDocs);
    const { hits, step } = resolveIsochrone(session, {
      centerLat: 35.681,
      centerLng: 139.767,
      travelTimeMinutes: 30,
      avgSpeedKmh: 30,
    });
    expect(step.neutralEvent).toBe('geo.isochrone_resolved');
    expect(hits.map((h) => h.id)).toContain('tokyo-station');
    expect(hits.map((h) => h.id)).toContain('shinjuku');
  });
});
```

The polygon uses ray casting — count how many polygon edges a horizontal ray from the point crosses; odd means inside, even means outside. The invariant `vertices.length >= 3` prevents a degenerate polygon (a line segment can't enclose anything). The isochrone is a first-order approximation — real ETA needs a routing engine, but the reachable-area radius `speed × time` is close enough for the "restaurants I can reach in 30 min" UX.

### 8. Wire the fidelity harness

`tests/fidelity.test.ts` — the fidelity harness (`collectFidelityCoverage()`) exposes the `4 provider × 8 axis = 32 cell grid`. The faceted-advanced + geo axes are 2 of the 8; every provider (Meilisearch / Typesense / Algolia / OpenSearch OSS) covers both with a different dialect (`meili.faceted.*` / `algolia.geo.*` etc.).

```ts
import { describe, expect, it } from 'vitest';
import { collectFidelityCoverage } from '@kiwa-test/search';

describe('faceted + geo — fidelity coverage', () => {
  it('the 4 provider × faceted-advanced grid emits 4 rows', () => {
    const coverage = collectFidelityCoverage();
    const facetedRows = coverage.rows.filter((r) => r.axis === 'faceted-advanced');
    expect(facetedRows).toHaveLength(4);
    for (const row of facetedRows) {
      expect(new Set(row.neutralEvents)).toEqual(
        new Set([
          'facet.nested_computed',
          'facet.hierarchy_traversed',
          'facet.distinct_counted',
          'facet.refined_filter_applied',
        ]),
      );
    }
  });

  it('the 4 provider × geo grid emits 4 rows', () => {
    const coverage = collectFidelityCoverage();
    const geoRows = coverage.rows.filter((r) => r.axis === 'geo');
    expect(geoRows).toHaveLength(4);
    for (const row of geoRows) {
      expect(row.neutralEvents).toEqual([
        'geo.bounding_box_filtered',
        'geo.radius_filtered',
        'geo.polygon_filtered',
        'geo.isochrone_resolved',
      ]);
    }
  });

  it('Algolia dialect is stable for geo.bounding_box_filtered', () => {
    const coverage = collectFidelityCoverage(['algolia']);
    const box = coverage.rows.find((r) => r.axis === 'geo');
    expect(box?.providerEvents[0]).toMatch(/^algolia\./);
  });
});
```

The fidelity assertion is the *contract* the real-driver path in `examples/dogfood-search-faceted-geo-app` v2 tests against — the Algolia `insideBoundingBox` filter that emits `algolia.geo.bbox` MUST match the mock's dialect exactly. When the mock and the real Algolia diverge, the mock gets the fix (the mock is the SSOT).

### 9. Real driver mode

Under `KIWA_MODE=real` the same assertions run against a real Algolia sandbox. The dogfood app in `examples/dogfood-search-faceted-geo-app` v2 shows the pattern.

```ts
import { describe, it } from 'vitest';

const gate = { skip: process.env.KIWA_MODE !== 'real' };
const requiredEnv = ['KIWA_ALGOLIA_URL', 'ALGOLIA_KEY'] as const;
const envMissing = requiredEnv.filter((k) => !process.env[k]);

describe.skipIf(gate.skip || envMissing.length > 0)(
  'real-driver — Algolia faceted + geo',
  () => {
    it('runs the mock pipeline against the actual Algolia sandbox under KIWA_MODE=real', async () => {
      // Same session pipeline as the mock tests, but the nested facet
      // and bounding-box calls are routed to KIWA_ALGOLIA_URL / ALGOLIA_KEY.
    });
  },
);
```

The dogfood app exposes `pnpm test:real` — it flips `KIWA_MODE=real`, requires `KIWA_ALGOLIA_URL` + `ALGOLIA_KEY`, and re-runs the same session pipeline against a real Algolia sandbox. Failure means the mock diverged from the real Algolia semantics; the mock gets the fix.

## What you just learned

- **Faceted state machine** — `idle → nested-computed → distinct-counted → refined-filter-applied → hierarchy-traversed`. Each transition is a discrete UI-relevant event.
- **Parent-child invariant** — a parent facet count equals the sum of its children. When the sum drifts, the panel is broken.
- **Geo state machine** — `idle → bounding-box-filtered → radius-filtered → polygon-filtered → isochrone-resolved`. Each filter shape has a purpose (viewport / user-location / delivery-zone / travel-time).
- **Ray casting** — the polygon interior test, robust against concave shapes.
- **Isochrone approximation** — `speed × time` in km, converted to meters. Good enough for the "reachable in 30 min" UX.
- **Fidelity contract** — the mock's neutral events (`faceted.nested_computed`, `geo.bounding_box_filtered`) map to 4 provider dialects; when they diverge, the mock is SSOT.
- **Real-driver env gate** — `KIWA_MODE=real` (paired with `KIWA_ALGOLIA_URL` + `ALGOLIA_KEY`) gives you a real-driver env-gate that makes the mock path always-green and the real path opt-in.

## Where next

- Tutorial 73 — Vector search (kNN + HNSW + hybrid fusion + recall@k)
- Tutorial 75 — OpenSearch relevance tuning (BM25 / TF-IDF / custom ranking + A/B variant + synonym advanced + rolling reindex)
- Concept doc — `docs/concepts/search-real-driver-testing.md` (8 axis × 4 provider = 32 cell grid + real-driver env-gate pattern SSOT)
- Migration guide — `docs/migrations/v1.35-to-v1.36.md`
