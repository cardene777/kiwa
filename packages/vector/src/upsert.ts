import type { VectorClient, VectorRecord, UpsertResult } from './client.js';

export interface UpsertVectorsResult extends UpsertResult {
  batchCount: number;
  attempted: number;
}

/**
 * batch upsert helper — 大量 record を chunk に分けて upsert し、 合計結果を返す。
 * real provider (Pinecone / Weaviate / Qdrant) の batch size 制限 (100 前後) を再現。
 */
export async function upsertVectors(
  client: VectorClient,
  vectors: VectorRecord[],
  options: { batchSize?: number } = {},
): Promise<UpsertVectorsResult> {
  const batchSize = options.batchSize ?? 100;
  let upsertedCount = 0;
  let batchCount = 0;
  for (let i = 0; i < vectors.length; i += batchSize) {
    const chunk = vectors.slice(i, i + batchSize);
    const res = await client.upsert(chunk);
    upsertedCount += res.upsertedCount;
    batchCount += 1;
  }
  return {
    upsertedCount,
    batchCount,
    attempted: vectors.length,
    provider: client.provider,
    namespace: client.namespace,
  };
}
