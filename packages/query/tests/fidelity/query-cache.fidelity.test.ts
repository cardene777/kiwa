/**
 * fidelity test — createQueryClient (kiwa mock) が reference impl (仕様通り動く最小 Map ベース cache)
 * と同じ挙動を示すことを検証。 5 case で fetch / cache-hit / invalidate / mutate / subscribe を cover。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import {
  createQueryClient,
  fetchQuery,
  invalidateQuery,
  mutate,
  subscribeToQuery,
  createInfiniteQuery,
  createOptimisticUpdate,
  prefetchQueries,
  retryWithBackoff,
} from '../../src/index.js';

function referenceCache() {
  const store = new Map<string, unknown>();
  return {
    async fetch(key: string, fn: () => Promise<unknown>) {
      if (store.has(key)) return store.get(key);
      const v = await fn();
      store.set(key, v);
      return v;
    },
    invalidate(key: string) {
      return store.delete(key);
    },
  };
}

describe('query client fidelity vs reference impl', () => {
  it('fetch = data 取得 + return 値が reference impl と一致', async () => {
    const mock = createQueryClient({ provider: 'tanstack' });
    const real = referenceCache();
    const result = await assertFidelity({
      mockFn: async (key: string) => (await fetchQuery(mock, [key], async () => ({ v: key }))).data,
      realFn: async (key: string) => await real.fetch(key, async () => ({ v: key })),
      cases: [{ name: 'basic fetch', args: ['a'] }],
    });
    expect(result.ratio).toBe(100);
  });

  it('cache-hit で fetchCount が増えない (fromCache=true)', async () => {
    const mock = createQueryClient({ provider: 'swr' });
    await fetchQuery(mock, ['x'], async () => ({ v: 1 }));
    const second = await fetchQuery(mock, ['x'], async () => ({ v: 999 }));
    expect(second.fromCache).toBe(true);
    expect(second.fetchCount).toBe(1);
  });

  it('invalidateQuery で cache が消える', async () => {
    const mock = createQueryClient({ provider: 'urql' });
    await fetchQuery(mock, ['y'], async () => ({ v: 1 }));
    expect(mock.cache.size).toBe(1);
    const r = invalidateQuery(mock, ['y']);
    expect(r.existed).toBe(true);
    expect(mock.cache.size).toBe(0);
  });

  it('mutate の invalidateKeys で cache が invalidate される', async () => {
    const mock = createQueryClient({ provider: 'apollo' });
    await fetchQuery(mock, ['z'], async () => ({ v: 1 }));
    const r = await mutate(mock, async (n: number) => ({ n }), 42, { invalidateKeys: [['z']] });
    expect(r.invalidated).toContain('["z"]');
    expect(mock.cache.has('["z"]')).toBe(false);
  });

  it('subscribeToQuery listener が fetch 完了で呼ばれる', async () => {
    const mock = createQueryClient({ provider: 'tanstack' });
    let observed: string | null = null;
    const sub = subscribeToQuery(mock, ['s'], (state) => { observed = state.status; });
    await fetchQuery(mock, ['s'], async () => ({ v: 1 }));
    expect(observed).toBe('success');
    sub.unsubscribe();
  });

  // v2.1 追加 5 case
  it('v2.1 infiniteQuery で 3 page fetch', async () => {
    const iq = createInfiniteQuery<number, number>({
      initialCursor: 0,
      fetchPage: async (cursor: number) => {
        const nextCursor = cursor < 2 ? cursor + 1 : undefined;
        const base = {
          data: [cursor * 10, cursor * 10 + 1, cursor * 10 + 2],
        } as { data: number[]; nextCursor?: number };
        if (nextCursor !== undefined) base.nextCursor = nextCursor;
        return base;
      },
    });
    await iq.fetchNextPage();
    await iq.fetchNextPage();
    await iq.fetchNextPage();
    expect(iq.pages.length).toBe(3);
    expect(iq.hasNextPage).toBe(false);
  });

  it('v2.1 optimistic update commit で baseline 更新', () => {
    const opt = createOptimisticUpdate({ count: 0 });
    opt.applyOptimistic({ count: 5 });
    expect(opt.current().count).toBe(5);
    expect(opt.isPending()).toBe(true);
    opt.commit();
    expect(opt.isPending()).toBe(false);
    expect(opt.current().count).toBe(5);
  });

  it('v2.1 optimistic update rollback で baseline に戻る', () => {
    const opt = createOptimisticUpdate({ count: 0 });
    opt.applyOptimistic({ count: 5 });
    opt.rollback();
    expect(opt.current().count).toBe(0);
    expect(opt.isPending()).toBe(false);
  });

  it('v2.1 prefetchQueries で 5 key 並列 fetch', async () => {
    const store: Record<string, number> = {};
    const result = await prefetchQueries(
      ['a', 'b', 'c', 'd', 'e'],
      async (k) => { store[k] = k.length; },
      { concurrency: 3 },
    );
    expect(result.successCount).toBe(5);
    expect(result.failureCount).toBe(0);
  });

  it('v2.1 retryWithBackoff = fetch 失敗 → 成功', async () => {
    let n = 0;
    const r = await retryWithBackoff(async () => {
      n += 1;
      if (n < 3) throw new Error('flaky');
      return 'ok';
    }, { maxAttempts: 5, initialDelayMs: 1 });
    expect(r.ok).toBe(true);
    expect(r.attempts).toBe(3);
  });
});
