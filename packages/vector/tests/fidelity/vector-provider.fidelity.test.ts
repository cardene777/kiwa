/**
 * fidelity test — createVectorClient (kiwa mock) が reference impl と同じ挙動を示すことを検証。
 * 5 case で upsert / query / delete / dimension check / provider 差異 の 5 観点を cover。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { createVectorClient, queryNearest, deleteVectors, cosineSimilarity } from '../../src/index.js';

function referenceVectorStore() {
  const store = new Map<string, { id: string; values: number[] }>();
  return {
    async upsert(recs: Array<{ id: string; values: number[] }>) {
      for (const r of recs) store.set(r.id, r);
      return { upsertedCount: recs.length };
    },
    async fetch(id: string) {
      return store.get(id) ?? null;
    },
    query(q: number[], topK: number) {
      const scored = Array.from(store.values()).map((r) => ({ id: r.id, score: cosineSimilarity(q, r.values) }));
      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, topK);
    },
    delete(ids: string[]) {
      let c = 0;
      for (const id of ids) if (store.delete(id)) c += 1;
      return c;
    },
  };
}

describe('vector client fidelity vs reference impl', () => {
  it('upsert api = 全 record が upsertedCount に反映される', async () => {
    const mock = createVectorClient({ provider: 'pinecone', dimension: 4 });
    const real = referenceVectorStore();
    const result = await assertFidelity({
      mockFn: async (n: number) => {
        const recs = Array.from({ length: n }, (_, i) => ({ id: `k-${i}`, values: [i, i + 1, i + 2, i + 3] }));
        const r = await mock.upsert(recs);
        return r.upsertedCount;
      },
      realFn: async (n: number) => {
        const recs = Array.from({ length: n }, (_, i) => ({ id: `k-${i}`, values: [i, i + 1, i + 2, i + 3] }));
        const r = await real.upsert(recs);
        return r.upsertedCount;
      },
      cases: [{ name: 'upsert 5', args: [5] }],
    });
    expect(result.ratio).toBe(100);
  });

  it('queryNearest 上位 3 件が reference と一致 (cosine sort)', async () => {
    const mock = createVectorClient({ provider: 'weaviate', dimension: 4 });
    const real = referenceVectorStore();
    const recs = [
      { id: 'a', values: [1, 0, 0, 0] },
      { id: 'b', values: [0.9, 0.1, 0, 0] },
      { id: 'c', values: [0, 1, 0, 0] },
      { id: 'd', values: [0, 0, 1, 0] },
    ];
    await mock.upsert(recs);
    await real.upsert(recs);
    const q = [1, 0, 0, 0];
    const mockOut = queryNearest(mock, q, { topK: 3, metric: 'cosine' }).matches.map((m) => m.id);
    const realOut = real.query(q, 3).map((m) => m.id);
    expect(mockOut).toEqual(realOut);
  });

  it('deleteVectors で指定 id 群が store から消える', async () => {
    const mock = createVectorClient({ provider: 'qdrant' });
    await mock.upsert([
      { id: 'x1', values: [1, 2] },
      { id: 'x2', values: [3, 4] },
      { id: 'x3', values: [5, 6] },
    ]);
    const res = await deleteVectors(mock, ['x1', 'x3']);
    expect(res.deletedCount).toBe(2);
    expect(mock.size()).toBe(1);
    expect((await mock.fetch('x2'))?.id).toBe('x2');
  });

  it('dimension mismatch を throw する', async () => {
    const mock = createVectorClient({ provider: 'pinecone', dimension: 3 });
    await expect(mock.upsert([{ id: 'bad', values: [1, 2] }])).rejects.toThrow(/dimension mismatch/);
  });

  it('provider 差異 = namespace / provider field に反映される', async () => {
    const p = createVectorClient({ provider: 'pinecone', namespace: 'ns-p' });
    const q = createVectorClient({ provider: 'qdrant', namespace: 'ns-q' });
    expect(p.namespace).toBe('ns-p');
    expect(q.provider).toBe('qdrant');
    const rp = await p.upsert([{ id: '1', values: [1, 2] }]);
    expect(rp.namespace).toBe('ns-p');
  });
});
