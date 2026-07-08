/**
 * Mock adapter — drives `@kiwa/search` v0.3 `semantics/faceted-advanced`
 * + `semantics/geo` state machines deterministically without any backend.
 * The same app code exercises a full faceted session start + seed +
 * nested facet compute + hierarchy traversal + distinct count + refined
 * filter + geo session start + seed + bounding-box + radius + polygon
 * lifecycle without launching an Algolia server.
 *
 * State model — one {@link BucketSession} per bucket; sessions are
 * isolated so multi-fixture harnesses can run categories / restaurants /
 * events side-by-side without state leakage. That mirrors how Algolia
 * keeps per-index state in production.
 *
 * The mock adapter piggy-backs on the same neutral event vocabulary that
 * `@kiwa/search` v0.3 faceted-advanced + geo semantics emit — every
 * op appends the matching neutral event onto the trace so the fidelity
 * harness can assert both adapters produce identical event orderings.
 */

import { semantics } from '@kiwa/search';
import {
  type ApplyRefinedFilterResult,
  type BoundingBox,
  type ComputeNestedFacetsResult,
  type CountDistinctResult,
  type EmitFidelitySignalInput,
  type EmitFidelitySignalResult,
  type FacetedDocument,
  type FacetedGeoSearchAdapter,
  type FacetedGeoSearchBackend,
  type GeoDocument,
  type HealthCheckResult,
  type Polygon,
  type QueryBoundingBoxResult,
  type QueryPolygonResult,
  type QueryRadiusResult,
  type SearchTarget,
  type SeedFacetedDocumentsResult,
  type SeedGeoDocumentsResult,
  type StartFacetedSessionInput,
  type StartFacetedSessionResult,
  type StartGeoSessionInput,
  type StartGeoSessionResult,
  type TraceEvent,
  type TraverseHierarchyResult,
} from './interface.js';

const {
  applyRefinedFilter: facetedApplyRefinedFilter,
  computeNestedFacets: facetedComputeNestedFacets,
  countDistinct: facetedCountDistinct,
  filterBoundingBox: geoFilterBoundingBox,
  filterPolygon: geoFilterPolygon,
  filterRadius: geoFilterRadius,
  seedFacetedDocuments: facetedSeedDocuments,
  seedGeoDocuments: geoSeedDocuments,
  startFacetedSession: facetedStartSession,
  startGeoSession: geoStartSession,
  traverseHierarchy: facetedTraverseHierarchy,
} = semantics;

type FacetedSession = ReturnType<typeof facetedStartSession>;
type GeoSession = ReturnType<typeof geoStartSession>;

/**
 * Per-bucket session state — one faceted + geo session pair per bucket.
 * Buckets isolate fixture combinations (categories / restaurants /
 * events) so the matrix harness can drive N fixtures without state
 * leakage.
 */
interface BucketSession {
  backend: FacetedGeoSearchBackend;
  faceted: FacetedSession | null;
  geo: GeoSession | null;
}

/**
 * Build a mock faceted-geo search adapter. `target` selects the provider
 * vocabulary in the emitted trace; the default `algolia` gives the
 * fidelity harness a natural label for the mock leg of the diff.
 */
export function makeMockAdapter(
  input: { target?: SearchTarget } = {},
): FacetedGeoSearchAdapter {
  const target: SearchTarget = input.target ?? 'algolia';
  const buckets = new Map<string, BucketSession>();
  const traceLog: TraceEvent[] = [];

  const emit = (
    op: string,
    bucket: string,
    session: BucketSession | null,
    neutralEvent: string,
    metadata: Record<string, string | number | boolean> = {},
  ) => {
    const providerEvent = providerEventFor(target, neutralEvent);
    traceLog.push({
      op,
      bucket,
      neutralEvent,
      providerEvent,
      target,
      state: sessionStateLabel(session),
      timestampMs: Date.now(),
      ok: true,
      metadata: { target, bucket, ...metadata },
    });
  };

  const requireBucket = (bucket: string): BucketSession => {
    const session = buckets.get(bucket);
    if (!session) {
      throw new Error(`mock adapter: bucket ${bucket} has not been started`);
    }
    return session;
  };

  const ensureBucket = (bucket: string, backend: FacetedGeoSearchBackend): BucketSession => {
    const existing = buckets.get(bucket);
    if (existing) return existing;
    const created: BucketSession = {
      backend,
      faceted: null,
      geo: null,
    };
    buckets.set(bucket, created);
    return created;
  };

  return {
    target,

    async startFacetedSession(
      inputArg: StartFacetedSessionInput,
    ): Promise<StartFacetedSessionResult> {
      const bucket = inputArg.backend;
      const session = ensureBucket(bucket, inputArg.backend);
      session.faceted = facetedStartSession({
        target: mapBackendToTarget(inputArg.backend),
        indexId: inputArg.indexId,
      });
      emit('startFacetedSession', bucket, session, 'facet.session_started', {
        backend: inputArg.backend,
        indexId: inputArg.indexId,
      });
      return { backend: inputArg.backend, indexId: inputArg.indexId };
    },

    async seedFacetedDocuments(inputArg: {
      bucket: string;
      indexId: string;
      documents: readonly FacetedDocument[];
    }): Promise<SeedFacetedDocumentsResult> {
      const session = requireBucket(inputArg.bucket);
      if (!session.faceted) {
        throw new Error(
          `mock adapter: bucket ${inputArg.bucket} has no faceted session`,
        );
      }
      facetedSeedDocuments(
        session.faceted,
        inputArg.documents.map((d) => ({ id: d.id, facets: { ...d.facets } })),
      );
      emit('seedFacetedDocuments', inputArg.bucket, session, 'facet.documents_seeded', {
        indexId: inputArg.indexId,
        seededCount: inputArg.documents.length,
        totalCount: session.faceted.documents.length,
      });
      return {
        indexId: inputArg.indexId,
        seededCount: inputArg.documents.length,
        totalCount: session.faceted.documents.length,
      };
    },

    async computeNestedFacets(inputArg: {
      bucket: string;
      indexId: string;
      outerField: string;
      innerField: string;
    }): Promise<ComputeNestedFacetsResult> {
      const session = requireBucket(inputArg.bucket);
      if (!session.faceted) {
        throw new Error(
          `mock adapter: bucket ${inputArg.bucket} has no faceted session`,
        );
      }
      const { tree } = facetedComputeNestedFacets(session.faceted, {
        facetField: inputArg.outerField,
        subFacetField: inputArg.innerField,
      });
      emit('computeNestedFacets', inputArg.bucket, session, 'facet.nested_computed', {
        indexId: inputArg.indexId,
        outerField: inputArg.outerField,
        innerField: inputArg.innerField,
        outerBucketCount: tree.length,
      });
      return {
        outerField: inputArg.outerField,
        innerField: inputArg.innerField,
        outerBucketCount: tree.length,
        tree,
      };
    },

    async traverseHierarchy(inputArg: {
      bucket: string;
      indexId: string;
      field: string;
      separator?: string;
    }): Promise<TraverseHierarchyResult> {
      const session = requireBucket(inputArg.bucket);
      if (!session.faceted) {
        throw new Error(
          `mock adapter: bucket ${inputArg.bucket} has no faceted session`,
        );
      }
      const separator = inputArg.separator ?? '>';
      const { levels } = facetedTraverseHierarchy(session.faceted, {
        field: inputArg.field,
        separator,
      });
      emit('traverseHierarchy', inputArg.bucket, session, 'facet.hierarchy_traversed', {
        indexId: inputArg.indexId,
        field: inputArg.field,
        separator,
        levelCount: Object.keys(levels).length,
      });
      return {
        field: inputArg.field,
        separator,
        levels,
        levelCount: Object.keys(levels).length,
      };
    },

    async countDistinct(inputArg: {
      bucket: string;
      indexId: string;
      field: string;
    }): Promise<CountDistinctResult> {
      const session = requireBucket(inputArg.bucket);
      if (!session.faceted) {
        throw new Error(
          `mock adapter: bucket ${inputArg.bucket} has no faceted session`,
        );
      }
      const { distinct } = facetedCountDistinct(session.faceted, {
        field: inputArg.field,
      });
      emit('countDistinct', inputArg.bucket, session, 'facet.distinct_counted', {
        indexId: inputArg.indexId,
        field: inputArg.field,
        distinct,
        documentCount: session.faceted.documents.length,
      });
      return {
        field: inputArg.field,
        distinct,
        documentCount: session.faceted.documents.length,
      };
    },

    async applyRefinedFilter(inputArg: {
      bucket: string;
      indexId: string;
      field: string;
      value: string;
    }): Promise<ApplyRefinedFilterResult> {
      const session = requireBucket(inputArg.bucket);
      if (!session.faceted) {
        throw new Error(
          `mock adapter: bucket ${inputArg.bucket} has no faceted session`,
        );
      }
      const originalCount = session.faceted.documents.length;
      const { remaining } = facetedApplyRefinedFilter(session.faceted, {
        field: inputArg.field,
        value: inputArg.value,
      });
      emit('applyRefinedFilter', inputArg.bucket, session, 'facet.refined_filter_applied', {
        indexId: inputArg.indexId,
        field: inputArg.field,
        value: inputArg.value,
        remainingCount: remaining.length,
        originalCount,
      });
      return {
        field: inputArg.field,
        value: inputArg.value,
        remainingCount: remaining.length,
        originalCount,
        remaining,
      };
    },

    async startGeoSession(inputArg: StartGeoSessionInput): Promise<StartGeoSessionResult> {
      const bucket = inputArg.backend;
      const session = ensureBucket(bucket, inputArg.backend);
      session.geo = geoStartSession({
        target: mapBackendToTarget(inputArg.backend),
        indexId: inputArg.indexId,
      });
      emit('startGeoSession', bucket, session, 'geo.session_started', {
        backend: inputArg.backend,
        indexId: inputArg.indexId,
      });
      return { backend: inputArg.backend, indexId: inputArg.indexId };
    },

    async seedGeoDocuments(inputArg: {
      bucket: string;
      indexId: string;
      documents: readonly GeoDocument[];
    }): Promise<SeedGeoDocumentsResult> {
      const session = requireBucket(inputArg.bucket);
      if (!session.geo) {
        throw new Error(`mock adapter: bucket ${inputArg.bucket} has no geo session`);
      }
      geoSeedDocuments(
        session.geo,
        inputArg.documents.map((d) => ({
          id: d.id,
          lat: d.lat,
          lng: d.lng,
          ...(d.attributes !== undefined ? { attributes: { ...d.attributes } } : {}),
        })),
      );
      emit('seedGeoDocuments', inputArg.bucket, session, 'geo.documents_seeded', {
        indexId: inputArg.indexId,
        seededCount: inputArg.documents.length,
        totalCount: session.geo.documents.length,
      });
      return {
        indexId: inputArg.indexId,
        seededCount: inputArg.documents.length,
        totalCount: session.geo.documents.length,
      };
    },

    async queryBoundingBox(inputArg: {
      bucket: string;
      indexId: string;
      bbox: BoundingBox;
    }): Promise<QueryBoundingBoxResult> {
      const session = requireBucket(inputArg.bucket);
      if (!session.geo) {
        throw new Error(`mock adapter: bucket ${inputArg.bucket} has no geo session`);
      }
      const { hits } = geoFilterBoundingBox(session.geo, inputArg.bbox);
      emit('queryBoundingBox', inputArg.bucket, session, 'geo.bounding_box_filtered', {
        indexId: inputArg.indexId,
        hitCount: hits.length,
        swLat: inputArg.bbox.swLat,
        neLat: inputArg.bbox.neLat,
      });
      return {
        indexId: inputArg.indexId,
        hitCount: hits.length,
        hits,
      };
    },

    async queryRadius(inputArg: {
      bucket: string;
      indexId: string;
      centerLat: number;
      centerLng: number;
      radiusMeters: number;
    }): Promise<QueryRadiusResult> {
      const session = requireBucket(inputArg.bucket);
      if (!session.geo) {
        throw new Error(`mock adapter: bucket ${inputArg.bucket} has no geo session`);
      }
      const { hits } = geoFilterRadius(session.geo, {
        centerLat: inputArg.centerLat,
        centerLng: inputArg.centerLng,
        radiusMeters: inputArg.radiusMeters,
      });
      emit('queryRadius', inputArg.bucket, session, 'geo.radius_filtered', {
        indexId: inputArg.indexId,
        centerLat: inputArg.centerLat,
        centerLng: inputArg.centerLng,
        radiusMeters: inputArg.radiusMeters,
        hitCount: hits.length,
      });
      return {
        indexId: inputArg.indexId,
        centerLat: inputArg.centerLat,
        centerLng: inputArg.centerLng,
        radiusMeters: inputArg.radiusMeters,
        hitCount: hits.length,
        hits,
      };
    },

    async queryPolygon(inputArg: {
      bucket: string;
      indexId: string;
      polygon: Polygon;
    }): Promise<QueryPolygonResult> {
      const session = requireBucket(inputArg.bucket);
      if (!session.geo) {
        throw new Error(`mock adapter: bucket ${inputArg.bucket} has no geo session`);
      }
      const { hits } = geoFilterPolygon(session.geo, inputArg.polygon);
      emit('queryPolygon', inputArg.bucket, session, 'geo.polygon_filtered', {
        indexId: inputArg.indexId,
        vertexCount: inputArg.polygon.vertices.length,
        hitCount: hits.length,
      });
      return {
        indexId: inputArg.indexId,
        vertexCount: inputArg.polygon.vertices.length,
        hitCount: hits.length,
        hits,
      };
    },

    async emitFidelitySignal(
      inputArg: EmitFidelitySignalInput,
    ): Promise<EmitFidelitySignalResult> {
      const session = buckets.get(inputArg.bucket) ?? null;
      const emittedAt = Date.now();
      emit('emitFidelitySignal', inputArg.bucket, session, 'search.fidelity_signal', {
        signal: inputArg.signal,
        notes: inputArg.notes ?? '',
        emittedAt,
      });
      return { bucket: inputArg.bucket, signal: inputArg.signal, emittedAt };
    },

    async queryAlgoliaHealth(inputArg: { bucket: string }): Promise<HealthCheckResult> {
      const session = buckets.get(inputArg.bucket) ?? null;
      const endpoint = 'in-memory://algolia';
      emit('queryAlgoliaHealth', inputArg.bucket, session, 'search.algolia_health_ok', {
        endpoint,
        healthy: true,
      });
      return { backend: 'algolia', endpoint, healthy: true };
    },

    async reset(): Promise<void> {
      buckets.clear();
      traceLog.length = 0;
    },

    trace(): TraceEvent[] {
      return traceLog.slice();
    },
  };
}

/**
 * Map a FacetedGeoSearchBackend id to the semantics.SearchTarget
 * vocabulary. The mock adapter uses the same identifier space for both,
 * so this is a direct 1:1 map at present.
 */
function mapBackendToTarget(backend: FacetedGeoSearchBackend): SearchTarget {
  return backend;
}

/**
 * Best-effort session state label used in trace records — faceted
 * session state wins if present, geo session state is used as fallback,
 * and `idle` when neither has been started.
 */
function sessionStateLabel(session: BucketSession | null): string {
  if (session === null) return 'idle';
  if (session.faceted) return session.faceted.state;
  if (session.geo) return session.geo.state;
  return 'idle';
}

/**
 * Map a neutral event to its provider-specific dialect. The search v0.3
 * package exposes `providerEventName` in `semantics/types.ts` but the
 * dogfood adapter needs to emit synthetic events (`facet.session_started`
 * / `geo.session_started` / `search.fidelity_signal` /
 * `search.algolia_health_ok`) that fall outside the semantic axis
 * vocabulary, so we prefix locally.
 */
function providerEventFor(target: SearchTarget, neutralEvent: string): string {
  return `${target}.${neutralEvent}`;
}
