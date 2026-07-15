/**
 * fidelity test — createQueryClient (kiwa mock) が reference impl (仕様通り動く最小 Map ベース cache)
 * と同じ挙動を示すことを検証。 5 case で fetch / cache-hit / invalidate / mutate / subscribe を cover。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { createQueryClient, fetchQuery, invalidateQuery, mutate, subscribeToQuery } from '../../src/index.js';

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
});
