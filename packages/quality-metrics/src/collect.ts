import type {
  CoverageMetric,
  FidelityMetric,
  MutationMetric,
  PerfMetric,
  QualityReport,
  TestCountMetric,
} from './types.js';

/**
 * Collector helpers — each helper normalises raw inputs (c8 JSON, vitest
 * reporter output, stryker HTML report, etc) into the harness's 5-axis
 * shape. The helpers are pure functions so downstream consumers can also
 * build custom sources.
 */

/**
 * Build a {@link CoverageMetric} from a c8 / v8 JSON summary. The input
 * shape mirrors `coverage-summary.json` under c8's default output — the
 * consumer can pass just the `total` block.
 */
export function coverageFromV8Summary(input: {
  lines: { pct: number };
  branches: { pct: number };
  functions: { pct: number };
}): CoverageMetric {
  return {
    line: normalizePercentage(input.lines.pct),
    branch: normalizePercentage(input.branches.pct),
    function: normalizePercentage(input.functions.pct),
  };
}

/**
 * Build a {@link TestCountMetric} from three counts, computing the sum.
 * Callers usually pull these numbers from the vitest reporter output.
 */
export function testCountFromCategories(input: {
  behavior: number;
  integration: number;
  e2e: number;
}): TestCountMetric {
  assertNonNegativeInteger(input.behavior, 'behavior');
  assertNonNegativeInteger(input.integration, 'integration');
  assertNonNegativeInteger(input.e2e, 'e2e');
  return {
    behavior: input.behavior,
    integration: input.integration,
    e2e: input.e2e,
    total: input.behavior + input.integration + input.e2e,
  };
}

/**
 * Build a {@link FidelityMetric} from the mock-covered method count and the
 * real provider's method count. When `realTotalMethods === 0` the ratio is
 * defined as 100 — a provider with no public methods is trivially covered.
 */
export function fidelityFromMethodCounts(input: {
  mockCoveredMethods: number;
  realTotalMethods: number;
  behavioralDivergences?: number;
}): FidelityMetric {
  assertNonNegativeInteger(input.mockCoveredMethods, 'mockCoveredMethods');
  assertNonNegativeInteger(input.realTotalMethods, 'realTotalMethods');
  const ratio = input.realTotalMethods === 0
    ? 100
    : Math.min(
        100,
        (input.mockCoveredMethods / input.realTotalMethods) * 100,
      );
  const out: FidelityMetric = {
    mockCoveredMethods: input.mockCoveredMethods,
    realTotalMethods: input.realTotalMethods,
    ratio,
  };
  if (input.behavioralDivergences !== undefined) {
    assertNonNegativeInteger(input.behavioralDivergences, 'behavioralDivergences');
    out.behavioralDivergences = input.behavioralDivergences;
  }
  return out;
}

/**
 * Build a {@link PerfMetric} from an array of raw latency samples in ms.
 * Returns the p50 / p95 / p99 percentiles using nearest-rank on a sorted
 * copy of the samples.
 */
export function perfFromSamples(samplesMs: number[]): PerfMetric {
  if (samplesMs.length === 0) {
    return { p50Ms: 0, p95Ms: 0, p99Ms: 0, samples: 0 };
  }
  for (const s of samplesMs) {
    if (typeof s !== 'number' || Number.isNaN(s) || s < 0) {
      throw new Error(`perfFromSamples: invalid sample ${s} (must be non-negative number)`);
    }
  }
  const sorted = [...samplesMs].sort((a, b) => a - b);
  return {
    p50Ms: nearestRank(sorted, 50),
    p95Ms: nearestRank(sorted, 95),
    p99Ms: nearestRank(sorted, 99),
    samples: sorted.length,
  };
}

/**
 * Build a {@link MutationMetric} from a mutation total and killed count.
 * Derives `survived` and `killRate` deterministically.
 */
export function mutationFromCounts(input: {
  mutations: number;
  killed: number;
}): MutationMetric {
  assertNonNegativeInteger(input.mutations, 'mutations');
  assertNonNegativeInteger(input.killed, 'killed');
  if (input.killed > input.mutations) {
    throw new Error(
      `mutationFromCounts: killed (${input.killed}) exceeds mutations (${input.mutations})`,
    );
  }
  const survived = input.mutations - input.killed;
  const killRate = input.mutations === 0 ? 0 : (input.killed / input.mutations) * 100;
  return {
    mutations: input.mutations,
    killed: input.killed,
    survived,
    killRate,
  };
}

/**
 * Assemble a full {@link QualityReport} from pre-computed axes. Fills the
 * `reportedAt` timestamp with the current UTC ISO string.
 */
export function assembleReport(input: {
  provider: string;
  version: string;
  coverage: CoverageMetric;
  testCount: TestCountMetric;
  fidelity: FidelityMetric;
  perf: PerfMetric;
  mutation: MutationMetric;
  notes?: string;
}): QualityReport {
  if (!input.provider) throw new Error('assembleReport: provider is required');
  if (!input.version) throw new Error('assembleReport: version is required');
  const report: QualityReport = {
    provider: input.provider,
    version: input.version,
    reportedAt: new Date().toISOString(),
    coverage: input.coverage,
    testCount: input.testCount,
    fidelity: input.fidelity,
    perf: input.perf,
    mutation: input.mutation,
  };
  if (input.notes !== undefined) report.notes = input.notes;
  return report;
}

function normalizePercentage(pct: number): number {
  if (typeof pct !== 'number' || Number.isNaN(pct)) {
    throw new Error(`normalizePercentage: invalid input ${pct}`);
  }
  if (pct < 0) return 0;
  if (pct > 100) return 100;
  return pct;
}

function assertNonNegativeInteger(v: number, label: string): void {
  if (typeof v !== 'number' || Number.isNaN(v) || !Number.isFinite(v)) {
    throw new Error(`${label}: expected finite number, got ${v}`);
  }
  if (v < 0 || !Number.isInteger(v)) {
    throw new Error(`${label}: expected non-negative integer, got ${v}`);
  }
}

function nearestRank(sorted: number[], percentile: number): number {
  if (percentile < 0 || percentile > 100) {
    throw new Error(`nearestRank: invalid percentile ${percentile}`);
  }
  const rank = Math.ceil((percentile / 100) * sorted.length);
  const idx = Math.max(0, rank - 1);
  return sorted[idx]!;
}
