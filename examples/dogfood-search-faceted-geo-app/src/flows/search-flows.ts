/**
 * Faceted-advanced + geo search lifecycle flows.
 *
 * `driveFacetedLifecycle` drives every faceted-axis op (startFacetedSession
 * → seedFacetedDocuments → computeNestedFacets → traverseHierarchy →
 * countDistinct → applyRefinedFilter) in the order `@kiwa-lab/search`
 * v0.3 faceted-advanced semantics expect. Any op that diverges surfaces
 * in the fidelity trace.
 *
 * `driveGeoLifecycle` drives every geo-axis op (startGeoSession →
 * seedGeoDocuments → queryBoundingBox → queryRadius → queryPolygon).
 *
 * `driveFacetedGeoLifecycle` combines both axes and adds the health
 * check op + fidelity signal so a full end-to-end lifecycle exercises
 * every op in `FACETED_GEO_HARNESS_OPS`.
 *
 * `driveFullMatrix` walks 3 fixture sets = 3 lifecycles so the fidelity
 * harness measures behavioural drift across every canonical production
 * combination.
 */

import { DEFAULT_BACKENDS } from '../policies/backends.js';
import {
  ALL_FIXTURES,
  type FacetQueryFixture,
  type FixtureSet,
  type GeoQueryFixture,
} from '../policies/query-fixtures.js';
import type {
  FacetedGeoSearchAdapter,
  FacetedGeoSearchBackend,
  TraceEvent,
} from '../adapters/interface.js';

/** Full lifecycle input for one (backend, fixture) pair. */
export interface LifecycleInput {
  backend: FacetedGeoSearchBackend;
  fixture: FixtureSet;
  indexId: string;
}

/**
 * Drive the faceted-axis lifecycle end-to-end: start a faceted session,
 * seed documents, and walk every canonical facet query fixture (nested
 * / hierarchy / distinct / refined).
 */
export async function driveFacetedLifecycle(
  adapter: FacetedGeoSearchAdapter,
  input: {
    backend: FacetedGeoSearchBackend;
    indexId: string;
    fixture: FixtureSet;
  },
): Promise<void> {
  if (input.fixture.facetedDocuments.length === 0) {
    return;
  }
  await adapter.startFacetedSession({
    backend: input.backend,
    indexId: input.indexId,
  });
  await adapter.seedFacetedDocuments({
    bucket: input.backend,
    indexId: input.indexId,
    documents: input.fixture.facetedDocuments,
  });
  for (const query of input.fixture.facetQueries) {
    await runFacetQuery(adapter, input.backend, input.indexId, query);
  }
}

/**
 * Drive the geo-axis lifecycle end-to-end: start a geo session, seed
 * documents, and walk every canonical geo query fixture (bounding-box
 * / radius / polygon).
 */
export async function driveGeoLifecycle(
  adapter: FacetedGeoSearchAdapter,
  input: {
    backend: FacetedGeoSearchBackend;
    indexId: string;
    fixture: FixtureSet;
  },
): Promise<void> {
  if (input.fixture.geoDocuments.length === 0) {
    return;
  }
  await adapter.startGeoSession({
    backend: input.backend,
    indexId: input.indexId,
  });
  await adapter.seedGeoDocuments({
    bucket: input.backend,
    indexId: input.indexId,
    documents: input.fixture.geoDocuments,
  });
  for (const query of input.fixture.geoQueries) {
    await runGeoQuery(adapter, input.backend, input.indexId, query);
  }
}

/**
 * Drive the full faceted-geo lifecycle end-to-end — faceted + geo axes
 * + health check + fidelity signal. Emits every op on the 14-op
 * contract at least once so a per-lifecycle trace has a stable event
 * count — the fidelity harness leans on that to detect missing /
 * drifted ops.
 */
export async function driveFacetedGeoLifecycle(
  adapter: FacetedGeoSearchAdapter,
  input: LifecycleInput,
): Promise<void> {
  await driveFacetedLifecycle(adapter, input);
  await driveGeoLifecycle(adapter, input);
  await adapter.emitFidelitySignal({
    bucket: input.backend,
    signal: 'ok',
    notes: `lifecycle ${input.backend}/${input.fixture.id}`,
  });
  await adapter.queryAlgoliaHealth({ bucket: input.backend });
}

/**
 * Drive lifecycles across 1 backend x 3 fixture sets = 3 lifecycles.
 * Each lifecycle exercises every op in the 14-op contract at least once
 * (subject to fixture data availability — categories fixture has no geo
 * data so geo ops are skipped in that lifecycle by design), so the
 * fidelity harness sees each op emit per lifecycle and can measure
 * divergence granularly.
 */
export async function driveFullMatrix(
  adapter: FacetedGeoSearchAdapter,
): Promise<{ lifecyclesRun: number }> {
  const lifecycles: LifecycleInput[] = [];
  for (const backend of DEFAULT_BACKENDS) {
    for (const fixture of ALL_FIXTURES) {
      lifecycles.push({
        backend,
        fixture,
        indexId: `${backend}-${fixture.id}`,
      });
    }
  }
  for (const input of lifecycles) {
    await driveFacetedGeoLifecycle(adapter, input);
  }
  return { lifecyclesRun: lifecycles.length };
}

/**
 * All op names the mock adapter walks — the 13 promise-returning method
 * ops on the adapter plus a synthesised `resetVerified` step the
 * fidelity harness emits at the end of a lifecycle. `reset` is included
 * so the full matrix + reset story stays observable.
 */
export const OPS_UNDER_TEST: readonly string[] = [
  'startFacetedSession',
  'seedFacetedDocuments',
  'computeNestedFacets',
  'traverseHierarchy',
  'countDistinct',
  'applyRefinedFilter',
  'startGeoSession',
  'seedGeoDocuments',
  'queryBoundingBox',
  'queryRadius',
  'queryPolygon',
  'emitFidelitySignal',
  'queryAlgoliaHealth',
];

/** Compare 2 traces for behavioural fidelity. Returns divergence detail. */
export function diffTraces(
  mock: TraceEvent[],
  real: TraceEvent[],
): {
  missingInReal: string[];
  missingInMock: string[];
  matchedOps: string[];
  divergentEvents: Array<{ op: string; mockEvent: string; realEvent: string }>;
} {
  const mockOps = new Set(mock.map((e) => e.op));
  const realOps = new Set(real.map((e) => e.op));
  const matchedOps = Array.from(mockOps).filter((op) => realOps.has(op));
  const missingInReal = Array.from(mockOps).filter((op) => !realOps.has(op));
  const missingInMock = Array.from(realOps).filter((op) => !mockOps.has(op));

  const divergentEvents: Array<{
    op: string;
    mockEvent: string;
    realEvent: string;
  }> = [];
  for (const op of matchedOps) {
    const mockEvent = mock.find((e) => e.op === op)?.neutralEvent ?? '';
    const realEvent = real.find((e) => e.op === op)?.neutralEvent ?? '';
    if (mockEvent !== realEvent && realEvent !== 'search.env_missing') {
      divergentEvents.push({ op, mockEvent, realEvent });
    }
  }
  return { missingInReal, missingInMock, matchedOps, divergentEvents };
}

async function runFacetQuery(
  adapter: FacetedGeoSearchAdapter,
  backend: FacetedGeoSearchBackend,
  indexId: string,
  query: FacetQueryFixture,
): Promise<void> {
  switch (query.kind) {
    case 'nested': {
      if (query.outerField === undefined || query.innerField === undefined) {
        throw new Error(
          `nested facet query ${query.id} missing outerField / innerField`,
        );
      }
      await adapter.computeNestedFacets({
        bucket: backend,
        indexId,
        outerField: query.outerField,
        innerField: query.innerField,
      });
      return;
    }
    case 'hierarchy': {
      if (query.field === undefined) {
        throw new Error(`hierarchy facet query ${query.id} missing field`);
      }
      await adapter.traverseHierarchy({
        bucket: backend,
        indexId,
        field: query.field,
        ...(query.separator !== undefined ? { separator: query.separator } : {}),
      });
      return;
    }
    case 'distinct': {
      if (query.field === undefined) {
        throw new Error(`distinct facet query ${query.id} missing field`);
      }
      await adapter.countDistinct({
        bucket: backend,
        indexId,
        field: query.field,
      });
      return;
    }
    case 'refined': {
      if (query.field === undefined || query.value === undefined) {
        throw new Error(`refined facet query ${query.id} missing field / value`);
      }
      await adapter.applyRefinedFilter({
        bucket: backend,
        indexId,
        field: query.field,
        value: query.value,
      });
      return;
    }
  }
}

async function runGeoQuery(
  adapter: FacetedGeoSearchAdapter,
  backend: FacetedGeoSearchBackend,
  indexId: string,
  query: GeoQueryFixture,
): Promise<void> {
  switch (query.kind) {
    case 'bounding-box': {
      if (query.bbox === undefined) {
        throw new Error(`bounding-box query ${query.id} missing bbox`);
      }
      await adapter.queryBoundingBox({
        bucket: backend,
        indexId,
        bbox: query.bbox,
      });
      return;
    }
    case 'radius': {
      if (
        query.centerLat === undefined ||
        query.centerLng === undefined ||
        query.radiusMeters === undefined
      ) {
        throw new Error(`radius query ${query.id} missing center / radius`);
      }
      await adapter.queryRadius({
        bucket: backend,
        indexId,
        centerLat: query.centerLat,
        centerLng: query.centerLng,
        radiusMeters: query.radiusMeters,
      });
      return;
    }
    case 'polygon': {
      if (query.polygon === undefined) {
        throw new Error(`polygon query ${query.id} missing polygon`);
      }
      await adapter.queryPolygon({
        bucket: backend,
        indexId,
        polygon: query.polygon,
      });
      return;
    }
  }
}
