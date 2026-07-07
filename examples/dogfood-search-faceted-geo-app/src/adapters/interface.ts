/**
 * Provider-neutral faceted-advanced + geo search adapter surface for the
 * dogfood-search-faceted-geo-app.
 *
 * The dogfood app drives an Algolia-anchored faceted + geo harness through
 * this contract only. Two implementations exist —
 *  - {@link makeMockAdapter} — walks the `@kiwa-test/search` v0.3
 *    `semantics/faceted-advanced` + `semantics/geo` state machines
 *    deterministically without any backend. Every op emits the neutral
 *    event onto the trace so the fidelity harness can diff ordering
 *    against the real adapter.
 *  - {@link makeRealAdapter} — models the Algolia HTTP wire surface
 *    (endpoint + application id + admin key resolution + facet request +
 *    geo request) behind the `KIWA_MODE=real` env-gate. When env vars
 *    (`KIWA_ALGOLIA_URL`, `ALGOLIA_KEY`) are wired the adapter walks the
 *    real path; otherwise every op reports the sentinel
 *    {@link KIWA_SEARCH_ENV_MISSING} so the app can budget the fallback path.
 *
 * The AC anchors this contract on 1 backend (Algolia) — the reference
 * production deployment for BM25 + facet + geo search — x 3 fixture sets
 * (categories / restaurants / events) x 4 canonical facet queries
 * (nested / hierarchy / distinct / refined) x 3 canonical geo queries
 * (bounding-box / radius / polygon). The 15 ops below cover the facet +
 * geo lifecycle end-to-end so the fidelity harness can point at the
 * exact op that drifted between mock semantics and the real Algolia wire
 * surface.
 */

import type { semantics } from '@kiwa-test/search';
import type { SearchBackend } from '@kiwa-test/search';

/** Re-export from search semantics namespace. */
export type SearchTarget = semantics.SearchTarget;

/** Faceted document — id + facet field map (single or multi valued). */
export type FacetedDocument = semantics.FacetedDocument;

/** Geo document — id + lat/lng + optional attributes. */
export type GeoDocument = semantics.GeoDocument;

/** Nested facet tree node — value + count + child branches. */
export type NestedFacetNode = semantics.NestedFacetNode;

/** Bounding box — SW / NE lat/lng corners. */
export type BoundingBox = semantics.BoundingBox;

/** Polygon — 3+ vertices. */
export type Polygon = semantics.Polygon;

/** Backend target this dogfood app anchors on. */
export type FacetedGeoSearchBackend = Extract<SearchBackend, 'algolia'>;

/** Faceted session start input. */
export interface StartFacetedSessionInput {
  backend: FacetedGeoSearchBackend;
  indexId: string;
}

/** Result of starting a faceted session. */
export interface StartFacetedSessionResult {
  backend: FacetedGeoSearchBackend;
  indexId: string;
}

/** Result of seeding faceted documents. */
export interface SeedFacetedDocumentsResult {
  indexId: string;
  seededCount: number;
  totalCount: number;
}

/** Result of computing nested facets. */
export interface ComputeNestedFacetsResult {
  outerField: string;
  innerField: string;
  outerBucketCount: number;
  tree: readonly NestedFacetNode[];
}

/** Result of traversing a hierarchy facet. */
export interface TraverseHierarchyResult {
  field: string;
  separator: string;
  levels: Record<string, number>;
  levelCount: number;
}

/** Result of counting distinct facet values. */
export interface CountDistinctResult {
  field: string;
  distinct: number;
  documentCount: number;
}

/** Result of applying a refined facet filter. */
export interface ApplyRefinedFilterResult {
  field: string;
  value: string;
  remainingCount: number;
  originalCount: number;
  remaining: readonly FacetedDocument[];
}

/** Geo session start input. */
export interface StartGeoSessionInput {
  backend: FacetedGeoSearchBackend;
  indexId: string;
}

/** Result of starting a geo session. */
export interface StartGeoSessionResult {
  backend: FacetedGeoSearchBackend;
  indexId: string;
}

/** Result of seeding geo documents. */
export interface SeedGeoDocumentsResult {
  indexId: string;
  seededCount: number;
  totalCount: number;
}

/** Result of a bounding-box query. */
export interface QueryBoundingBoxResult {
  indexId: string;
  hitCount: number;
  hits: readonly GeoDocument[];
}

/** Result of a radius query. */
export interface QueryRadiusResult {
  indexId: string;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  hitCount: number;
  hits: ReadonlyArray<GeoDocument & { distanceMeters: number }>;
}

/** Result of a polygon query. */
export interface QueryPolygonResult {
  indexId: string;
  vertexCount: number;
  hitCount: number;
  hits: readonly GeoDocument[];
}

/** Fidelity signal emit input. */
export interface EmitFidelitySignalInput {
  bucket: string;
  signal: 'ok' | 'drift' | 'divergence';
  notes?: string;
}

/** Result of emitting a fidelity signal. */
export interface EmitFidelitySignalResult {
  bucket: string;
  signal: 'ok' | 'drift' | 'divergence';
  emittedAt: number;
}

/** Result of an Algolia health check. */
export interface HealthCheckResult {
  backend: FacetedGeoSearchBackend;
  endpoint: string;
  healthy: boolean;
}

/** Neutral trace event emitted by both adapters. */
export interface TraceEvent {
  op: string;
  bucket: string;
  neutralEvent: string;
  providerEvent: string;
  target: SearchTarget;
  state: string;
  timestampMs: number;
  /**
   * Whether the op completed against a functional backend. Mock adapter
   * ops are always `ok: true` (in-memory state machine); real adapter
   * ops are `ok: false` with `errorKind: KIWA_SEARCH_ENV_MISSING` when
   * env vars are missing. The fidelity harness surfaces this asymmetry
   * as a behavioural divergence.
   */
  ok: boolean;
  errorKind?: string | undefined;
  metadata: Record<string, string | number | boolean>;
}

/**
 * The 15-op faceted-advanced + geo search harness contract that both
 * adapters satisfy.
 *
 * Ordering — a full run flows through 15 ops so an app / test can drive
 * the entire faceted session start + seed + nested + hierarchy + distinct
 * + refined + geo session start + seed + bounding-box + radius + polygon
 * + fidelity signal + health check + reset lifecycle once and both
 * adapters emit the same neutral event trace.
 */
export interface FacetedGeoSearchAdapter {
  /** Provider target identifier. */
  readonly target: SearchTarget;

  /** Start a faceted session for the given backend. */
  startFacetedSession(input: StartFacetedSessionInput): Promise<StartFacetedSessionResult>;

  /** Seed faceted documents into the session. */
  seedFacetedDocuments(input: {
    bucket: string;
    indexId: string;
    documents: readonly FacetedDocument[];
  }): Promise<SeedFacetedDocumentsResult>;

  /** Compute a nested facet tree (outer x inner). */
  computeNestedFacets(input: {
    bucket: string;
    indexId: string;
    outerField: string;
    innerField: string;
  }): Promise<ComputeNestedFacetsResult>;

  /** Traverse a hierarchical facet by a path separator. */
  traverseHierarchy(input: {
    bucket: string;
    indexId: string;
    field: string;
    separator?: string;
  }): Promise<TraverseHierarchyResult>;

  /** Count distinct values across the seeded documents. */
  countDistinct(input: {
    bucket: string;
    indexId: string;
    field: string;
  }): Promise<CountDistinctResult>;

  /** Apply a refined filter (field = value) and report remaining docs. */
  applyRefinedFilter(input: {
    bucket: string;
    indexId: string;
    field: string;
    value: string;
  }): Promise<ApplyRefinedFilterResult>;

  /** Start a geo session for the given backend. */
  startGeoSession(input: StartGeoSessionInput): Promise<StartGeoSessionResult>;

  /** Seed geo documents into the session. */
  seedGeoDocuments(input: {
    bucket: string;
    indexId: string;
    documents: readonly GeoDocument[];
  }): Promise<SeedGeoDocumentsResult>;

  /** Query documents inside a bounding box. */
  queryBoundingBox(input: {
    bucket: string;
    indexId: string;
    bbox: BoundingBox;
  }): Promise<QueryBoundingBoxResult>;

  /** Query documents within a radius from a center point. */
  queryRadius(input: {
    bucket: string;
    indexId: string;
    centerLat: number;
    centerLng: number;
    radiusMeters: number;
  }): Promise<QueryRadiusResult>;

  /** Query documents inside a polygon. */
  queryPolygon(input: {
    bucket: string;
    indexId: string;
    polygon: Polygon;
  }): Promise<QueryPolygonResult>;

  /** Emit a synthesised fidelity marker used by the harness. */
  emitFidelitySignal(input: EmitFidelitySignalInput): Promise<EmitFidelitySignalResult>;

  /** Algolia /1/isalive check (real path: HTTP GET; mock: always ok). */
  queryAlgoliaHealth(input: { bucket: string }): Promise<HealthCheckResult>;

  /** Reset the adapter (drop all state, resettable across tests). */
  reset(): Promise<void>;

  /** Trace transcript for fidelity diffing. */
  trace(): TraceEvent[];
}

/**
 * The full 14 op names + synthesised `resetVerified` step used both to
 * drive the fidelity harness and to assert both adapters implement the
 * same surface. `reset` is on the interface but exercised at the top of
 * every lifecycle rather than as a matrix step.
 */
export const FACETED_GEO_HARNESS_OPS = [
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
  'reset',
  'resetVerified',
] as const;

export type FacetedGeoHarnessOp = (typeof FACETED_GEO_HARNESS_OPS)[number];

/** Sentinel emitted by the real adapter when env is missing. */
export const KIWA_SEARCH_ENV_MISSING = 'KIWA_SEARCH_ENV_MISSING';
