/**
 * fidelity test — mockAsyncStorage が reference impl (仕様通り動く Map ベース) と
 * 同じ挙動を示すことを 5 case で verify。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import {
  mockAsyncStorage,
  mockNavigation,
  createRNTestEnv,
  matchDeepLink,
  createNotificationPermissionMock,
  retryWithBackoff,
  batchAsync,
  createRateLimiter,
} from '../../src/index.js';

function referenceStorage() {
  const m = new Map<string, string>();
  return {
    async get(k: string) {
      return m.get(k) ?? null;
    },
    async set(k: string, v: string) {
      m.set(k, v);
    },
    async remove(k: string) {
      m.delete(k);
    },
  };
}

describe('react-native async-storage fidelity', () => {
  it('未 set key は null を返す (mock ↔ reference)', async () => {
    const mock = mockAsyncStorage();
    const ref = referenceStorage();
    const result = await assertFidelity({
      mockFn: async (k: string) => mock.getItem(k),
      realFn: async (k: string) => ref.get(k),
      cases: [{ name: 'missing key', args: ['nope'] }],
    });
    expect(result.ratio).toBe(100);
  });

  it('setItem 後 getItem で同 value を返す', async () => {
    const mock = mockAsyncStorage();
    await mock.setItem('k1', 'v1');
    expect(await mock.getItem('k1')).toBe('v1');
  });

  it('multiSet + multiGet で複数 pair を扱える', async () => {
    const mock = mockAsyncStorage();
    await mock.multiSet([
      ['a', '1'],
      ['b', '2'],
    ]);
    const got = await mock.multiGet(['a', 'b', 'c']);
    expect(got).toEqual([
      ['a', '1'],
      ['b', '2'],
      ['c', null],
    ]);
  });

  it('navigation stack が navigate + goBack で正しく変化する', () => {
    const n = mockNavigation({ name: 'Home' });
    n.navigate('Detail', { id: 42 });
    expect(n.currentRoute().name).toBe('Detail');
    expect(n.goBack()).toBe(true);
    expect(n.currentRoute().name).toBe('Home');
  });

  it('createRNTestEnv default = iOS + iPhone 14 dimensions', () => {
    const env = createRNTestEnv({});
    expect(env.platform.os).toBe('ios');
    expect(env.dimensions.window.width).toBe(390);
    expect(env.dimensions.window.height).toBe(844);
  });

  // v2.1 追加 5 case
  it('v2.1 deep link match で scheme + host 抽出', () => {
    const m = matchDeepLink('myapp://open/user/42', [{ scheme: 'myapp', host: 'open' }]);
    expect(m.matched).toBe(true);
    expect(m.scheme).toBe('myapp');
    expect(m.host).toBe('open');
  });

  it('v2.1 notification permission mock で granted 遷移', async () => {
    const p = createNotificationPermissionMock('undetermined');
    expect(p.status()).toBe('undetermined');
    const requested = await p.request();
    expect(requested).toBe('granted');
    p.set('denied');
    expect(p.status()).toBe('denied');
  });

  it('v2.1 retryWithBackoff = 3 attempt で成功', async () => {
    let attempts = 0;
    const result = await retryWithBackoff(async () => {
      attempts += 1;
      if (attempts < 3) throw new Error('flaky');
      return 'ok';
    }, { maxAttempts: 5, initialDelayMs: 1 });
    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(3);
  });

  it('v2.1 batchAsync = 5 handler 並列 + successCount 集計', async () => {
    const handlers = Array.from({ length: 5 }, (_, i) => async () => i);
    const r = await batchAsync(handlers, { concurrency: 3 });
    expect(r.successCount).toBe(5);
    expect(r.failureCount).toBe(0);
  });

  it('v2.1 rate limiter burst で 3 tryAcquire 通過', () => {
    const rl = createRateLimiter({ requestsPerSecond: 1, burst: 3 });
    const ok = [rl.tryAcquire(), rl.tryAcquire(), rl.tryAcquire()];
    expect(ok.every((v) => v)).toBe(true);
  });
});
