/**
 * Public surface for dogfood-search-opensearch-app v0.0.1 (v1.36-4).
 *
 * A dogfood app that drives the `@kiwa-test/search` v0.3 relevance +
 * synonym-advanced + index-management axes (start relevance session →
 * seed docs → BM25 / TF-IDF / custom rank / A/B variant → start
 * synonym session → register synonyms → expand / phonetic / stemmer /
 * typo → start index-mgmt session → allocate shards → promote replica
 * → rolling reindex → zero-downtime swap → fidelity signal → cluster
 * health check → reset) behind a provider-neutral 17-op contract,
 * satisfied by both a deterministic mock adapter and a `KIWA_MODE=real`
 * OpenSearch OSS wire-surface real adapter. The fidelity harness diffs
 * both traces and feeds the divergence count into the
 * `@kiwa-test/quality-metrics` 13-axis release gate.
 */

export { makeMockAdapter } from './adapters/mock.js';
export { makeRealAdapter, type RealAdapterConfig } from './adapters/real.js';
export {
  KIWA_SEARCH_ENV_MISSING,
  OPENSEARCH_HARNESS_OPS,
  type AdvanceRollingReindexResult,
  type AllocateShardsResult,
  type ApplyCustomRankingResult,
  type BridgeTypoResult,
  type EmitFidelitySignalInput,
  type EmitFidelitySignalResult,
  type ExpandMultiLanguageResult,
  type HealthCheckResult,
  type Language,
  type MatchPhoneticResult,
  type NormalizeStemmerResult,
  type OpenSearchAdapter,
  type OpenSearchBackend,
  type OpenSearchHarnessOp,
  type PromoteReplicaResult,
  type RelevanceDocument,
  type ScoreBm25Result,
  type ScoreTfIdfResult,
  type ScoredHit,
  type SearchTarget,
  type SeedRelevanceDocumentsResult,
  type SelectAbVariantResult,
  type StartIndexMgmtSessionInput,
  type StartIndexMgmtSessionResult,
  type StartRelevanceSessionInput,
  type StartRelevanceSessionResult,
  type StartSynonymSessionInput,
  type StartSynonymSessionResult,
  type SwapZeroDowntimeResult,
  type SynonymEntry,
  type TraceEvent,
} from './adapters/interface.js';

export {
  BACKEND_OPENSEARCH,
  DEFAULT_BACKENDS,
  supportsRelevanceSynonymIndex,
} from './policies/backends.js';

export {
  ALL_FIXTURES,
  FIXTURE_ARTICLES,
  FIXTURE_CLUSTER,
  FIXTURE_MULTILINGUAL,
  type ClusterStepFixture,
  type FixtureSet,
  type RelevanceQueryFixture,
  type SynonymQueryFixture,
} from './policies/query-fixtures.js';

export {
  OPS_UNDER_TEST,
  diffTraces,
  driveFullMatrix,
  driveIndexMgmtLifecycle,
  driveOpenSearchLifecycle,
  driveRelevanceLifecycle,
  driveSynonymLifecycle,
  type LifecycleInput,
} from './flows/search-flows.js';

export {
  runAdapterMatrix,
  runFidelityHarness,
  type FidelityRunInput,
  type FidelityRunOutput,
} from './flows/fidelity.js';
