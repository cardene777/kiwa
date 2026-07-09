/**
 * The 1 canonical OpenSearch OSS backend the dogfood app targets.
 *
 * OpenSearch OSS is the backend the AC anchors this v1.36-4 dogfood on
 * — OpenSearch's production HTTP API ships native BM25 + custom
 * ranking (script scoring / function score) + multi-analyzer (stemmer
 * + phonetic + fuzzy) + rolling reindex + alias swap that are the
 * reference implementation the `@kiwa-lab/search` v0.3 relevance +
 * synonym-advanced + index-management axes were designed to match.
 * Meilisearch / Typesense / Algolia are covered by sibling apps in the
 * v1.36-2 / v1.36-3 releases.
 */

import type { OpenSearchBackend } from '../adapters/interface.js';

/** OpenSearch OSS backend identifier. */
export const BACKEND_OPENSEARCH: OpenSearchBackend = 'opensearch-oss';

/** The single backend the dogfood app targets. */
export const DEFAULT_BACKENDS: readonly OpenSearchBackend[] = [BACKEND_OPENSEARCH];

/**
 * Provider parity helper — determine whether a backend supports the
 * relevance + synonym + index-management combination we exercise in
 * this dogfood. OpenSearch OSS does, so the helper returns true for the
 * current set; kept as a function so future backend additions can
 * express partial support.
 */
export function supportsRelevanceSynonymIndex(backend: OpenSearchBackend): boolean {
  return backend === BACKEND_OPENSEARCH;
}
