/**
 * real fidelity test — `docs/concepts/test-taxonomy.md § fidelity real driver`。
 *
 * createInMemoryCacheEnv (kiwa mock adapter) が、 real Redis (testcontainers 経由で
 * 起動する ioredis client) と同じ get / set / delete 挙動を返すことを保証する。
 * 既存 `redis-fidelity.test.ts` (mock ↔ Map reference の static 比較) を補完し、
 * 本 test は mock ↔ real backend の動的 fidelity を検証する。
 *
 * env-gate = KIWA_MODE=real 時のみ実行、 default は skip。 real 相手の test は
 * Docker + testcontainers 起動時間 + 実行 cost が乗るため opt-in default。
 * KIWA_MODE=real で明示指定した時のみ活性化する。
 */
import { assertFidelity, resolveRealFidelityMode } from '@kiwa-lab/quality-metrics';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createInMemoryCacheEnv, setupCacheEnv } from '../../src/index.js';
import type { CacheTestEnv } from '../../src/types.js';

const gate = resolveRealFidelityMode({
  lib: 'cache',
  requiredEnvKeys: [],
});

/**
 * describe.skipIf 経路 = KIWA_MODE=real 時のみ testcontainers Redis を起動して
 * mock ↔ real 動的 fidelity を検証。 default (KIWA_MODE 未設定 or "mock") = skip。
 */
describe.skipIf(!gate.enabled)('createInMemoryCacheEnv real fidelity vs testcontainers Redis', () => {
  let mock: CacheTestEnv;
  let real: CacheTestEnv;

  beforeAll(async () => {
    mock = createInMemoryCacheEnv({});
    real = await setupCacheEnv({ mode: 'testcontainers', client: 'ioredis' });
  }, 120_000);

  afterAll(async () => {
    await mock.stop?.();
    await real.stop?.();
  }, 30_000);

  it('未 set key = 両実装で null', async () => {
    const result = await assertFidelity({
      mockFn: async (key: string) => mock.get(key),
      realFn: async (key: string) => real.get(key),
      cases: [{ name: 'missing key', args: ['never-set-key'] as [string] }],
    });
    expect(result.ratio).toBe(100);
    expect(result.divergences).toEqual([]);
  });

  it('set → get で同 value を返す', async () => {
    const KEY = 'real-fidelity-set-get';
    await mock.set(KEY, 'v1');
    await real.set(KEY, 'v1');

    const result = await assertFidelity({
      mockFn: async () => mock.get(KEY),
      realFn: async () => real.get(KEY),
      cases: [{ name: 'set→get 一致', args: [] as [] }],
    });
    expect(result.ratio).toBe(100);
    expect(result.divergences).toEqual([]);
  });

  it('delete 後 get = 両実装で null (削除の可視性一致)', async () => {
    const KEY = 'real-fidelity-delete';
    await mock.set(KEY, 'to-delete');
    await real.set(KEY, 'to-delete');
    await mock.delete(KEY);
    await real.delete(KEY);

    const result = await assertFidelity({
      mockFn: async () => mock.get(KEY),
      realFn: async () => real.get(KEY),
      cases: [{ name: 'delete後 get=null', args: [] as [] }],
    });
    expect(result.ratio).toBe(100);
    expect(result.failed).toBe(0);
  });
});

// KIWA_MODE 未設定時のトレース用 = skipReason を stdout に emit しておく。
// vitest.config で reporter=verbose 経路で確認可能、 CI 経路で「なぜ skip か」 を
// 目視できる。
if (!gate.enabled) {
  // eslint-disable-next-line no-console
  console.log(`[cache real-fidelity] skipped: ${gate.skipReason}`);
}
