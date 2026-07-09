/**
 * Public surface for dogfood-search-vector-app v0.0.1 (v1.36-2).
 *
 * A dogfood app that drives the `@kiwa-lab/search` v0.3 vector +
 * semantic axes (index build → k-NN query → semantic query understand
 * → intent classify → cross-encoder rerank → embedding cache → hybrid
 * vector+keyword fuse → recall@k → fidelity signal → Meilisearch /
 * Typesense health check → reset) behind a provider-neutral 14-op
 * contract, satisfied by both a deterministic mock adapter and a
 * `KIWA_MODE=real` Meilisearch + Typesense wire-surface real adapter.
 * The fidelity harness diffs both traces and feeds the divergence count
 * into the `@kiwa-lab/quality-metrics` 13-axis release gate.
 */

export { makeMockAdapter } from './adapters/mock.js';
export { makeRealAdapter, type RealAdapterConfig } from './adapters/real.js';
export {
  KIWA_SEARCH_ENV_MISSING,
  SEARCH_HYBRID_HARNESS_OPS,
  type AddVectorsResult,
  type CacheEmbeddingResult,
  type ClassifyIntentResult,
  type CrossEncoderRerankResult,
  type EmitFidelitySignalInput,
  type EmitFidelitySignalResult,
  type FuseHybridResult,
  type HealthCheckResult,
  type HybridSearchBackend,
  type HybridWeights,
  type KnnHit,
  type KnnQueryResult,
  type RecallAnnInput,
  type RecallAnnResult,
  type RerankCandidate,
  type RerankedHit,
  type SearchHybridAdapter,
  type SearchHybridHarnessOp,
  type SearchTarget,
  type SemanticIntent,
  type StartSemanticSessionInput,
  type StartSemanticSessionResult,
  type StartVectorIndexInput,
  type StartVectorIndexResult,
  type TraceEvent,
  type UnderstandQueryResult,
  type VectorAlgo,
  type VectorEntry,
} from './adapters/interface.js';

export {
  ALL_HYBRID_CONFIGS,
  HYBRID_BALANCED,
  HYBRID_KEYWORD_HEAVY,
  HYBRID_KEYWORD_ONLY,
  HYBRID_VECTOR_HEAVY,
  HYBRID_VECTOR_ONLY,
  type HybridConfig,
} from './policies/hybrid-configs.js';

export {
  BACKEND_MEILISEARCH,
  BACKEND_TYPESENSE,
  DEFAULT_BACKENDS,
  supportsHybridKnn,
} from './policies/backends.js';

export {
  ALL_FIXTURES,
  FIXTURE_HYBRID_FUSION,
  FIXTURE_SEMANTIC_INTENT,
  FIXTURE_VECTOR_RECALL,
  type FixtureSet,
  type QueryFixture,
} from './policies/query-fixtures.js';

export {
  OPS_UNDER_TEST,
  diffTraces,
  driveFullMatrix,
  driveHybridSearchLifecycle,
  driveSemanticLifecycle,
  driveVectorLifecycle,
  type LifecycleInput,
} from './flows/search-flows.js';

export {
  runAdapterMatrix,
  runFidelityHarness,
  type FidelityRunInput,
  type FidelityRunOutput,
} from './flows/fidelity.js';
