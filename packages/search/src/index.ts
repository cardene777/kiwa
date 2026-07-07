export type {
  SearchAdapter,
  SearchDocument,
  SearchHit,
  SearchProvider,
  SearchQuery,
  SearchResult,
} from './types.js';
export { SearchEngine, type EngineConfig } from './engine.js';
export { createMeilisearchMock } from './meilisearch.js';
export { createAlgoliaMock } from './algolia.js';
export { createTypesenseMock } from './typesense.js';

export * as semantics from './semantics/index.js';
export {
  apiKeyEnvVar,
  buildRealDriverConfig,
  explicitEnvKey,
  isKiwaModeReal,
  resolveApiKey,
  resolveSearchEndpoint,
  skipUnlessReal,
  type RealDriverConfig,
  type SearchBackend,
} from './real-driver.js';
