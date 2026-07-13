/**
 * fidelity test — `docs/concepts/test-taxonomy.md § fidelity` pattern。
 *
 * createMeilisearchMock (kiwa search mock adapter) が、 想定 reference impl
 * (Map ベース単純 index store + naive substring match) と同じ addDocuments / search /
 * clearIndex 挙動を返すことを保証する。 mock ≠ real Meilisearch / Algolia 比較の
 * live fidelity は `*.real.fidelity.test.ts` 経路 (現状 scope 外)。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { createMeilisearchMock } from '../../src/index.js';

interface Doc {
  readonly id: string;
  readonly title: string;
  readonly [key: string]: unknown;
}

/** Reference impl = Map ベース index store + naive substring match。 */
function referenceIndex() {
  const store = new Map<string, Map<string, Doc>>();
  return {
    async addDocuments(index: string, docs: Doc[]): Promise<{ inserted: number }> {
      let bucket = store.get(index);
      if (!bucket) {
        bucket = new Map();
        store.set(index, bucket);
      }
      let inserted = 0;
      for (const doc of docs) {
        if (!bucket.has(doc.id)) inserted += 1;
        bucket.set(doc.id, doc);
      }
      return { inserted };
    },
    async search(index: string, q: string): Promise<{ total: number; ids: string[] }> {
      const bucket = store.get(index);
      if (!bucket) return { total: 0, ids: [] };
      const tokens = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
      if (tokens.length === 0) {
        return { total: bucket.size, ids: Array.from(bucket.keys()) };
      }
      const hits: string[] = [];
      for (const doc of bucket.values()) {
        const lower = doc.title.toLowerCase();
        if (tokens.every((t) => lower.includes(t))) hits.push(doc.id);
      }
      return { total: hits.length, ids: hits };
    },
    async clearIndex(index: string): Promise<void> {
      store.delete(index);
    },
    async docCount(index: string): Promise<number> {
      return store.get(index)?.size ?? 0;
    },
  };
}

describe('createMeilisearchMock fidelity vs reference index store', () => {
  it('addDocuments = inserted count 一致', async () => {
    const mock = createMeilisearchMock({ typoTolerance: false });
    const real = referenceIndex();

    const docs: Doc[] = [
      { id: 'd1', title: 'hello world' },
      { id: 'd2', title: 'foo bar' },
    ];

    const result = await assertFidelity({
      mockFn: async () => (await mock.addDocuments('idx', docs)).inserted,
      realFn: async () => (await real.addDocuments('idx', docs)).inserted,
      cases: [{ name: 'addDocuments 2 件', args: [] as [] }],
    });
    expect(result.ratio).toBe(100);
    expect(result.divergences).toEqual([]);
  });

  it('search 単一 token = 存在 hit / 未 hit 両 case で totalHits 一致', async () => {
    const mock = createMeilisearchMock({ typoTolerance: false });
    const real = referenceIndex();

    const docs: Doc[] = [
      { id: 'd1', title: 'hello world' },
      { id: 'd2', title: 'foo bar' },
      { id: 'd3', title: 'hello universe' },
    ];
    await mock.addDocuments('idx', docs);
    await real.addDocuments('idx', docs);

    const result = await assertFidelity({
      mockFn: async (q: string) => (await mock.search('idx', { q })).totalHits,
      realFn: async (q: string) => (await real.search('idx', q)).total,
      cases: [
        { name: '"hello" hit 2 件', args: ['hello'] as [string] },
        { name: '"missing" hit 0 件', args: ['missing'] as [string] },
      ],
    });
    expect(result.ratio).toBe(100);
    expect(result.failed).toBe(0);
  });

  it('clearIndex 後 search = 両実装で totalHits 0', async () => {
    const mock = createMeilisearchMock({ typoTolerance: false });
    const real = referenceIndex();

    const docs: Doc[] = [{ id: 'd1', title: 'hello' }];
    await mock.addDocuments('idx', docs);
    await real.addDocuments('idx', docs);
    await mock.clearIndex('idx');
    await real.clearIndex('idx');

    const result = await assertFidelity({
      mockFn: async () => (await mock.search('idx', { q: 'hello' })).totalHits,
      realFn: async () => (await real.search('idx', 'hello')).total,
      cases: [{ name: 'clearIndex 後 hit 0', args: [] as [] }],
    });
    expect(result.ratio).toBe(100);
    expect(result.divergences).toEqual([]);
  });
});
