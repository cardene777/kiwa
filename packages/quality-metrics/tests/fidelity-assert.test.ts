import { describe, expect, it } from 'vitest';
import { assertFidelity } from '../src/index.js';

describe('assertFidelity — mock ↔ real 挙動一致検証 primitive', () => {
  it('全 case 一致で ratio 100 + divergences 空', async () => {
    const result = await assertFidelity({
      mockFn: (x: number, y: number) => x + y,
      realFn: (x: number, y: number) => x + y,
      cases: [
        { name: 'zero + zero', args: [0, 0] },
        { name: 'positive', args: [1, 2] },
        { name: 'negative', args: [-3, 5] },
      ],
    });
    expect(result.passed).toBe(3);
    expect(result.failed).toBe(0);
    expect(result.ratio).toBe(100);
    expect(result.divergences).toEqual([]);
  });

  it('mock と real で計算 divergence を検出', async () => {
    const result = await assertFidelity({
      mockFn: (x: number, y: number) => x + y + 1, // mock が buggy
      realFn: (x: number, y: number) => x + y,
      cases: [{ name: 'basic', args: [1, 2] }],
    });
    expect(result.failed).toBe(1);
    expect(result.divergences).toHaveLength(1);
    expect(result.divergences[0]?.mock).toBe(4);
    expect(result.divergences[0]?.real).toBe(3);
    expect(result.divergences[0]?.reason).toBe('deepStrictEqual mismatch');
  });

  it('mock throw + real ok の非対称 = divergence', async () => {
    const result = await assertFidelity({
      mockFn: (_: number) => {
        throw new Error('mock explode');
      },
      realFn: (n: number) => n * 2,
      cases: [{ name: 'basic', args: [5] }],
    });
    expect(result.failed).toBe(1);
    expect(result.divergences[0]?.reason).toBe('mock and real disagree on throw');
    expect(String(result.divergences[0]?.mock)).toContain('mock explode');
    expect(result.divergences[0]?.real).toBe(10);
  });

  it('両方 throw で message 一致 = 一致扱い', async () => {
    const result = await assertFidelity({
      mockFn: () => {
        throw new Error('boom');
      },
      realFn: () => {
        throw new Error('boom');
      },
      cases: [{ name: 'basic', args: [] as [] }],
    });
    expect(result.passed).toBe(1);
    expect(result.failed).toBe(0);
    expect(result.divergences).toEqual([]);
  });

  it('両方 throw で message 不一致 = divergence', async () => {
    const result = await assertFidelity({
      mockFn: () => {
        throw new Error('a');
      },
      realFn: () => {
        throw new Error('b');
      },
      cases: [{ name: 'basic', args: [] as [] }],
    });
    expect(result.failed).toBe(1);
    expect(result.divergences[0]?.reason).toBe('both threw but with divergent messages');
  });

  it('custom compare で order-insensitive 比較 (set semantics)', async () => {
    const result = await assertFidelity({
      mockFn: () => [3, 1, 2],
      realFn: () => [1, 2, 3],
      cases: [
        {
          name: 'unordered result',
          args: [] as [],
          compare: (m, r) => {
            const setM = new Set(m);
            const setR = new Set(r);
            return setM.size === setR.size && [...setM].every((v) => setR.has(v));
          },
        },
      ],
    });
    expect(result.passed).toBe(1);
    expect(result.failed).toBe(0);
  });

  it('async fn 対応', async () => {
    const result = await assertFidelity({
      mockFn: async (n: number) => n + 1,
      realFn: async (n: number) => n + 1,
      cases: [{ name: 'async basic', args: [10] }],
    });
    expect(result.ratio).toBe(100);
  });

  it('0 case で ratio = 100 (NaN 回避)', async () => {
    const result = await assertFidelity({
      mockFn: () => 0,
      realFn: () => 0,
      cases: [],
    });
    expect(result.ratio).toBe(100);
    expect(result.passed).toBe(0);
    expect(result.failed).toBe(0);
  });

  it('mixed pass/fail の ratio 計算', async () => {
    const result = await assertFidelity({
      mockFn: (n: number) => (n < 3 ? n : n + 1), // n >= 3 で divergence
      realFn: (n: number) => n,
      cases: [
        { name: 'n=1', args: [1] },
        { name: 'n=2', args: [2] },
        { name: 'n=3', args: [3] },
        { name: 'n=4', args: [4] },
      ],
    });
    expect(result.passed).toBe(2);
    expect(result.failed).toBe(2);
    expect(result.ratio).toBe(50);
  });
});
