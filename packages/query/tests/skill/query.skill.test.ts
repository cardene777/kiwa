/**
 * skill test — query skill が主要 5 API (createQueryClient / fetchQuery / mutate /
 * invalidateQuery / subscribeToQuery) を全て公開している + 4 provider 全てで instantiate 可能な
 * ことを skill-test primitive 経由で assertion する。
 */
import { describe, expect, it } from 'vitest';
import {
  createQueryClient,
  fetchQuery,
  mutate,
  invalidateQuery,
  subscribeToQuery,
} from '../../src/index.js';

describe('query skill assertions', () => {
  it('createQueryClient を 4 provider (tanstack/swr/urql/apollo) 全てで instantiate 可能', () => {
    for (const provider of ['tanstack', 'swr', 'urql', 'apollo'] as const) {
      const client = createQueryClient({ provider });
      expect(client.provider).toBe(provider);
      expect(client.cache.size).toBe(0);
    }
  });

  it('fetchQuery が queryFn を実行して data + fetchCount + fromCache を返す', async () => {
    const client = createQueryClient({ provider: 'tanstack' });
    const r = await fetchQuery(client, ['k'], async () => ({ v: 42 }));
    expect(r.data).toEqual({ v: 42 });
    expect(r.fromCache).toBe(false);
    expect(r.fetchCount).toBe(1);
  });

  it('mutate が invalidateKeys を全 invalidate + onSuccess callback を呼ぶ', async () => {
    const client = createQueryClient({ provider: 'swr' });
    let called = false;
    await fetchQuery(client, ['k'], async () => ({ v: 1 }));
    const r = await mutate(client, async (n: number) => ({ n }), 5, {
      invalidateKeys: [['k']],
      onSuccess: () => { called = true; },
    });
    expect(r.result).toEqual({ n: 5 });
    expect(r.invalidated).toContain('["k"]');
    expect(called).toBe(true);
  });

  it('invalidateQuery が existed=true で cache 削除する', async () => {
    const client = createQueryClient({ provider: 'urql' });
    await fetchQuery(client, ['a'], async () => ({ v: 1 }));
    const r = invalidateQuery(client, ['a']);
    expect(r.existed).toBe(true);
    const r2 = invalidateQuery(client, ['b']);
    expect(r2.existed).toBe(false);
  });

  it('subscribeToQuery + unsubscribe が cleanup で listener 除去する', () => {
    const client = createQueryClient({ provider: 'apollo' });
    const sub = subscribeToQuery(client, ['k'], () => undefined);
    expect(client.listeners.get('["k"]')!.size).toBe(1);
    sub.unsubscribe();
    expect(client.listeners.get('["k"]')).toBeUndefined();
  });
});
