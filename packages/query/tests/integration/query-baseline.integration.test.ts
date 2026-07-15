/**
 * integration test — query domain の end-to-end workflow (fetch → subscribe → mutate →
 * invalidate → re-fetch) を 5 case で cover。
 */
import { describe, expect, it } from 'vitest';
import {
  createQueryClient,
  fetchQuery,
  mutate,
  invalidateQuery,
  subscribeToQuery,
} from '../../src/index.js';

describe('query integration — fetch → mutate → invalidate workflow', () => {
  it('T-INT-Q-001 fetch → subscribe → mutate + invalidate → refetch が listener で観測できる', async () => {
    const client = createQueryClient({ provider: 'tanstack' });
    const seen: string[] = [];
    const sub = subscribeToQuery(client, ['user', 1], (s) => seen.push(s.status));

    await fetchQuery(client, ['user', 1], async () => ({ name: 'a' }));
    await mutate(client, async (n: string) => ({ name: n }), 'b', { invalidateKeys: [['user', 1]] });
    await fetchQuery(client, ['user', 1], async () => ({ name: 'b' }));

    expect(seen).toContain('success');
    expect(seen).toContain('idle');
    sub.unsubscribe();
  });

  it('T-INT-Q-002 provider 別 client が独立 cache を持つ', async () => {
    const t = createQueryClient({ provider: 'tanstack' });
    const s = createQueryClient({ provider: 'swr' });
    await fetchQuery(t, ['k'], async () => ({ v: 1 }));
    expect(t.cache.size).toBe(1);
    expect(s.cache.size).toBe(0);
  });

  it('T-INT-Q-003 force=true で cache 無視して queryFn を再実行', async () => {
    const client = createQueryClient({ provider: 'urql' });
    await fetchQuery(client, ['k'], async () => ({ v: 1 }));
    const r = await fetchQuery(client, ['k'], async () => ({ v: 2 }), { force: true });
    expect(r.fromCache).toBe(false);
    expect(r.data).toEqual({ v: 2 });
    expect(r.fetchCount).toBe(2);
  });

  it('T-INT-Q-004 queryFn throw で error state に遷移 + listener 通知', async () => {
    const client = createQueryClient({ provider: 'apollo' });
    let observed: string | null = null;
    const sub = subscribeToQuery(client, ['fail'], (s) => { observed = s.status; });
    await expect(fetchQuery(client, ['fail'], async () => { throw new Error('x'); })).rejects.toThrow('x');
    expect(observed).toBe('error');
    sub.unsubscribe();
  });

  it('T-INT-Q-005 snapshot が cache 内の全 state を返す', async () => {
    const client = createQueryClient({ provider: 'tanstack' });
    await fetchQuery(client, ['a'], async () => ({ v: 1 }));
    await fetchQuery(client, ['b'], async () => ({ v: 2 }));
    const snap = client.snapshot();
    expect(snap.length).toBe(2);
    expect(snap.map((s) => s.key).sort()).toEqual(['["a"]', '["b"]']);
    client.clear();
    expect(client.snapshot().length).toBe(0);
  });
});
