/**
 * Public surface for dogfood-search-faceted-geo-app v0.0.1 (v1.36-3).
 *
 * A dogfood app that drives the `@kiwa-lab/search` v0.3 faceted-advanced
 * + geo axes (start session → seed docs → nested facet compute →
 * hierarchy traverse → distinct count → refined filter → geo bounding
 * box → radius → polygon → fidelity signal → Algolia health check →
 * reset) behind a provider-neutral 15-op contract, satisfied by both a
 * deterministic mock adapter and a `KIWA_MODE=real` Algolia wire-surface
 * real adapter. The fidelity harness diffs both traces and feeds the
 * divergence count into the `@kiwa-lab/quality-metrics` 13-axis
 * release gate.
 */

export { makeMockAdapter } from './adapters/mock.js';
export { makeRealAdapter, type RealAdapterConfig } from './adapters/real.js';
export {
  KIWA_SEARCH_ENV_MISSING,
  FACETED_GEO_HARNESS_OPS,
  type ApplyRefinedFilterResult,
  type BoundingBox,
  type ComputeNestedFacetsResult,
  type CountDistinctResult,
  type EmitFidelitySignalInput,
  type EmitFidelitySignalResult,
  type FacetedDocument,
  type FacetedGeoHarnessOp,
  type FacetedGeoSearchAdapter,
  type FacetedGeoSearchBackend,
  type GeoDocument,
  type HealthCheckResult,
  type NestedFacetNode,
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
} from './adapters/interface.js';

export {
  BACKEND_ALGOLIA,
  DEFAULT_BACKENDS,
  supportsFacetedGeo,
} from './policies/backends.js';

export {
  ALL_FIXTURES,
  FIXTURE_CATEGORIES,
  FIXTURE_EVENTS,
  FIXTURE_RESTAURANTS,
  type FacetQueryFixture,
  type FixtureSet,
  type GeoQueryFixture,
} from './policies/query-fixtures.js';

export {
  OPS_UNDER_TEST,
  diffTraces,
  driveFacetedGeoLifecycle,
  driveFacetedLifecycle,
  driveFullMatrix,
  driveGeoLifecycle,
  type LifecycleInput,
} from './flows/search-flows.js';

export {
  runAdapterMatrix,
  runFidelityHarness,
  type FidelityRunInput,
  type FidelityRunOutput,
} from './flows/fidelity.js';
