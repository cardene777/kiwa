export {
  providerEventName,
  type AxisStep,
  type NeutralEventName,
  type SearchAxis,
  type SearchTarget,
} from './types.js';

export {
  buildVectorIndex,
  fuseHybrid,
  queryKnn,
  recallAnn,
  startVectorSession,
  type KnnHit,
  type VectorAlgo,
  type VectorSession,
  type VectorState,
} from './vector.js';

export {
  cacheEmbedding,
  classifyIntent,
  crossEncoderRerank,
  startSemanticSession,
  understandQuery,
  type Intent,
  type RerankCandidate,
  type RerankedHit,
  type SemanticSession,
  type SemanticState,
} from './semantic.js';

export {
  applyRefinedFilter,
  computeNestedFacets,
  countDistinct,
  seedFacetedDocuments,
  startFacetedSession,
  traverseHierarchy,
  type FacetedDocument,
  type FacetedSession,
  type FacetedState,
  type NestedFacetNode,
} from './faceted-advanced.js';

export {
  filterBoundingBox,
  filterPolygon,
  filterRadius,
  resolveIsochrone,
  seedGeoDocuments,
  startGeoSession,
  type BoundingBox,
  type GeoDocument,
  type GeoSession,
  type GeoState,
  type Polygon,
} from './geo.js';

export {
  applyCustomRanking,
  scoreBm25,
  scoreTfIdf,
  seedRelevanceDocuments,
  selectAbVariant,
  startRelevanceSession,
  type RelevanceDocument,
  type RelevanceSession,
  type RelevanceState,
  type ScoredHit,
} from './relevance.js';

export {
  bridgeTypo,
  expandMultiLanguage,
  matchPhonetic,
  normalizeStemmer,
  registerSynonyms,
  startSynonymSession,
  type Language,
  type SynonymEntry,
  type SynonymSession,
  type SynonymState,
} from './synonym-advanced.js';

export {
  advanceRollingReindex,
  allocateShards,
  promoteReplica,
  startIndexMgmtSession,
  swapZeroDowntime,
  type IndexMgmtSession,
  type IndexMgmtState,
  type ShardAssignment,
} from './index-management.js';

export {
  bucketHistogram,
  computePercentile,
  evaluateBooleanTree,
  resolveNestedQuery,
  seedQueryDslDocuments,
  startQueryDslSession,
  type BooleanClause,
  type BooleanKind,
  type LeafClause,
  type LeafOp,
  type QueryClause,
  type QueryDslDocument,
  type QueryDslSession,
  type QueryDslState,
} from './query-dsl.js';

export {
  SEARCH_AXIS_TO_EVENTS,
  collectFidelityCoverage,
  type FidelityCoverage,
  type FidelityRow,
} from './fidelity.js';
