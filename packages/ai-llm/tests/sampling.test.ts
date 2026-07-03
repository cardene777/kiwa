import { describe, expect, it } from 'vitest';
import { makeSeededRandom, samplePoisson, sampleZipf } from '../src/index.js';

// -----------------------------------------------------------------------------
// § sampling distributions — Finding 2 (dogfood perf cross-cutting fix)
// -----------------------------------------------------------------------------

describe('makeSeededRandom', () => {
  it('T-AI-SAMP-001 same seed yields the same sequence (reproducibility contract)', () => {
    const rng1 = makeSeededRandom(42);
    const rng2 = makeSeededRandom(42);
    const seq1 = [rng1(), rng1(), rng1(), rng1(), rng1()];
    const seq2 = [rng2(), rng2(), rng2(), rng2(), rng2()];
    expect(seq1).toEqual(seq2);
  });

  it('T-AI-SAMP-002 different seed yields different sequence', () => {
    const rng1 = makeSeededRandom(42);
    const rng2 = makeSeededRandom(43);
    const seq1 = [rng1(), rng1(), rng1()];
    const seq2 = [rng2(), rng2(), rng2()];
    expect(seq1).not.toEqual(seq2);
  });

  it('T-AI-SAMP-003 all draws fall in [0, 1)', () => {
    const rng = makeSeededRandom(1);
    for (let i = 0; i < 200; i += 1) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('samplePoisson', () => {
  it('T-AI-SAMP-010 same seed yields identical Poisson sequence', () => {
    const a = samplePoisson(50, 5, makeSeededRandom(7));
    const b = samplePoisson(50, 5, makeSeededRandom(7));
    expect(a).toEqual(b);
  });

  it('T-AI-SAMP-011 empirical mean converges towards lambda for large N', () => {
    const samples = samplePoisson(4000, 5, makeSeededRandom(2026));
    const mean = samples.reduce((s, x) => s + x, 0) / samples.length;
    // Poisson variance = lambda so sigma / sqrt(n) is ~ 0.035 here; allow 5%
    expect(mean).toBeGreaterThan(5 * 0.9);
    expect(mean).toBeLessThan(5 * 1.1);
  });

  it('T-AI-SAMP-012 samples are non-negative integers', () => {
    const samples = samplePoisson(100, 3, makeSeededRandom(99));
    for (const s of samples) {
      expect(Number.isInteger(s)).toBe(true);
      expect(s).toBeGreaterThanOrEqual(0);
    }
  });

  it('T-AI-SAMP-013 count=0 returns empty array', () => {
    expect(samplePoisson(0, 5, makeSeededRandom(1))).toEqual([]);
  });

  it('T-AI-SAMP-014 negative lambda throws', () => {
    expect(() => samplePoisson(10, -1, makeSeededRandom(1))).toThrow(/lambda/);
  });

  it('T-AI-SAMP-015 lambda > 30 throws (Knuth variant underflow guard)', () => {
    expect(() => samplePoisson(10, 50, makeSeededRandom(1))).toThrow(/Poisson/);
    expect(() => samplePoisson(10, 100, makeSeededRandom(1))).toThrow(/Poisson/);
  });
});

describe('sampleZipf', () => {
  it('T-AI-SAMP-020 same seed yields identical Zipf sequence', () => {
    const a = sampleZipf(30, 100, 1.5, makeSeededRandom(11));
    const b = sampleZipf(30, 100, 1.5, makeSeededRandom(11));
    expect(a).toEqual(b);
  });

  it('T-AI-SAMP-021 samples fall in [1, n]', () => {
    const samples = sampleZipf(500, 50, 1.5, makeSeededRandom(3));
    for (const s of samples) {
      expect(s).toBeGreaterThanOrEqual(1);
      expect(s).toBeLessThanOrEqual(50);
      expect(Number.isInteger(s)).toBe(true);
    }
  });

  it('T-AI-SAMP-022 heavy-tail — bucket 1 is the modal outcome for skew > 1', () => {
    const samples = sampleZipf(3000, 30, 1.7, makeSeededRandom(50));
    const hist = new Map<number, number>();
    for (const s of samples) hist.set(s, (hist.get(s) ?? 0) + 1);
    const count1 = hist.get(1) ?? 0;
    for (const [rank, count] of hist.entries()) {
      if (rank === 1) continue;
      expect(count1).toBeGreaterThan(count);
    }
  });

  it('T-AI-SAMP-023 count=0 returns empty array', () => {
    expect(sampleZipf(0, 100, 1.5, makeSeededRandom(1))).toEqual([]);
  });

  it('T-AI-SAMP-024 s <= 1 throws (Devroye rejection requires s > 1)', () => {
    expect(() => sampleZipf(10, 100, 1, makeSeededRandom(1))).toThrow(/s/);
    expect(() => sampleZipf(10, 100, 0.5, makeSeededRandom(1))).toThrow(/s/);
  });

  it('T-AI-SAMP-025 n < 1 throws', () => {
    expect(() => sampleZipf(10, 0, 1.5, makeSeededRandom(1))).toThrow(/n/);
  });
});
