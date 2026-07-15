/**
 * integration test — vector domain の end-to-end workflow (upsert → query → delete → verify)
 * を 5 case で cover。 RAG pipeline / provider 別 / filter / namespace 分離までを網羅。
 */
import { describe, expect, it } from 'vitest';
import {
  createVectorClient,
  upsertVectors,
  queryNearest,
  deleteVectors,
} from '../../src/index.js';

describe('vector integration — upsert → query → delete workflow', () => {
  it('T-INT-V-001 RAG pipeline: upsert 5 docs → query top 2 → delete → re-query 0', async () => {
    const client = createVectorClient({ provider: 'pinecone', dimension: 3 });
    await upsertVectors(client, [
      { id: 'd1', values: [1, 0, 0], metadata: { doc: 'a' } },
      { id: 'd2', values: [0.9, 0.1, 0], metadata: { doc: 'b' } },
      { id: 'd3', values: [0, 1, 0], metadata: { doc: 'c' } },
      { id: 'd4', values: [0, 0, 1], metadata: { doc: 'd' } },
      { id: 'd5', values: [0.5, 0.5, 0], metadata: { doc: 'e' } },
    ]);
    const q = queryNearest(client, [1, 0, 0], { topK: 2 });
    expect(q.matches.length).toBe(2);
    expect(q.matches[0]!.id).toBe('d1');
    const del = await deleteVectors(client, ['d1', 'd2']);
    expect(del.deletedCount).toBe(2);
    expect(client.size()).toBe(3);
  });

  it('T-INT-V-002 batch upsert 500 records は 5 batch (size=100) に分割', async () => {
    const client = createVectorClient({ provider: 'weaviate', dimension: 4 });
    const records = Array.from({ length: 500 }, (_, i) => ({ id: `r-${i}`, values: [i, i + 1, i + 2, i + 3] }));
    const res = await upsertVectors(client, records, { batchSize: 100 });
    expect(res.upsertedCount).toBe(500);
    expect(res.batchCount).toBe(5);
    expect(client.size()).toBe(500);
  });

  it('T-INT-V-003 provider 別 namespace が独立 store を持つ', async () => {
    const a = createVectorClient({ provider: 'qdrant', namespace: 'ns-a' });
    const b = createVectorClient({ provider: 'qdrant', namespace: 'ns-b' });
    await a.upsert([{ id: '1', values: [1, 2] }]);
    expect(a.size()).toBe(1);
    expect(b.size()).toBe(0);
  });

  it('T-INT-V-004 metadata filter で subset のみ検索対象', async () => {
    const client = createVectorClient({ provider: 'pgvector' });
    await client.upsert([
      { id: 'a', values: [1, 0], metadata: { lang: 'en' } },
      { id: 'b', values: [0.9, 0.1], metadata: { lang: 'ja' } },
      { id: 'c', values: [0.8, 0.2], metadata: { lang: 'en' } },
    ]);
    const q = queryNearest(client, [1, 0], { filter: (m) => m?.lang === 'en', topK: 5 });
    expect(q.matches.map((x) => x.id).sort()).toEqual(['a', 'c']);
  });

  it('T-INT-V-005 dimension mismatch が upsert 段階で throw', async () => {
    const client = createVectorClient({ provider: 'pinecone', dimension: 4 });
    await expect(client.upsert([{ id: 'bad', values: [1, 2] }])).rejects.toThrow(/dimension mismatch/);
    expect(client.size()).toBe(0);
  });
});
