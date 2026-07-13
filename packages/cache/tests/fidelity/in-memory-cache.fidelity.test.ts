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

  it('上書き set = 新 value を get で返す (両実装 last-write-wins)', async () => {
    const mock = createInMemoryCacheEnv({});
    const real = referenceCache();

    const result = await assertFidelity({
      mockFn: async () => {
        await mock.set('overwrite-key', 'v1');
        await mock.set('overwrite-key', 'v2');
        return mock.get('overwrite-key');
      },
      realFn: async () => {
        await real.set('overwrite-key', 'v1');
        await real.set('overwrite-key', 'v2');
        return real.get('overwrite-key');
      },
      cases: [{ name: 'last write wins', args: [] as [] }],
    });
    expect(result.ratio).toBe(100);

    await mock.stop?.();
  });

  it('set → delete → get = null (両実装、 削除の即時可視化)', async () => {
    const mock = createInMemoryCacheEnv({});
    const real = referenceCache();

    const result = await assertFidelity({
      mockFn: async () => {
        await mock.set('cycle', 'v');
        await mock.delete('cycle');
        return mock.get('cycle');
      },
      realFn: async () => {
        await real.set('cycle', 'v');
        await real.delete('cycle');
        return real.get('cycle');
      },
      cases: [{ name: 'set→delete→get null', args: [] as [] }],
    });
    expect(result.ratio).toBe(100);

    await mock.stop?.();
  });

  it('複数 key の独立性 = key A の delete が key B に影響しない', async () => {
    const mock = createInMemoryCacheEnv({});
    const real = referenceCache();

    // Map ベース reference では複数 key 独立、 mock も同じ挙動を期待
    const result = await assertFidelity({
      mockFn: async () => {
        await mock.set('key-a', 'va');
        await mock.set('key-b', 'vb');
        await mock.delete('key-a');
        return mock.get('key-b');
      },
      realFn: async () => {
        await real.set('key-a', 'va');
        await real.set('key-b', 'vb');
        await real.delete('key-a');
        return real.get('key-b');
      },
      cases: [{ name: 'key A delete 後も key B 保持', args: [] as [] }],
    });
    expect(result.ratio).toBe(100);

    await mock.stop?.();
  });

  it('空 string value = get で空 string を返す (両実装、 falsy 値の保持)', async () => {
    const mock = createInMemoryCacheEnv({});
    const real = referenceCache();

    const result = await assertFidelity({
      mockFn: async () => {
        await mock.set('empty', '');
        return mock.get('empty');
      },
      realFn: async () => {
        await real.set('empty', '');
        return real.get('empty');
      },
      cases: [{ name: '空 string 保持', args: [] as [] }],
    });
    expect(result.ratio).toBe(100);

    await mock.stop?.();
  });

  it('特殊文字 (unicode / space) を含む key/value が保持される (両実装)', async () => {
    const mock = createInMemoryCacheEnv({});
    const real = referenceCache();

    const result = await assertFidelity({
      mockFn: async (k: string, v: string) => {
        await mock.set(k, v);
        return mock.get(k);
      },
      realFn: async (k: string, v: string) => {
        await real.set(k, v);
        return real.get(k);
      },
      cases: [
        { name: 'unicode key/value', args: ['日本語:キー', '値🎉'] },
        { name: 'space in key', args: ['key with space', 'value with space'] },
        { name: 'colon delimiter', args: ['ns:sub:key', 'ns-value'] },
      ],
    });
    expect(result.ratio).toBe(100);

    await mock.stop?.();
  });
});
