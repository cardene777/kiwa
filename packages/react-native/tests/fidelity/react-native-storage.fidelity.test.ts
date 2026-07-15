/**
 * fidelity test — mockAsyncStorage が reference impl (仕様通り動く Map ベース) と
 * 同じ挙動を示すことを 5 case で verify。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { mockAsyncStorage, mockNavigation, createRNTestEnv } from '../../src/index.js';

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
});
