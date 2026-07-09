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
} from '@kiwa-lab/quality-metrics';
import type { RealtimeFidelityReport } from './fidelity.js';
import type { RealtimeMock } from './types.js';

/**
 * `@kiwa-lab/realtime` 実測値を `@kiwa-lab/quality-metrics` `QualityReport`
 * に集約する adapter。
 *
 * dogfood app が realtime fidelity harness を回した後、 本 adapter で
 * `QualityReport` に変換 → `evaluateReleaseGate` に渡す、 の流れを想定。
 *
 * Realtime は cost / token が LLM ほど直接的でないため、
 * - cost = mock 側の subscribe + publish 総回数 × 単価 (通信費近似)
 * - latency = subscribe + publish latency サンプル
 * - token = event payload の byte 数を token 相当として扱う
 * - accuracy = fidelity harness の kind/payload 一致率
 * の 4 軸に mapping する。
 */
export interface BuildRealtimeReportInput {
  provider: string;
  version: string;
  /** fidelity harness の結果 (real vs mock scenario 一致率) */
  fidelity: RealtimeFidelityReport;
  /** mock 実測 metrics (cost / latency 集計用)。 */
  mockMetrics: ReturnType<RealtimeMock['getMetrics']>;
  /** mock 側 API 表面 cover 数。 default `{ mock: 4, real: 4 }` (4 provider)。 */
  surfaceCoverage?: { mockCoveredMethods: number; realTotalMethods: number };
  /** vitest 由来の test count breakdown。 */
  testCount?: { behavior: number; integration: number; e2e: number };
  /** v8 coverage summary。 */
  coverageV8Summary?: {
    lines: { pct: number };
    branches: { pct: number };
    functions: { pct: number };
  };
  /** stryker / mutation テスト結果。 */
  mutation?: { mutations: number; killed: number };
  /** perf sample (ms、 別軸 p95 用)。 */
  perfSamplesMs?: number[];
  /** 1 event あたりの想定通信費 (USD、 default $0.00001 = $10/million events)。 */
  costPerEventUsd?: number;
  notes?: string;
}

/**
 * 実測 fidelity + coverage + test count + mutation + perf を
 * `QualityReport` に統合する。 Realtime 4 軸は fidelity + mockMetrics から
 * 自動集計。
 */
export function buildRealtimeReport(input: BuildRealtimeReportInput): QualityReport {
  const costPerEvent = input.costPerEventUsd ?? 0.00001;
  const eventCount =
    input.mockMetrics.publishCount + input.mockMetrics.eventsDelivered;
  const totalCostUsd = eventCount * costPerEvent;
  const perRequestCost =
    input.mockMetrics.publishCount > 0
      ? totalCostUsd / input.mockMetrics.publishCount
      : totalCostUsd;

  const latencySamples = [
    ...input.mockMetrics.subscribeLatencyMs,
    ...input.mockMetrics.publishLatencyMs,
  ];

  const accuracySamples = input.fidelity.records.map((r) => r.accuracyScore);

  const surface = input.surfaceCoverage ?? { mockCoveredMethods: 4, realTotalMethods: 4 };
  const testCount = testCountFromCategories(
    input.testCount ?? { behavior: 0, integration: 0, e2e: 0 },
  );
  const coverage = input.coverageV8Summary
    ? coverageFromV8Summary(input.coverageV8Summary)
    : { line: 100, branch: 100, function: 100 };
  const mutation = input.mutation
    ? mutationFromCounts(input.mutation)
    : { mutations: 0, killed: 0, survived: 0, killRate: 0 };
  const perf = perfFromSamples(input.perfSamplesMs ?? latencySamples);

  // payload の byte 数 (JSON.stringify 長) を token 相当として使う。
  // realtime は LLM と違い context 圧迫は起きないが、 帯域計測には有用。
  // quality-metrics 側で integer 制約があるため Math.round する。
  const promptTokens = input.fidelity.records.map((r) =>
    Math.max(0, Math.round(estimatePayloadBytes(r.real) / 4)),
  );
  const completionTokens = input.fidelity.records.map((r) =>
    Math.max(0, Math.round(estimatePayloadBytes(r.mock) / 4)),
  );

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
    cost: costFromSamples(
      new Array(Math.max(1, input.mockMetrics.publishCount)).fill(perRequestCost),
    ),
    latency: latencyFromSamples(latencySamples.length > 0 ? latencySamples : [0]),
    token: tokenFromSamples({
      promptTokens: promptTokens.length > 0 ? promptTokens : [0],
      completionTokens: completionTokens.length > 0 ? completionTokens : [0],
    }),
    accuracy: accuracyFromSamples({
      samples: accuracySamples.length > 0 ? accuracySamples : [1],
      method: input.fidelity.summary.accuracyMethod,
    }),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
  });
}

function estimatePayloadBytes(events: Array<{ payload?: unknown }>): number {
  let total = 0;
  for (const ev of events) {
    if (ev.payload !== undefined) {
      total += JSON.stringify(ev.payload).length;
    }
  }
  return total;
}
