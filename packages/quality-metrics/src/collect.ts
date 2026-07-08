import type {
  A11yMetric,
  AccuracyMetric,
  CostMetric,
  CoverageMetric,
  FidelityMetric,
  LatencyMetric,
  MutationMetric,
  PerfMetric,
  QualityReport,
  TestCountMetric,
  TokenMetric,
} from './types.js';

/**
 * Collector helpers — each helper normalises raw inputs (c8 JSON, vitest
 * reporter output, stryker HTML report, LLM API bills, etc) into the harness's
 * 11-axis shape. The helpers are pure functions so downstream consumers can
 * also build custom sources.
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
  const p = percentilesFromSamples(samplesMs);
  return {
    p50Ms: p.p50Ms,
    p95Ms: p.p95Ms,
    p99Ms: p.p99Ms,
    samples: p.samples,
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
 * Build a {@link CostMetric} from an array of per-request US$ samples.
 * Returns the arithmetic mean as `perRequestUsd`, sum as `totalUsd`, and the
 * sample count. Empty input yields all-zero.
 */
export function costFromSamples(samplesUsd: number[]): CostMetric {
  if (samplesUsd.length === 0) {
    return { perRequestUsd: 0, totalUsd: 0, requests: 0 };
  }
  for (const s of samplesUsd) {
    if (typeof s !== 'number' || Number.isNaN(s) || s < 0) {
      throw new Error(`costFromSamples: invalid sample ${s} (must be non-negative number)`);
    }
  }
  const totalUsd = samplesUsd.reduce((acc, v) => acc + v, 0);
  return {
    perRequestUsd: totalUsd / samplesUsd.length,
    totalUsd,
    requests: samplesUsd.length,
  };
}

/**
 * Build a {@link LatencyMetric} from an array of raw end-to-end LLM latency
 * samples (ms)。 shape は {@link perfFromSamples} と同一だが、 対象は
 * user-facing LLM response 全体 (streaming 込)。
 */
export function latencyFromSamples(samplesMs: number[]): LatencyMetric {
  const p = percentilesFromSamples(samplesMs);
  return {
    p50Ms: p.p50Ms,
    p95Ms: p.p95Ms,
    p99Ms: p.p99Ms,
    samples: p.samples,
  };
}

/**
 * Build a {@link TokenMetric} from parallel arrays of prompt / completion
 * token samples。 両 array の長さは一致必須、 request 数 = 配列長。
 */
export function tokenFromSamples(input: {
  promptTokens: number[];
  completionTokens: number[];
}): TokenMetric {
  if (input.promptTokens.length !== input.completionTokens.length) {
    throw new Error(
      `tokenFromSamples: promptTokens.length (${input.promptTokens.length}) !== completionTokens.length (${input.completionTokens.length})`,
    );
  }
  const requests = input.promptTokens.length;
  if (requests === 0) {
    return { promptTokens: 0, completionTokens: 0, totalTokens: 0, requests: 0 };
  }
  for (const v of input.promptTokens) assertNonNegativeInteger(v, 'promptTokens[]');
  for (const v of input.completionTokens) assertNonNegativeInteger(v, 'completionTokens[]');
  const sumPrompt = input.promptTokens.reduce((acc, v) => acc + v, 0);
  const sumCompletion = input.completionTokens.reduce((acc, v) => acc + v, 0);
  return {
    promptTokens: sumPrompt / requests,
    completionTokens: sumCompletion / requests,
    totalTokens: (sumPrompt + sumCompletion) / requests,
    requests,
  };
}

/**
 * Build an {@link AccuracyMetric} from an array of 0.0-1.0 similarity
 * samples。 `method` field で「どの計測方法か」 を明示 (cosine / bleu /
 * exact-match / custom)、 score は平均。
 */
export function accuracyFromSamples(input: {
  samples: number[];
  method: string;
}): AccuracyMetric {
  if (!input.method) throw new Error('accuracyFromSamples: method is required');
  if (input.samples.length === 0) {
    return { score: 0, samples: 0, method: input.method };
  }
  for (const s of input.samples) {
    if (typeof s !== 'number' || Number.isNaN(s) || s < 0 || s > 1) {
      throw new Error(
        `accuracyFromSamples: invalid sample ${s} (must be number in [0, 1])`,
      );
    }
  }
  const score = input.samples.reduce((acc, v) => acc + v, 0) / input.samples.length;
  return {
    score,
    samples: input.samples.length,
    method: input.method,
  };
}

/**
 * Build an {@link A11yMetric} from a `.a11y-baseline/{pkg}.json` `totals`
 * block (v1.30-4)。 baseline JSON は
 * `{ package, generatedAt, layers, totals: { critical, serious, moderate, minor }, ok }`
 * shape、 このヘルパは totals を A11yMetric 型に coerce する pure function。
 *
 * 層が全部 layers-absent (Core / Framework の no-DOM adapter) の baseline は
 * 全 impact が 0 になる、 その場合も metric は shape 通り返す
 * (release gate が 0/0/0 を pass 判定する SSOT)。
 *
 * 部分欠損 (`totals: { critical: 0 }` のみ等) は 0 default で埋める、
 * silent NaN / undefined を防ぐ (負値 / NaN は throw で拒否)。
 */
export function a11yFromBaseline(input: {
  totals: {
    critical?: number;
    serious?: number;
    moderate?: number;
    minor?: number;
  };
}): A11yMetric {
  const pick = (field: 'critical' | 'serious' | 'moderate' | 'minor'): number => {
    const raw = input.totals[field];
    if (raw === undefined) return 0;
    if (typeof raw !== 'number' || Number.isNaN(raw) || raw < 0 || !Number.isFinite(raw)) {
      throw new Error(`a11yFromBaseline: invalid ${field} count ${raw} (must be non-negative finite number)`);
    }
    return raw;
  };
  return {
    critical: pick('critical'),
    serious: pick('serious'),
    moderate: pick('moderate'),
    minor: pick('minor'),
  };
}

/**
 * Assemble a full {@link QualityReport} from pre-computed axes. Fills the
 * `reportedAt` timestamp with the current UTC ISO string.
 *
 * AI-LLM 4 軸 (cost / latency / token / accuracy) は provider が
 * `@kiwa/ai-*` のときのみ意味を持つ (それ以外は undefined でも通る)。
 * a11y 軸 (v1.30-4) は tier-aware release gate が有効な package のみ渡す、
 * 未渡しは release gate 判定外 (context.a11yTier 指定時に critical Infinity
 * fallback で fail-safe)。
 */
export function assembleReport(input: {
  provider: string;
  version: string;
  coverage: CoverageMetric;
  testCount: TestCountMetric;
  fidelity: FidelityMetric;
  perf: PerfMetric;
  mutation: MutationMetric;
  cost?: CostMetric;
  latency?: LatencyMetric;
  token?: TokenMetric;
  accuracy?: AccuracyMetric;
  a11y?: A11yMetric;
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
  if (input.cost !== undefined) report.cost = input.cost;
  if (input.latency !== undefined) report.latency = input.latency;
  if (input.token !== undefined) report.token = input.token;
  if (input.accuracy !== undefined) report.accuracy = input.accuracy;
  if (input.a11y !== undefined) report.a11y = input.a11y;
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

/**
 * 内部 helper — samples array を p50 / p95 / p99 の 4 field に変換。
 * {@link perfFromSamples} / {@link latencyFromSamples} 共通化用。
 */
function percentilesFromSamples(samplesMs: number[]): {
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  samples: number;
} {
  if (samplesMs.length === 0) {
    return { p50Ms: 0, p95Ms: 0, p99Ms: 0, samples: 0 };
  }
  for (const s of samplesMs) {
    if (typeof s !== 'number' || Number.isNaN(s) || s < 0) {
      throw new Error(`percentilesFromSamples: invalid sample ${s} (must be non-negative number)`);
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

function nearestRank(sorted: number[], percentile: number): number {
  if (percentile < 0 || percentile > 100) {
    throw new Error(`nearestRank: invalid percentile ${percentile}`);
  }
  const rank = Math.ceil((percentile / 100) * sorted.length);
  const idx = Math.max(0, rank - 1);
  return sorted[idx]!;
}
