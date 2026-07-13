import { describe, expect, it } from 'vitest';
import {
  assembleReport,
  perfFromSamples,
  fidelityFromMethodCounts,
  mutationFromCounts,
  costFromSamples,
  latencyFromSamples,
  tokenFromSamples,
  accuracyFromSamples,
} from '../src/collect.js';

const baseInput = {
  provider: 'test',
  version: '1.0.0',
  coverage: { line: 100, branch: 100, function: 100 },
  testCount: { behavior: 10, integration: 5, e2e: 2, total: 17 },
  fidelity: { mockCoveredMethods: 4, realTotalMethods: 4, ratio: 100 },
  perf: { p50Ms: 10, p95Ms: 50, p99Ms: 100, samples: 100 },
  mutation: { mutations: 50, killed: 40, survived: 10, killRate: 80 },
};

describe('assembleReport defensive branches', () => {
  it('throws when provider is empty', () => {
    expect(() =>
      assembleReport({ ...baseInput, provider: '' }),
    ).toThrow(/provider is required/);
  });

  it('throws when version is empty', () => {
    expect(() =>
      assembleReport({ ...baseInput, version: '' }),
    ).toThrow(/version is required/);
  });

  it('includes optional cost when provided', () => {
    const report = assembleReport({
      ...baseInput,
      cost: { perRequestUsd: 0.001, totalUsd: 1, requests: 1000 },
    });
    expect(report.cost).toBeDefined();
  });

  it('includes optional latency when provided', () => {
    const report = assembleReport({
      ...baseInput,
      latency: { p50Ms: 10, p95Ms: 50, p99Ms: 100, samples: 100 },
    });
    expect(report.latency).toBeDefined();
  });

  it('includes optional token when provided', () => {
    const report = assembleReport({
      ...baseInput,
      token: { promptTokens: 100, completionTokens: 200, totalTokens: 300, requests: 10 },
    });
    expect(report.token).toBeDefined();
  });

  it('includes optional accuracy when provided', () => {
    const report = assembleReport({
      ...baseInput,
      accuracy: { score: 0.95, samples: 100, method: 'jaccard' },
    });
    expect(report.accuracy).toBeDefined();
  });

  it('includes optional a11y when provided', () => {
    const report = assembleReport({
      ...baseInput,
      a11y: { critical: 0, serious: 0, moderate: 0, minor: 0 },
    });
    expect(report.a11y).toBeDefined();
  });

  it('includes optional notes when provided', () => {
    const report = assembleReport({
      ...baseInput,
      notes: 'test note',
    });
    expect(report.notes).toBe('test note');
  });

  it('omits all optional fields when not provided', () => {
    const report = assembleReport(baseInput);
    expect(report.cost).toBeUndefined();
    expect(report.notes).toBeUndefined();
  });
});

describe('perfFromSamples defensive branches', () => {
  it('handles empty samples (returns 0)', () => {
    const result = perfFromSamples([]);
    expect(result.samples).toBe(0);
    expect(result.p50Ms).toBe(0);
  });

  it('computes percentiles from samples', () => {
    const result = perfFromSamples([10, 20, 30, 40, 50]);
    expect(result.samples).toBe(5);
    expect(result.p50Ms).toBeGreaterThan(0);
  });
});

describe('collect helpers defensive branches', () => {
  it('fidelityFromMethodCounts handles realTotalMethods = 0 (ratio = 100)', () => {
    const result = fidelityFromMethodCounts({
      mockCoveredMethods: 0,
      realTotalMethods: 0,
    });
    expect(result.ratio).toBe(100);
  });

  it('mutationFromCounts handles 0 mutations (killRate = 0)', () => {
    const result = mutationFromCounts({ mutations: 0, killed: 0 });
    expect(result.killRate).toBe(0);
  });

  it('costFromSamples handles empty samples', () => {
    const result = costFromSamples([]);
    expect(result.perRequestUsd).toBe(0);
  });

  it('latencyFromSamples handles empty samples', () => {
    const result = latencyFromSamples([]);
    expect(result.samples).toBe(0);
  });

  it('tokenFromSamples handles empty samples', () => {
    const result = tokenFromSamples({
      promptTokens: [],
      completionTokens: [],
    });
    expect(result.totalTokens).toBe(0);
  });

  it('accuracyFromSamples handles empty samples', () => {
    const result = accuracyFromSamples({ samples: [], method: 'jaccard' });
    expect(result.score).toBe(0);
  });
});
