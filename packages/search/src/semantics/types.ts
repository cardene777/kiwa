/**
 * Advanced search semantics — provider-neutral axis SSOT (v0.3).
 *
 * Model 4 canonical search provider targets as pure state machines so kiwa
 * fixture tests can assert on a neutral event name while still observing a
 * provider-specific dialect through providerEventName.
 *
 * Provider targets:
 * - meilisearch ... Meilisearch v1.x (typo tolerance + facet distribution + geo)
 * - typesense ... Typesense (schema-first + hybrid vector + curation)
 * - algolia ... Algolia (BM25 + custom ranking + A/B testing + query rules)
 * - opensearch-oss ... OpenSearch OSS (BM25 + kNN + aggregation + index template)
 *
 * Axes (8):
 * - vector ... embedding + kNN + HNSW + IVF + hybrid (dense + sparse)
 * - semantic ... cross-encoder reranking + query understanding + intent classification
 * - faceted-advanced ... nested facet + hierarchy + distinct + tree traversal
 * - geo ... bounding box + radius + polygon + travel-time isochrone
 * - relevance ... BM25 + TF-IDF + custom ranking + boosting + A/B testing
 * - synonym-advanced ... multi-language stemmer + phonetic + fuzzy + typo tolerance
 * - index-management ... sharding + replica + rolling reindex + zero-downtime migration
 * - query-dsl ... nested query + boolean tree + histogram / percentile / cardinality
 */

export type SearchTarget = 'meilisearch' | 'typesense' | 'algolia' | 'opensearch-oss';

export type SearchAxis =
  | 'vector'
  | 'semantic'
  | 'faceted-advanced'
  | 'geo'
  | 'relevance'
  | 'synonym-advanced'
  | 'index-management'
  | 'query-dsl';

export type NeutralEventName =
  // vector
  | 'vector.index_built'
  | 'vector.knn_queried'
  | 'vector.hybrid_fused'
  | 'vector.ann_recalled'
  // semantic
  | 'semantic.query_understood'
  | 'semantic.intent_classified'
  | 'semantic.cross_encoder_reranked'
  | 'semantic.embedding_cached'
  // faceted-advanced
  | 'facet.nested_computed'
  | 'facet.hierarchy_traversed'
  | 'facet.distinct_counted'
  | 'facet.refined_filter_applied'
  // geo
  | 'geo.bounding_box_filtered'
  | 'geo.radius_filtered'
  | 'geo.polygon_filtered'
  | 'geo.isochrone_resolved'
  // relevance
  | 'relevance.bm25_scored'
  | 'relevance.tfidf_scored'
  | 'relevance.custom_ranking_applied'
  | 'relevance.ab_variant_selected'
  // synonym-advanced
  | 'synonym.multi_language_expanded'
  | 'synonym.phonetic_matched'
  | 'synonym.stemmer_normalized'
  | 'synonym.typo_bridged'
  // index-management
  | 'index.shard_allocated'
  | 'index.replica_promoted'
  | 'index.rolling_reindex_advanced'
  | 'index.zero_downtime_swapped'
  // query-dsl
  | 'query.boolean_tree_evaluated'
  | 'query.nested_resolved'
  | 'query.histogram_bucketed'
  | 'query.percentile_computed';

export interface AxisStep<TState extends string> {
  neutralEvent: NeutralEventName;
  providerEvent: string;
  state: TState;
  timestampMs: number;
  metadata: Record<string, string | number | boolean>;
}

const dialect: Record<SearchTarget, Partial<Record<NeutralEventName, string>>> = {
  meilisearch: {
    'vector.index_built': 'meili.vector.index.build',
    'vector.knn_queried': 'meili.vector.knn.query',
    'vector.hybrid_fused': 'meili.hybrid.fuse',
    'vector.ann_recalled': 'meili.vector.ann.recall',
    'semantic.query_understood': 'meili.query.understand',
    'semantic.intent_classified': 'meili.query.intent',
    'semantic.cross_encoder_reranked': 'meili.rerank.cross_encoder',
    'semantic.embedding_cached': 'meili.embedding.cache',
    'facet.nested_computed': 'meili.facet.nested',
    'facet.hierarchy_traversed': 'meili.facet.hierarchy',
    'facet.distinct_counted': 'meili.facet.distinct',
    'facet.refined_filter_applied': 'meili.facet.refined',
    'geo.bounding_box_filtered': 'meili.geo.bbox',
    'geo.radius_filtered': 'meili.geo.radius',
    'geo.polygon_filtered': 'meili.geo.polygon',
    'geo.isochrone_resolved': 'meili.geo.isochrone',
    'relevance.bm25_scored': 'meili.rank.bm25',
    'relevance.tfidf_scored': 'meili.rank.tfidf',
    'relevance.custom_ranking_applied': 'meili.rank.custom',
    'relevance.ab_variant_selected': 'meili.experiment.variant',
    'synonym.multi_language_expanded': 'meili.synonym.multilang',
    'synonym.phonetic_matched': 'meili.synonym.phonetic',
    'synonym.stemmer_normalized': 'meili.stemmer.normalize',
    'synonym.typo_bridged': 'meili.typo.bridge',
    'index.shard_allocated': 'meili.index.shard.allocate',
    'index.replica_promoted': 'meili.index.replica.promote',
    'index.rolling_reindex_advanced': 'meili.index.rolling.advance',
    'index.zero_downtime_swapped': 'meili.index.swap.zero_downtime',
    'query.boolean_tree_evaluated': 'meili.query.bool.eval',
    'query.nested_resolved': 'meili.query.nested.resolve',
    'query.histogram_bucketed': 'meili.aggregation.histogram',
    'query.percentile_computed': 'meili.aggregation.percentile',
  },
  typesense: {
    'vector.index_built': 'typesense.vector.index',
    'vector.knn_queried': 'typesense.vector.knn',
    'vector.hybrid_fused': 'typesense.hybrid.fuse',
    'vector.ann_recalled': 'typesense.vector.ann',
    'semantic.query_understood': 'typesense.query.understand',
    'semantic.intent_classified': 'typesense.query.intent',
    'semantic.cross_encoder_reranked': 'typesense.rerank.cross',
    'semantic.embedding_cached': 'typesense.embedding.cache',
    'facet.nested_computed': 'typesense.facet.nested',
    'facet.hierarchy_traversed': 'typesense.facet.hierarchy',
    'facet.distinct_counted': 'typesense.facet.distinct',
    'facet.refined_filter_applied': 'typesense.facet.refined',
    'geo.bounding_box_filtered': 'typesense.geo.bbox',
    'geo.radius_filtered': 'typesense.geo.radius',
    'geo.polygon_filtered': 'typesense.geo.polygon',
    'geo.isochrone_resolved': 'typesense.geo.isochrone',
    'relevance.bm25_scored': 'typesense.rank.bm25',
    'relevance.tfidf_scored': 'typesense.rank.tfidf',
    'relevance.custom_ranking_applied': 'typesense.rank.custom',
    'relevance.ab_variant_selected': 'typesense.experiment.variant',
    'synonym.multi_language_expanded': 'typesense.synonym.multilang',
    'synonym.phonetic_matched': 'typesense.synonym.phonetic',
    'synonym.stemmer_normalized': 'typesense.stemmer.normalize',
    'synonym.typo_bridged': 'typesense.typo.bridge',
    'index.shard_allocated': 'typesense.collection.shard',
    'index.replica_promoted': 'typesense.collection.replica.promote',
    'index.rolling_reindex_advanced': 'typesense.collection.rolling',
    'index.zero_downtime_swapped': 'typesense.collection.alias.swap',
    'query.boolean_tree_evaluated': 'typesense.query.bool.eval',
    'query.nested_resolved': 'typesense.query.nested.resolve',
    'query.histogram_bucketed': 'typesense.aggregation.histogram',
    'query.percentile_computed': 'typesense.aggregation.percentile',
  },
  algolia: {
    'vector.index_built': 'algolia.vector.build',
    'vector.knn_queried': 'algolia.vector.knn',
    'vector.hybrid_fused': 'algolia.neuralsearch.fuse',
    'vector.ann_recalled': 'algolia.vector.recall',
    'semantic.query_understood': 'algolia.nlu.understand',
    'semantic.intent_classified': 'algolia.nlu.intent',
    'semantic.cross_encoder_reranked': 'algolia.rerank.neural',
    'semantic.embedding_cached': 'algolia.embedding.cache',
    'facet.nested_computed': 'algolia.facet.nested',
    'facet.hierarchy_traversed': 'algolia.facet.hierarchical',
    'facet.distinct_counted': 'algolia.facet.distinct',
    'facet.refined_filter_applied': 'algolia.facet.refined',
    'geo.bounding_box_filtered': 'algolia.geo.bbox',
    'geo.radius_filtered': 'algolia.geo.radius',
    'geo.polygon_filtered': 'algolia.geo.polygon',
    'geo.isochrone_resolved': 'algolia.geo.isochrone',
    'relevance.bm25_scored': 'algolia.rank.bm25',
    'relevance.tfidf_scored': 'algolia.rank.tfidf',
    'relevance.custom_ranking_applied': 'algolia.rank.custom',
    'relevance.ab_variant_selected': 'algolia.ab.variant',
    'synonym.multi_language_expanded': 'algolia.synonym.multilang',
    'synonym.phonetic_matched': 'algolia.synonym.phonetic',
    'synonym.stemmer_normalized': 'algolia.stemmer.normalize',
    'synonym.typo_bridged': 'algolia.typo.bridge',
    'index.shard_allocated': 'algolia.index.shard.allocate',
    'index.replica_promoted': 'algolia.index.replica.promote',
    'index.rolling_reindex_advanced': 'algolia.index.rolling.advance',
    'index.zero_downtime_swapped': 'algolia.index.atomic.replace',
    'query.boolean_tree_evaluated': 'algolia.query.bool.eval',
    'query.nested_resolved': 'algolia.query.nested.resolve',
    'query.histogram_bucketed': 'algolia.aggregation.histogram',
    'query.percentile_computed': 'algolia.aggregation.percentile',
  },
  'opensearch-oss': {
    'vector.index_built': 'opensearch.knn.index.build',
    'vector.knn_queried': 'opensearch.knn.query',
    'vector.hybrid_fused': 'opensearch.hybrid.fuse',
    'vector.ann_recalled': 'opensearch.knn.recall',
    'semantic.query_understood': 'opensearch.ml.query.understand',
    'semantic.intent_classified': 'opensearch.ml.intent',
    'semantic.cross_encoder_reranked': 'opensearch.ml.rerank',
    'semantic.embedding_cached': 'opensearch.ml.embedding.cache',
    'facet.nested_computed': 'opensearch.agg.nested',
    'facet.hierarchy_traversed': 'opensearch.agg.hierarchy',
    'facet.distinct_counted': 'opensearch.agg.cardinality',
    'facet.refined_filter_applied': 'opensearch.agg.refined',
    'geo.bounding_box_filtered': 'opensearch.geo.bbox',
    'geo.radius_filtered': 'opensearch.geo.distance',
    'geo.polygon_filtered': 'opensearch.geo.polygon',
    'geo.isochrone_resolved': 'opensearch.geo.isochrone',
    'relevance.bm25_scored': 'opensearch.rank.bm25',
    'relevance.tfidf_scored': 'opensearch.rank.tfidf',
    'relevance.custom_ranking_applied': 'opensearch.rank.custom',
    'relevance.ab_variant_selected': 'opensearch.experiment.variant',
    'synonym.multi_language_expanded': 'opensearch.analyzer.multilang',
    'synonym.phonetic_matched': 'opensearch.analyzer.phonetic',
    'synonym.stemmer_normalized': 'opensearch.analyzer.stemmer',
    'synonym.typo_bridged': 'opensearch.fuzzy.bridge',
    'index.shard_allocated': 'opensearch.cluster.shard.allocate',
    'index.replica_promoted': 'opensearch.cluster.replica.promote',
    'index.rolling_reindex_advanced': 'opensearch.reindex.rolling.advance',
    'index.zero_downtime_swapped': 'opensearch.alias.swap',
    'query.boolean_tree_evaluated': 'opensearch.query.bool.eval',
    'query.nested_resolved': 'opensearch.query.nested.resolve',
    'query.histogram_bucketed': 'opensearch.aggregation.histogram',
    'query.percentile_computed': 'opensearch.aggregation.percentile',
  },
};

export function providerEventName(target: SearchTarget, neutral: NeutralEventName): string {
  return dialect[target][neutral] ?? neutral;
}
