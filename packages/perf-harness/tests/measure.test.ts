import { describe, expect, it } from 'vitest';
import { buildMeasureResult, measure, measureHarnessResolution } from '../src/index.js';

describe('measure', () => {
  it('T-PH-M-001 records sync samples and summary stats', async () => {
    let calls = 0;
    const result = await measure({
      name: 'sync-op',
      iterations: 5,
      warmup: 2,
      fn: () => {
        calls += 1;
      },
    });

    expect(calls).toBe(7);
    expect(result.samples).toHaveLength(5);
    expect(result.iterations).toBe(5);
    expect(result.warmup).toBe(2);
    expect(result.minMs).toBeGreaterThanOrEqual(0);
    expect(result.maxMs).toBeGreaterThanOrEqual(result.minMs);
    expect(result.totalMs).toBeGreaterThanOrEqual(result.maxMs);
  });

  it('T-PH-M-002 supports async work inside the loop', async () => {
    const result = await measure({
      name: 'async-op',
      iterations: 3,
      warmup: 1,
      fn: async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
      },
    });

    expect(result.samples).toHaveLength(3);
    expect(result.samples.every((sample) => sample >= 0)).toBe(true);
    expect(result.p50).toBeGreaterThan(0);
  });

  it('T-PH-M-003 rejects iterations below one', async () => {
    await expect(
      measure({
        name: 'bad-iterations',
        iterations: 0,
        fn: () => {},
      }),
    ).rejects.toThrow('measure: iterations must be >= 1');
  });

  it('T-PH-M-004 rejects negative warmup', async () => {
    await expect(
      measure({
        name: 'bad-warmup',
        iterations: 1,
        warmup: -1,
        fn: () => {},
      }),
    ).rejects.toThrow('measure: warmup must be >= 0');
  });

  it('T-PH-M-005 keeps every sample non-negative', async () => {
    const result = await measure({
      name: 'non-negative',
      iterations: 8,
      fn: () => {},
    });

    expect(result.samples).toHaveLength(8);
    expect(result.samples.every((sample) => sample >= 0)).toBe(true);
    expect(result.p10).toBeLessThanOrEqual(result.p50);
    expect(result.p95).toBeGreaterThanOrEqual(result.p50);
    expect(result.p99).toBeGreaterThanOrEqual(result.p95);
  });

  it('T-PH-M-006 p10 は Type 7 補間で下側 10% を返す (#1718)', () => {
    // n = 11 の等差列なら rank = 0.1 * 10 = 1 で、補間なしに 2 番目の値になる。
    const result = buildMeasureResult(
      'ordered',
      11,
      0,
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    );
    expect(result.p10).toBe(2);
  });
});

describe('measureHarnessResolution (#1718)', () => {
  it('T-PH-M-007 何もしない呼出の費用を正の有限値として返す', async () => {
    const resolution = await measureHarnessResolution({ iterations: 50, warmup: 5 });

    expect(Number.isFinite(resolution)).toBe(true);
    expect(resolution).toBeGreaterThan(0);
    // 何もしない関数の往復が 1ms かかることはない。 桁が違えば op の測定と
    // 同じ経路を通れていない (包み方を変えた等) 疑いがある。
    expect(resolution).toBeLessThan(1);
  });

  it('T-PH-M-008 実処理の測定は分解能以上になる', async () => {
    const resolution = await measureHarnessResolution({ iterations: 50, warmup: 5 });
    const busy = await measure({
      name: 'busy',
      iterations: 50,
      warmup: 5,
      fn: () => {
        let acc = 0;
        for (let i = 0; i < 20_000; i += 1) acc += i;
        if (acc < 0) throw new Error('unreachable');
      },
    });

    expect(busy.p10).toBeGreaterThan(resolution);
  });
});
