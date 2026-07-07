import {
  providerEventName,
  type NeutralEventName,
  type SearchAxis,
  type SearchTarget,
} from './types.js';

export interface FidelityRow {
  provider: SearchTarget;
  axis: SearchAxis;
  neutralEvents: NeutralEventName[];
  providerEvents: string[];
}

export interface FidelityCoverage {
  providers: SearchTarget[];
  axes: SearchAxis[];
  rows: FidelityRow[];
}

export const SEARCH_AXIS_TO_EVENTS: Record<SearchAxis, NeutralEventName[]> = {
  vector: [
    'vector.index_built',
    'vector.knn_queried',
    'vector.hybrid_fused',
    'vector.ann_recalled',
  ],
  semantic: [
    'semantic.query_understood',
    'semantic.intent_classified',
    'semantic.cross_encoder_reranked',
    'semantic.embedding_cached',
  ],
  'faceted-advanced': [
    'facet.nested_computed',
    'facet.hierarchy_traversed',
    'facet.distinct_counted',
    'facet.refined_filter_applied',
  ],
  geo: [
    'geo.bounding_box_filtered',
    'geo.radius_filtered',
    'geo.polygon_filtered',
    'geo.isochrone_resolved',
  ],
  relevance: [
    'relevance.bm25_scored',
    'relevance.tfidf_scored',
    'relevance.custom_ranking_applied',
    'relevance.ab_variant_selected',
  ],
  'synonym-advanced': [
    'synonym.multi_language_expanded',
    'synonym.phonetic_matched',
    'synonym.stemmer_normalized',
    'synonym.typo_bridged',
  ],
  'index-management': [
    'index.shard_allocated',
    'index.replica_promoted',
    'index.rolling_reindex_advanced',
    'index.zero_downtime_swapped',
  ],
  'query-dsl': [
    'query.boolean_tree_evaluated',
    'query.nested_resolved',
    'query.histogram_bucketed',
    'query.percentile_computed',
  ],
};

export function collectFidelityCoverage(
  providers: SearchTarget[] = ['meilisearch', 'typesense', 'algolia', 'opensearch-oss'],
): FidelityCoverage {
  const axes = Object.keys(SEARCH_AXIS_TO_EVENTS) as SearchAxis[];
  const rows: FidelityRow[] = [];
  for (const provider of providers) {
    for (const axis of axes) {
      const neutralEvents = SEARCH_AXIS_TO_EVENTS[axis];
      const providerEvents = neutralEvents.map((event) => providerEventName(provider, event));
      rows.push({ provider, axis, neutralEvents, providerEvents });
    }
  }
  return { providers, axes, rows };
}
