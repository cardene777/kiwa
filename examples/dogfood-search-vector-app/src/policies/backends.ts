/**
 * The 2 canonical hybrid-search backends the dogfood app targets.
 *
 * Meilisearch v1.x + Typesense are the 2 backends the AC anchors this
 * v1.36-2 dogfood on — both ship native hybrid search (vector + keyword)
 * with production-grade HNSW / IVF indexes and are the pair
 * `@kiwa-test/search` v0.3 vector + semantic axes were designed to
 * match. Algolia + OpenSearch OSS are covered by sibling apps in the
 * v1.36-3 / v1.36-4 releases.
 */

import type { HybridSearchBackend } from '../adapters/interface.js';

/** Meilisearch backend identifier. */
export const BACKEND_MEILISEARCH: HybridSearchBackend = 'meilisearch';

/** Typesense backend identifier. */
export const BACKEND_TYPESENSE: HybridSearchBackend = 'typesense';

/** Both backends — used by the matrix harness to walk every combo. */
export const DEFAULT_BACKENDS: readonly HybridSearchBackend[] = [
  BACKEND_MEILISEARCH,
  BACKEND_TYPESENSE,
];

/**
 * Provider parity helper — determine whether a backend supports the
 * kNN + hybrid fusion combination we exercise in this dogfood. Both
 * meilisearch v1.x and typesense do, so the helper always returns true
 * for the current set; kept as a function so future backend additions
 * can express partial support.
 */
export function supportsHybridKnn(backend: HybridSearchBackend): boolean {
  return backend === BACKEND_MEILISEARCH || backend === BACKEND_TYPESENSE;
}
