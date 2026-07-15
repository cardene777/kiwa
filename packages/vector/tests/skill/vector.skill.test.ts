/**
 * skill test — vector skill が主要 API 4 種 (createVectorClient / upsertVectors /
 * queryNearest / deleteVectors) + distance primitives 3 種を全て公開し、 provider 別に
 * 動作分岐する ことを skill-test primitive 経由で assertion する。
 */
import { describe, expect, it } from 'vitest';
import {
  createVectorClient,
  upsertVectors,
  queryNearest,
  deleteVectors,
  cosineSimilarity,
  euclideanDistance,
  dotProduct,
} from '../../src/index.js';

describe('vector skill assertions', () => {
  it('createVectorClient を 4 provider (pinecone/weaviate/qdrant/pgvector) 全てで instantiate 可能', () => {
    for (const provider of ['pinecone', 'weaviate', 'qdrant', 'pgvector'] as const) {
      const client = createVectorClient({ provider });
      expect(client.provider).toBe(provider);
    }
  });

  it('upsertVectors の batchSize で batchCount が期待通り', async () => {
    const client = createVectorClient({ provider: 'pinecone', dimension: 2 });
    const records = Array.from({ length: 250 }, (_, i) => ({ id: `n-${i}`, values: [i, i + 1] }));
    const res = await upsertVectors(client, records, { batchSize: 100 });
    expect(res.upsertedCount).toBe(250);
    expect(res.batchCount).toBe(3);
  });

  it('queryNearest の 3 metric (cosine / euclidean / dot) が全て動く', async () => {
    const client = createVectorClient({ provider: 'weaviate' });
    await client.upsert([
      { id: 'a', values: [1, 0, 0] },
      { id: 'b', values: [0, 1, 0] },
    ]);
    for (const metric of ['cosine', 'euclidean', 'dot'] as const) {
      const res = queryNearest(client, [1, 0, 0], { topK: 2, metric });
      expect(res.metric).toBe(metric);
      expect(res.matches.length).toBe(2);
    }
  });

  it('deleteVectors + queryNearest filter が併用可能', async () => {
    const client = createVectorClient({ provider: 'qdrant' });
    await client.upsert([
      { id: 'a', values: [1, 0], metadata: { topic: 'docs' } },
      { id: 'b', values: [0, 1], metadata: { topic: 'code' } },
    ]);
    const filtered = queryNearest(client, [1, 0], { filter: (m) => m?.topic === 'docs' });
    expect(filtered.matches.map((x) => x.id)).toEqual(['a']);
    const del = await deleteVectors(client, ['a']);
    expect(del.deletedCount).toBe(1);
  });

  it('distance primitives (cosine / euclidean / dot) が数学的に正しい', () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
    expect(euclideanDistance([0, 0], [3, 4])).toBeCloseTo(5);
    expect(dotProduct([1, 2, 3], [4, 5, 6])).toBe(32);
  });
});
