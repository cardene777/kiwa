/**
 * fidelity test exemplar — `docs/concepts/test-taxonomy.md § fidelity` の pattern 実装。
 *
 * 目的 = createInMemoryCacheEnv (kiwa mock adapter) が、 想定される reference 実装
 * (今回は仕様通り動く単純 Map 実装) と同じ挙動を示すことを保証する。
 *
 * 本 file は「mock adapter が仕様を再現しているか」 を fidelity assertion で検査する経路の
 * 具体例。 実際に real Redis と比較する fidelity test は testcontainers 経由で書き、
 * `*.real.fidelity.test.ts` として別 file 化するのが望ましい (env 依存で CI 分離)。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { createInMemoryCacheEnv } from '../../src/index.js';

/** Reference impl = 仕様通り動く最小 Map ベース実装。 mock 挙動の期待仕様を体現する。 */
function referenceCache() {
  const store = new Map<string, string>();
  return {
    async get(key: string) {
      return store.get(key) ?? null;
    },
    async set(key: string, value: string) {
      store.set(key, value);
    },
    async delete(key: string) {
      const existed = store.has(key);
      store.delete(key);
      return existed ? 1 : 0;
    },
  };
}

describe('cache in-memory adapter fidelity vs reference impl', () => {
  it('get / set / delete の基本 3 操作 = reference impl と一致', async () => {
    const mock = createInMemoryCacheEnv({});
    const real = referenceCache();

    // set → get の並走 case。 caller が同順序で mock と real を叩き、 各 return が一致する
    // 前提の下で fidelity ratio を測る。
    const result = await assertFidelity({
      mockFn: async (key: string) => mock.get(key),
      realFn: async (key: string) => real.get(key),
      cases: [
        { name: '未 set key = null', args: ['missing'] },
      ],
    });
    expect(result.ratio).toBe(100);
    expect(result.divergences).toEqual([]);

    await mock.stop?.();
  });

  it('set 後 get で同じ value を返す (mock ↔ reference)', async () => {
    const mock = createInMemoryCacheEnv({});
    const real = referenceCache();

    await mock.set('k1', 'v1');
    await real.set('k1', 'v1');

    const result = await assertFidelity({
      mockFn: async () => mock.get('k1'),
      realFn: async () => real.get('k1'),
      cases: [{ name: 'set→get', args: [] as [] }],
    });
    expect(result.ratio).toBe(100);

    await mock.stop?.();
  });

  it('delete が存在 key = 1、 非存在 = 0 を返す (mock ↔ reference)', async () => {
    const mock = createInMemoryCacheEnv({});
    const real = referenceCache();

    await mock.set('to-delete', 'v');
    await real.set('to-delete', 'v');

    const result = await assertFidelity({
      mockFn: async (k: string) => mock.delete(k),
      realFn: async (k: string) => real.delete(k),
      cases: [
        { name: '存在 key', args: ['to-delete'] },
        { name: '非存在 key', args: ['never-set'] },
      ],
    });
    expect(result.ratio).toBe(100);
    expect(result.failed).toBe(0);

    await mock.stop?.();
  });
});
