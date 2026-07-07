/**
 * The 1 canonical faceted + geo search backend the dogfood app targets.
 *
 * Algolia is the backend the AC anchors this v1.36-3 dogfood on —
 * Algolia's production API ships native facet distribution (nested +
 * hierarchical) and geo filters (aroundLatLng radius + insideBoundingBox
 * + insidePolygon) that are the reference implementation the
 * `@kiwa-test/search` v0.3 faceted-advanced + geo axes were designed to
 * match. Meilisearch / Typesense / OpenSearch OSS are covered by sibling
 * apps in the v1.36-2 / v1.36-4 releases.
 */

import type { FacetedGeoSearchBackend } from '../adapters/interface.js';

/** Algolia backend identifier. */
export const BACKEND_ALGOLIA: FacetedGeoSearchBackend = 'algolia';

/** The single backend the dogfood app targets. */
export const DEFAULT_BACKENDS: readonly FacetedGeoSearchBackend[] = [BACKEND_ALGOLIA];

/**
 * Provider parity helper — determine whether a backend supports the
 * faceted + geo combination we exercise in this dogfood. Algolia does,
 * so the helper returns true for the current set; kept as a function so
 * future backend additions can express partial support.
 */
export function supportsFacetedGeo(backend: FacetedGeoSearchBackend): boolean {
  return backend === BACKEND_ALGOLIA;
}
