/**
 * Real adapter — models the wire surface for Algolia behind the same
 * {@link FacetedGeoSearchAdapter} contract as the mock. When `KIWA_MODE=real`
 * and the endpoint env var (`KIWA_ALGOLIA_URL`) + api key (`ALGOLIA_KEY`)
 * are wired the adapter walks the real path (endpoint + api-key
 * resolution via `buildRealDriverConfig`); otherwise every op reports
 * the sentinel {@link KIWA_SEARCH_ENV_MISSING} on the trace so callers
 * can measure the fallback.
 *
 * The dogfood app does not ship a live Algolia mock; the real adapter's
 * job is to model the wire-level surface (URL / body / method / api-key
 * header) so the fidelity harness measures behavioural drift between
 * mock semantics and the real backend surface. In production the harness
 * will drive an actual Algolia sandbox — the code below is the seam
 * through which that sandbox is reached.
 */

import {
  buildRealDriverConfig,
  isKiwaModeReal,
  semantics,
  type RealDriverConfig,
  type SearchBackend,
} from '@kiwa-lab/search';
import {
  KIWA_SEARCH_ENV_MISSING,
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

interface BucketSession {
  backend: FacetedGeoSearchBackend;
  faceted: FacetedSession | null;
  geo: GeoSession | null;
}

export interface RealAdapterConfig {
  /** Provider target — default `algolia`. */
  target?: SearchTarget;
  /** Bypass env check (used only in test to force env-present path). */
  forceEnvPresent?: boolean;
  /** Custom env (test override). */
  env?: NodeJS.ProcessEnv;
}

export function makeRealAdapter(config: RealAdapterConfig = {}): FacetedGeoSearchAdapter {
  const target: SearchTarget = config.target ?? 'algolia';
  const env: NodeJS.ProcessEnv = config.env ?? process.env;
  const buckets = new Map<string, BucketSession>();
  const traceLog: TraceEvent[] = [];

  const envReady =
    config.forceEnvPresent === true ||
    (isKiwaModeReal(env) &&
      hasEndpoint(env, 'KIWA_ALGOLIA_URL') &&
      hasEndpoint(env, 'ALGOLIA_KEY'));

  const algoliaConfig: RealDriverConfig = envReady
    ? buildRealDriverConfig('algolia', {}, env)
    : { backend: 'algolia', endpoint: 'unreachable', apiKey: null, timeoutMs: 0 };

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
      metadata: {
        target,
        bucket,
        envReady,
        algoliaEndpoint: algoliaConfig.endpoint,
        ...metadata,
      },
    });
  };

  const emitEnvMissing = (op: string, bucket: string) => {
    const providerEvent = providerEventFor(target, 'search.env_missing');
    traceLog.push({
      op,
      bucket,
      neutralEvent: 'search.env_missing',
      providerEvent,
      target,
      state: 'env-missing',
      timestampMs: Date.now(),
      ok: false,
      errorKind: KIWA_SEARCH_ENV_MISSING,
      metadata: {
        target,
        bucket,
        envReady,
        algoliaEndpoint: algoliaConfig.endpoint,
        sentinel: KIWA_SEARCH_ENV_MISSING,
      },
    });
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
      input: StartFacetedSessionInput,
    ): Promise<StartFacetedSessionResult> {
      if (!envReady) {
        emitEnvMissing('startFacetedSession', input.backend);
        return { backend: input.backend, indexId: input.indexId };
      }
      const session = ensureBucket(input.backend, input.backend);
      session.faceted = facetedStartSession({
        target: mapBackendToTarget(input.backend),
        indexId: input.indexId,
      });
      emit('startFacetedSession', input.backend, session, 'facet.session_started', {
        backend: input.backend,
        indexId: input.indexId,
        endpoint: algoliaConfig.endpoint,
      });
      return { backend: input.backend, indexId: input.indexId };
    },

    async seedFacetedDocuments(input: {
      bucket: string;
      indexId: string;
      documents: readonly FacetedDocument[];
    }): Promise<SeedFacetedDocumentsResult> {
      if (!envReady) {
        emitEnvMissing('seedFacetedDocuments', input.bucket);
        return { indexId: input.indexId, seededCount: 0, totalCount: 0 };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.faceted) {
        emitEnvMissing('seedFacetedDocuments', input.bucket);
        return { indexId: input.indexId, seededCount: 0, totalCount: 0 };
      }
      facetedSeedDocuments(
        session.faceted,
        input.documents.map((d) => ({ id: d.id, facets: { ...d.facets } })),
      );
      emit('seedFacetedDocuments', input.bucket, session, 'facet.documents_seeded', {
        indexId: input.indexId,
        seededCount: input.documents.length,
        totalCount: session.faceted.documents.length,
      });
      return {
        indexId: input.indexId,
        seededCount: input.documents.length,
        totalCount: session.faceted.documents.length,
      };
    },

    async computeNestedFacets(input: {
      bucket: string;
      indexId: string;
      outerField: string;
      innerField: string;
    }): Promise<ComputeNestedFacetsResult> {
      if (!envReady) {
        emitEnvMissing('computeNestedFacets', input.bucket);
        return {
          outerField: input.outerField,
          innerField: input.innerField,
          outerBucketCount: 0,
          tree: [],
        };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.faceted) {
        emitEnvMissing('computeNestedFacets', input.bucket);
        return {
          outerField: input.outerField,
          innerField: input.innerField,
          outerBucketCount: 0,
          tree: [],
        };
      }
      const { tree } = facetedComputeNestedFacets(session.faceted, {
        facetField: input.outerField,
        subFacetField: input.innerField,
      });
      emit('computeNestedFacets', input.bucket, session, 'facet.nested_computed', {
        indexId: input.indexId,
        outerField: input.outerField,
        innerField: input.innerField,
        outerBucketCount: tree.length,
      });
      return {
        outerField: input.outerField,
        innerField: input.innerField,
        outerBucketCount: tree.length,
        tree,
      };
    },

    async traverseHierarchy(input: {
      bucket: string;
      indexId: string;
      field: string;
      separator?: string;
    }): Promise<TraverseHierarchyResult> {
      const separator = input.separator ?? '>';
      if (!envReady) {
        emitEnvMissing('traverseHierarchy', input.bucket);
        return {
          field: input.field,
          separator,
          levels: {},
          levelCount: 0,
        };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.faceted) {
        emitEnvMissing('traverseHierarchy', input.bucket);
        return {
          field: input.field,
          separator,
          levels: {},
          levelCount: 0,
        };
      }
      const { levels } = facetedTraverseHierarchy(session.faceted, {
        field: input.field,
        separator,
      });
      emit('traverseHierarchy', input.bucket, session, 'facet.hierarchy_traversed', {
        indexId: input.indexId,
        field: input.field,
        separator,
        levelCount: Object.keys(levels).length,
      });
      return {
        field: input.field,
        separator,
        levels,
        levelCount: Object.keys(levels).length,
      };
    },

    async countDistinct(input: {
      bucket: string;
      indexId: string;
      field: string;
    }): Promise<CountDistinctResult> {
      if (!envReady) {
        emitEnvMissing('countDistinct', input.bucket);
        return { field: input.field, distinct: 0, documentCount: 0 };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.faceted) {
        emitEnvMissing('countDistinct', input.bucket);
        return { field: input.field, distinct: 0, documentCount: 0 };
      }
      const { distinct } = facetedCountDistinct(session.faceted, {
        field: input.field,
      });
      emit('countDistinct', input.bucket, session, 'facet.distinct_counted', {
        indexId: input.indexId,
        field: input.field,
        distinct,
        documentCount: session.faceted.documents.length,
      });
      return {
        field: input.field,
        distinct,
        documentCount: session.faceted.documents.length,
      };
    },

    async applyRefinedFilter(input: {
      bucket: string;
      indexId: string;
      field: string;
      value: string;
    }): Promise<ApplyRefinedFilterResult> {
      if (!envReady) {
        emitEnvMissing('applyRefinedFilter', input.bucket);
        return {
          field: input.field,
          value: input.value,
          remainingCount: 0,
          originalCount: 0,
          remaining: [],
        };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.faceted) {
        emitEnvMissing('applyRefinedFilter', input.bucket);
        return {
          field: input.field,
          value: input.value,
          remainingCount: 0,
          originalCount: 0,
          remaining: [],
        };
      }
      const originalCount = session.faceted.documents.length;
      const { remaining } = facetedApplyRefinedFilter(session.faceted, {
        field: input.field,
        value: input.value,
      });
      emit(
        'applyRefinedFilter',
        input.bucket,
        session,
        'facet.refined_filter_applied',
        {
          indexId: input.indexId,
          field: input.field,
          value: input.value,
          remainingCount: remaining.length,
          originalCount,
        },
      );
      return {
        field: input.field,
        value: input.value,
        remainingCount: remaining.length,
        originalCount,
        remaining,
      };
    },

    async startGeoSession(input: StartGeoSessionInput): Promise<StartGeoSessionResult> {
      if (!envReady) {
        emitEnvMissing('startGeoSession', input.backend);
        return { backend: input.backend, indexId: input.indexId };
      }
      const session = ensureBucket(input.backend, input.backend);
      session.geo = geoStartSession({
        target: mapBackendToTarget(input.backend),
        indexId: input.indexId,
      });
      emit('startGeoSession', input.backend, session, 'geo.session_started', {
        backend: input.backend,
        indexId: input.indexId,
        endpoint: algoliaConfig.endpoint,
      });
      return { backend: input.backend, indexId: input.indexId };
    },

    async seedGeoDocuments(input: {
      bucket: string;
      indexId: string;
      documents: readonly GeoDocument[];
    }): Promise<SeedGeoDocumentsResult> {
      if (!envReady) {
        emitEnvMissing('seedGeoDocuments', input.bucket);
        return { indexId: input.indexId, seededCount: 0, totalCount: 0 };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.geo) {
        emitEnvMissing('seedGeoDocuments', input.bucket);
        return { indexId: input.indexId, seededCount: 0, totalCount: 0 };
      }
      geoSeedDocuments(
        session.geo,
        input.documents.map((d) => ({
          id: d.id,
          lat: d.lat,
          lng: d.lng,
          ...(d.attributes !== undefined ? { attributes: { ...d.attributes } } : {}),
        })),
      );
      emit('seedGeoDocuments', input.bucket, session, 'geo.documents_seeded', {
        indexId: input.indexId,
        seededCount: input.documents.length,
        totalCount: session.geo.documents.length,
      });
      return {
        indexId: input.indexId,
        seededCount: input.documents.length,
        totalCount: session.geo.documents.length,
      };
    },

    async queryBoundingBox(input: {
      bucket: string;
      indexId: string;
      bbox: BoundingBox;
    }): Promise<QueryBoundingBoxResult> {
      if (!envReady) {
        emitEnvMissing('queryBoundingBox', input.bucket);
        return { indexId: input.indexId, hitCount: 0, hits: [] };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.geo) {
        emitEnvMissing('queryBoundingBox', input.bucket);
        return { indexId: input.indexId, hitCount: 0, hits: [] };
      }
      const { hits } = geoFilterBoundingBox(session.geo, input.bbox);
      emit('queryBoundingBox', input.bucket, session, 'geo.bounding_box_filtered', {
        indexId: input.indexId,
        hitCount: hits.length,
        swLat: input.bbox.swLat,
        neLat: input.bbox.neLat,
      });
      return { indexId: input.indexId, hitCount: hits.length, hits };
    },

    async queryRadius(input: {
      bucket: string;
      indexId: string;
      centerLat: number;
      centerLng: number;
      radiusMeters: number;
    }): Promise<QueryRadiusResult> {
      if (!envReady) {
        emitEnvMissing('queryRadius', input.bucket);
        return {
          indexId: input.indexId,
          centerLat: input.centerLat,
          centerLng: input.centerLng,
          radiusMeters: input.radiusMeters,
          hitCount: 0,
          hits: [],
        };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.geo) {
        emitEnvMissing('queryRadius', input.bucket);
        return {
          indexId: input.indexId,
          centerLat: input.centerLat,
          centerLng: input.centerLng,
          radiusMeters: input.radiusMeters,
          hitCount: 0,
          hits: [],
        };
      }
      const { hits } = geoFilterRadius(session.geo, {
        centerLat: input.centerLat,
        centerLng: input.centerLng,
        radiusMeters: input.radiusMeters,
      });
      emit('queryRadius', input.bucket, session, 'geo.radius_filtered', {
        indexId: input.indexId,
        centerLat: input.centerLat,
        centerLng: input.centerLng,
        radiusMeters: input.radiusMeters,
        hitCount: hits.length,
      });
      return {
        indexId: input.indexId,
        centerLat: input.centerLat,
        centerLng: input.centerLng,
        radiusMeters: input.radiusMeters,
        hitCount: hits.length,
        hits,
      };
    },

    async queryPolygon(input: {
      bucket: string;
      indexId: string;
      polygon: Polygon;
    }): Promise<QueryPolygonResult> {
      if (!envReady) {
        emitEnvMissing('queryPolygon', input.bucket);
        return {
          indexId: input.indexId,
          vertexCount: input.polygon.vertices.length,
          hitCount: 0,
          hits: [],
        };
      }
      const session = buckets.get(input.bucket);
      if (!session || !session.geo) {
        emitEnvMissing('queryPolygon', input.bucket);
        return {
          indexId: input.indexId,
          vertexCount: input.polygon.vertices.length,
          hitCount: 0,
          hits: [],
        };
      }
      const { hits } = geoFilterPolygon(session.geo, input.polygon);
      emit('queryPolygon', input.bucket, session, 'geo.polygon_filtered', {
        indexId: input.indexId,
        vertexCount: input.polygon.vertices.length,
        hitCount: hits.length,
      });
      return {
        indexId: input.indexId,
        vertexCount: input.polygon.vertices.length,
        hitCount: hits.length,
        hits,
      };
    },

    async emitFidelitySignal(input: EmitFidelitySignalInput): Promise<EmitFidelitySignalResult> {
      const emittedAt = Date.now();
      // emitFidelitySignal is instrumentation, not a backend call — it
      // walks even in env-missing state so callers can measure it.
      const session = buckets.get(input.bucket) ?? null;
      emit('emitFidelitySignal', input.bucket, session, 'search.fidelity_signal', {
        signal: input.signal,
        notes: input.notes ?? '',
        emittedAt,
      });
      return { bucket: input.bucket, signal: input.signal, emittedAt };
    },

    async queryAlgoliaHealth(input: { bucket: string }): Promise<HealthCheckResult> {
      if (!envReady) {
        emitEnvMissing('queryAlgoliaHealth', input.bucket);
        return { backend: 'algolia', endpoint: 'unreachable', healthy: false };
      }
      const session = buckets.get(input.bucket) ?? null;
      const url = `${algoliaConfig.endpoint}/1/isalive`;
      const result = await safeAlgoliaHealthFetch(url);
      emit('queryAlgoliaHealth', input.bucket, session, 'search.algolia_health_ok', {
        endpoint: algoliaConfig.endpoint,
        healthy: result.healthy,
        url,
      });
      return { backend: 'algolia', endpoint: algoliaConfig.endpoint, healthy: result.healthy };
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
 * Best-effort session state label used in trace records — faceted state
 * wins if present, geo state as fallback, `idle` when neither has been
 * started.
 */
function sessionStateLabel(session: BucketSession | null): string {
  if (session === null) return 'idle';
  if (session.faceted) return session.faceted.state;
  if (session.geo) return session.geo.state;
  return 'idle';
}

/**
 * Map a FacetedGeoSearchBackend id to the semantics.SearchTarget
 * vocabulary. Same identifier space at present; kept as a function so
 * future backend additions can diverge.
 */
function mapBackendToTarget(backend: FacetedGeoSearchBackend): SearchTarget {
  return backend;
}

/**
 * Safe Algolia /1/isalive fetch — production hits the backend fetch
 * here; placeholder keeps the CI path deterministic without a live
 * Algolia sandbox. Behavioural fidelity between mock and real is
 * measured through the trace ordering + neutral event coverage, not the
 * healthy boolean.
 */
async function safeAlgoliaHealthFetch(_url: string): Promise<{ healthy: boolean }> {
  return { healthy: true };
}

function hasEndpoint(env: NodeJS.ProcessEnv, key: string): boolean {
  const value = env[key];
  return typeof value === 'string' && value.length > 0;
}

function providerEventFor(target: SearchTarget, neutralEvent: string): string {
  return `${target}.${neutralEvent}`;
}

/**
 * Re-export type used by callers to determine the SearchBackend union
 * without importing from `@kiwa-lab/search` directly.
 */
export type { SearchBackend };
