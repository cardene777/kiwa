import { describe, expect, it } from 'vitest';
import { measure } from '../src/index.js';

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
    expect(result.p95).toBeGreaterThanOrEqual(result.p50);
    expect(result.p99).toBeGreaterThanOrEqual(result.p95);
  });
});
