import { cosineSimilarity, dotProduct, euclideanDistance } from './distance.js';
import type { VectorClient, VectorMetadata, VectorRecord } from './client.js';

export type DistanceMetric = 'cosine' | 'euclidean' | 'dot';

export interface QueryOptions {
  topK?: number;
  metric?: DistanceMetric;
  filter?: (metadata: VectorMetadata | undefined) => boolean;
  includeValues?: boolean;
}

export interface QueryMatch {
  id: string;
  score: number;
  metadata?: VectorMetadata;
  values?: number[];
}

export interface QueryResult {
  matches: QueryMatch[];
  namespace: string;
  metric: DistanceMetric;
}

export interface DeleteResult {
  deletedCount: number;
  requestedCount: number;
  namespace: string;
}

/**
 * similarity search — provider に応じた metric (cosine default) で topK match を返す。
 * cosine / dot = 高いほど近い、 euclidean = 小さいほど近い、 の semantics に合わせて sort。
 */
export function queryNearest(
  client: VectorClient,
  query: number[],
  options: QueryOptions = {},
): QueryResult {
  const topK = options.topK ?? 10;
  const metric = options.metric ?? 'cosine';
  const filter = options.filter;
  const includeValues = options.includeValues ?? false;

  const scored: QueryMatch[] = [];
  for (const rec of client.list()) {
    if (filter && !filter(rec.metadata)) continue;
    let score: number;
    if (metric === 'cosine') score = cosineSimilarity(query, rec.values);
    else if (metric === 'dot') score = dotProduct(query, rec.values);
    else score = euclideanDistance(query, rec.values);
    const match: QueryMatch = { id: rec.id, score };
    if (rec.metadata !== undefined) match.metadata = rec.metadata;
    if (includeValues) match.values = rec.values;
    scored.push(match);
  }

  scored.sort((a, b) => (metric === 'euclidean' ? a.score - b.score : b.score - a.score));

  return {
    matches: scored.slice(0, topK),
    namespace: client.namespace,
    metric,
  };
}

export async function deleteVectors(client: VectorClient, ids: string[]): Promise<DeleteResult> {
  const deletedCount = client._delete(ids);
  return {
    deletedCount,
    requestedCount: ids.length,
    namespace: client.namespace,
  };
}
