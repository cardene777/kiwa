import { describe, expect, it } from 'vitest';
import {
  assembleReport,
  coverageFromV8Summary,
  fidelityFromMethodCounts,
  mutationFromCounts,
  perfFromSamples,
  testCountFromCategories,
} from '../src/index.js';

describe('coverageFromV8Summary', () => {
  it('T-QM-COL-001 pass-through when percentages are within 0-100', () => {
    const cov = coverageFromV8Summary({
      lines: { pct: 92.5 },
      branches: { pct: 88.1 },
      functions: { pct: 100 },
    });
    expect(cov).toEqual({ line: 92.5, branch: 88.1, function: 100 });
  });

  it('T-QM-COL-002 clamps negative percentages to 0', () => {
    const cov = coverageFromV8Summary({
      lines: { pct: -5 },
      branches: { pct: 0 },
      functions: { pct: 0 },
    });
    expect(cov.line).toBe(0);
  });

  it('T-QM-COL-003 clamps > 100 percentages to 100', () => {
    const cov = coverageFromV8Summary({
      lines: { pct: 120 },
      branches: { pct: 100 },
      functions: { pct: 100 },
    });
    expect(cov.line).toBe(100);
  });

  it('T-QM-COL-004 throws on NaN', () => {
    expect(() =>
      coverageFromV8Summary({
        lines: { pct: Number.NaN },
        branches: { pct: 0 },
        functions: { pct: 0 },
      }),
    ).toThrow(/invalid input/);
  });
});

describe('testCountFromCategories', () => {
  it('T-QM-COL-005 sums the three categories into total', () => {
    const t = testCountFromCategories({ behavior: 10, integration: 4, e2e: 2 });
    expect(t.total).toBe(16);
  });

  it('T-QM-COL-006 accepts zero counts', () => {
    const t = testCountFromCategories({ behavior: 0, integration: 0, e2e: 0 });
    expect(t.total).toBe(0);
  });

  it('T-QM-COL-007 rejects negative counts', () => {
    expect(() =>
      testCountFromCategories({ behavior: -1, integration: 0, e2e: 0 }),
    ).toThrow(/non-negative/);
  });

  it('T-QM-COL-008 rejects non-integer counts', () => {
    expect(() =>
      testCountFromCategories({ behavior: 1.5, integration: 0, e2e: 0 }),
    ).toThrow(/non-negative integer/);
  });
});

describe('fidelityFromMethodCounts', () => {
  it('T-QM-COL-009 computes ratio as covered / total × 100', () => {
    const f = fidelityFromMethodCounts({ mockCoveredMethods: 7, realTotalMethods: 10 });
    expect(f.ratio).toBe(70);
  });

  it('T-QM-COL-010 clamps at 100 when covered exceeds total', () => {
    const f = fidelityFromMethodCounts({ mockCoveredMethods: 20, realTotalMethods: 10 });
    expect(f.ratio).toBe(100);
  });

  it('T-QM-COL-011 returns 100 when realTotalMethods is zero', () => {
    const f = fidelityFromMethodCounts({ mockCoveredMethods: 0, realTotalMethods: 0 });
    expect(f.ratio).toBe(100);
  });

  it('T-QM-COL-012 propagates behavioralDivergences when supplied', () => {
    const f = fidelityFromMethodCounts({
      mockCoveredMethods: 5,
      realTotalMethods: 5,
      behavioralDivergences: 2,
    });
    expect(f.behavioralDivergences).toBe(2);
  });

  it('T-QM-COL-013 omits behavioralDivergences when not supplied', () => {
    const f = fidelityFromMethodCounts({ mockCoveredMethods: 5, realTotalMethods: 5 });
    expect(f.behavioralDivergences).toBeUndefined();
  });
});

describe('perfFromSamples', () => {
  it('T-QM-COL-014 returns zeros when samples is empty', () => {
    const p = perfFromSamples([]);
    expect(p).toEqual({ p50Ms: 0, p95Ms: 0, p99Ms: 0, samples: 0 });
  });

  it('T-QM-COL-015 computes p50 / p95 / p99 via nearest-rank', () => {
    // Sorted: 1, 2, 3, ..., 100 → p50 = 50, p95 = 95, p99 = 99
    const samples = Array.from({ length: 100 }, (_, i) => i + 1);
    const p = perfFromSamples(samples);
    expect(p.p50Ms).toBe(50);
    expect(p.p95Ms).toBe(95);
    expect(p.p99Ms).toBe(99);
    expect(p.samples).toBe(100);
  });

  it('T-QM-COL-016 rejects negative samples', () => {
    expect(() => perfFromSamples([1, -2, 3])).toThrow(/must be non-negative number/);
  });

  it('T-QM-COL-017 rejects NaN samples', () => {
    expect(() => perfFromSamples([1, Number.NaN, 3])).toThrow(/invalid sample/);
  });

  it('T-QM-COL-018 handles a single sample', () => {
    const p = perfFromSamples([42]);
    expect(p.p50Ms).toBe(42);
    expect(p.p95Ms).toBe(42);
    expect(p.p99Ms).toBe(42);
  });
});

describe('mutationFromCounts', () => {
  it('T-QM-COL-019 computes killRate as killed / mutations × 100', () => {
    const m = mutationFromCounts({ mutations: 50, killed: 30 });
    expect(m.survived).toBe(20);
    expect(m.killRate).toBe(60);
  });

  it('T-QM-COL-020 returns 0 killRate when mutations is zero', () => {
    const m = mutationFromCounts({ mutations: 0, killed: 0 });
    expect(m.killRate).toBe(0);
  });

  it('T-QM-COL-021 rejects killed > mutations', () => {
    expect(() => mutationFromCounts({ mutations: 5, killed: 10 })).toThrow(/exceeds mutations/);
  });
});

describe('assembleReport', () => {
  it('T-QM-COL-022 assembles a full report with a timestamp', () => {
    const report = assembleReport({
      provider: '@kiwa-test/example',
      version: '0.1.0',
      coverage: { line: 90, branch: 85, function: 92 },
      testCount: testCountFromCategories({ behavior: 20, integration: 5, e2e: 2 }),
      fidelity: fidelityFromMethodCounts({ mockCoveredMethods: 8, realTotalMethods: 10 }),
      perf: perfFromSamples([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]),
      mutation: mutationFromCounts({ mutations: 40, killed: 26 }),
    });
    expect(report.provider).toBe('@kiwa-test/example');
    expect(report.version).toBe('0.1.0');
    expect(report.testCount.total).toBe(27);
    expect(report.fidelity.ratio).toBe(80);
    expect(report.mutation.killRate).toBe(65);
    // reportedAt is an ISO string.
    expect(() => new Date(report.reportedAt).toISOString()).not.toThrow();
  });

  it('T-QM-COL-023 rejects empty provider', () => {
    expect(() =>
      assembleReport({
        provider: '',
        version: '0.1.0',
        coverage: { line: 0, branch: 0, function: 0 },
        testCount: { behavior: 0, integration: 0, e2e: 0, total: 0 },
        fidelity: { mockCoveredMethods: 0, realTotalMethods: 0, ratio: 100 },
        perf: { p50Ms: 0, p95Ms: 0, p99Ms: 0, samples: 0 },
        mutation: { mutations: 0, killed: 0, survived: 0, killRate: 0 },
      }),
    ).toThrow(/provider is required/);
  });

  it('T-QM-COL-024 propagates notes when supplied', () => {
    const report = assembleReport({
      provider: '@kiwa-test/example',
      version: '0.1.0',
      coverage: { line: 100, branch: 100, function: 100 },
      testCount: { behavior: 1, integration: 0, e2e: 0, total: 1 },
      fidelity: { mockCoveredMethods: 1, realTotalMethods: 1, ratio: 100 },
      perf: { p50Ms: 0, p95Ms: 0, p99Ms: 0, samples: 0 },
      mutation: { mutations: 0, killed: 0, survived: 0, killRate: 0 },
      notes: 'ships v0.1',
    });
    expect(report.notes).toBe('ships v0.1');
  });
});
