import {
  accuracyFromSamples,
  assembleReport,
  costFromSamples,
  coverageFromV8Summary,
  fidelityFromMethodCounts,
  latencyFromSamples,
  mutationFromCounts,
  perfFromSamples,
  testCountFromCategories,
  tokenFromSamples,
  type QualityReport,
} from '@kiwa/quality-metrics';
import type { FidelityReport } from './fidelity.js';
import type { AiLlmMock } from './types.js';

/**
 * `@kiwa/ai-llm` 実測値を `@kiwa/quality-metrics` `QualityReport`
 * に集約する adapter。
 *
 * dogfood app が fidelity harness を回した後、 本 adapter で
 * `QualityReport` に変換 → `evaluateReleaseGate` に渡す、 の流れを想定。
 *
 * accuracy / cost / latency / token 4 軸は `FidelityReport.records` の
 * 実測値 (mock 側) を集計、 fidelity の 5 軸目 (surface coverage) は
 * 別途 mock 側の `mockCoveredMethods` / `realTotalMethods` 引数で指定。
 */
export interface BuildAiLlmReportInput {
  provider: string;
  version: string;
  /** fidelity harness の結果 (real vs mock 4 metric 実測) */
  fidelity: FidelityReport;
  /**
   * mock 側 SDK 表面の cover 数。 `@kiwa/quality-metrics` 5 軸目の
   * fidelity ratio 用。 default `{ mock: 4, real: 4 }` (4 SDK 全 cover)。
   */
  surfaceCoverage?: { mockCoveredMethods: number; realTotalMethods: number };
  /** vitest 由来の test count breakdown。 */
  testCount?: { behavior: number; integration: number; e2e: number };
  /** v8 coverage summary (c8 `coverage-summary.json` の `total` block)。 */
  coverageV8Summary?: {
    lines: { pct: number };
    branches: { pct: number };
    functions: { pct: number };
  };
  /** stryker / cargo-mutants mutation report。 */
  mutation?: { mutations: number; killed: number };
  /** unit-scope adapter perf (100 回計測の p95 用)。 */
  perfSamplesMs?: number[];
  /** notes to embed in the emitted markdown report。 */
  notes?: string;
}

/**
 * 実測 fidelity + coverage + test count + mutation + perf を
 * `QualityReport` に統合する。 AI-LLM 4 軸は `fidelity.records` から
 * 自動集計。
 */
export function buildAiLlmReport(input: BuildAiLlmReportInput): QualityReport {
  // AI-LLM 4 軸の元 sample = mock 側実測値 (real は fidelity diff の
  // 参照用、 release gate は mock の実測値で判定)。
  const costSamples = input.fidelity.records.map((r) => r.mock.costUsd);
  const latencySamples = input.fidelity.records.map((r) => r.mock.latencyMs);
  const promptTokens = input.fidelity.records.map((r) => r.mock.usage.promptTokens);
  const completionTokens = input.fidelity.records.map((r) => r.mock.usage.completionTokens);
  const accuracySamples = input.fidelity.records.map((r) => r.accuracyScore);

  const surface = input.surfaceCoverage ?? { mockCoveredMethods: 4, realTotalMethods: 4 };
  const testCount = testCountFromCategories(input.testCount ?? { behavior: 0, integration: 0, e2e: 0 });
  const coverage = input.coverageV8Summary
    ? coverageFromV8Summary(input.coverageV8Summary)
    : { line: 100, branch: 100, function: 100 };
  const mutation = input.mutation
    ? mutationFromCounts(input.mutation)
    : { mutations: 0, killed: 0, survived: 0, killRate: 0 };
  const perf = perfFromSamples(input.perfSamplesMs ?? []);

  return assembleReport({
    provider: input.provider,
    version: input.version,
    coverage,
    testCount,
    fidelity: fidelityFromMethodCounts({
      mockCoveredMethods: surface.mockCoveredMethods,
      realTotalMethods: surface.realTotalMethods,
      behavioralDivergences: input.fidelity.records.filter((r) => r.accuracyScore < 0.5).length,
    }),
    perf,
    mutation,
    cost: costFromSamples(costSamples),
    latency: latencyFromSamples(latencySamples),
    token: tokenFromSamples({ promptTokens, completionTokens }),
    accuracy: accuracyFromSamples({
      samples: accuracySamples,
      method: input.fidelity.summary.accuracyMethod,
    }),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
  });
}

/**
 * mock adapter の `getMetrics()` から直接 `QualityReport` を組み立てる
 * light path。 fidelity harness を回さず、 mock 単体の実測値だけを
 * report 化する用途 (unit test 内で release gate 検証したいとき等)。
 */
export function buildAiLlmReportFromMock(input: {
  provider: string;
  version: string;
  mock: AiLlmMock;
  /** accuracy は fidelity 経路が必要なので単体経路では固定値を渡す。 */
  accuracyScore: number;
  accuracyMethod: string;
  surfaceCoverage?: { mockCoveredMethods: number; realTotalMethods: number };
  testCount?: { behavior: number; integration: number; e2e: number };
  notes?: string;
}): QualityReport {
  const metrics = input.mock.getMetrics();
  const requests = Math.max(1, metrics.requests);
  const surface = input.surfaceCoverage ?? { mockCoveredMethods: 4, realTotalMethods: 4 };
  const testCount = testCountFromCategories(input.testCount ?? { behavior: 0, integration: 0, e2e: 0 });
  const perRequestUsd = metrics.totalCostUsd / requests;
  const cost = {
    perRequestUsd,
    totalUsd: metrics.totalCostUsd,
    requests: metrics.requests,
  };
  const latency = latencyFromSamples(metrics.latencySamplesMs);
  const token = {
    promptTokens: metrics.totalTokens.promptTokens / requests,
    completionTokens: metrics.totalTokens.completionTokens / requests,
    totalTokens: metrics.totalTokens.totalTokens / requests,
    requests: metrics.requests,
  };
  const accuracy = accuracyFromSamples({
    samples: [input.accuracyScore],
    method: input.accuracyMethod,
  });
  return assembleReport({
    provider: input.provider,
    version: input.version,
    coverage: { line: 100, branch: 100, function: 100 },
    testCount,
    fidelity: fidelityFromMethodCounts({
      mockCoveredMethods: surface.mockCoveredMethods,
      realTotalMethods: surface.realTotalMethods,
    }),
    perf: perfFromSamples(metrics.latencySamplesMs),
    mutation: { mutations: 0, killed: 0, survived: 0, killRate: 0 },
    cost,
    latency,
    token,
    accuracy,
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
  });
}
