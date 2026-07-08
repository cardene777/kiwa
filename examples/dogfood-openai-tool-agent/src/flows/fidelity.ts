import {
  accuracyFromSamples,
  assembleReport,
  costFromSamples,
  coverageFromV8Summary,
  emitJson,
  emitMarkdown,
  evaluateReleaseGate,
  fidelityFromMethodCounts,
  latencyFromSamples,
  mutationFromCounts,
  perfFromSamples,
  testCountFromCategories,
  tokenFromSamples,
  type QualityReport,
  type ReleaseGateVerdict,
} from '@kiwa/quality-metrics';
import { jaccardSimilarity } from '@kiwa/ai-llm';
import type { AgentAdapter, TraceEvent } from '../adapters/interface.js';

/**
 * Fidelity harness — compares an app run under {@link makeMockAdapter}
 * against one under {@link makeRealAdapter}, aggregates cost / token /
 * latency samples, computes a Jaccard-based accuracy score between real
 * and mock final texts, and produces a `@kiwa/quality-metrics` 11-axis
 * report + release gate verdict + markdown / JSON snapshots.
 *
 * The dogfood app is the source of truth for whether the kiwa OpenAI mock
 * tracks real behaviour closely enough to trust in downstream unit tests —
 * this harness is where that trust is measured for function calling +
 * multi-tool orchestration + parallel tool calls (Issue #697 AC 3.1-3.4).
 */

export interface FidelityRunInput {
  provider: string;
  version: string;
  mockTraces: TraceEvent[];
  realTraces: TraceEvent[];
  mockCostSamplesUsd: number[];
  mockLatencySamplesMs: number[];
  mockPromptTokenSamples: number[];
  mockCompletionTokenSamples: number[];
  /** Ops the app exercises end-to-end — used to measure surface coverage. */
  opsUnderTest: string[];
  /** Real vs mock text pairs — accuracy = mean Jaccard similarity. */
  accuracyPairs: Array<{ real: string; mock: string }>;
  coverageSummary: {
    lines: { pct: number };
    branches: { pct: number };
    functions: { pct: number };
  };
  testCount: { behavior: number; integration: number; e2e: number };
  mutation: { mutations: number; killed: number };
  surfaceCoverage: { mockCoveredMethods: number; realTotalMethods: number };
}

export interface FidelityRunOutput {
  divergences: TraceEvent[];
  report: QualityReport;
  verdict: ReleaseGateVerdict;
  markdown: string;
  json: string;
}

export function runFidelityHarness(input: FidelityRunInput): FidelityRunOutput {
  const divergences = compareTraces(input.mockTraces, input.realTraces);
  const covered = countCoveredOps(input.mockTraces, input.opsUnderTest);
  const accuracySamples = input.accuracyPairs.map((pair) =>
    jaccardSimilarity(pair.real, pair.mock),
  );

  const report = assembleReport({
    provider: input.provider,
    version: input.version,
    coverage: coverageFromV8Summary(input.coverageSummary),
    testCount: testCountFromCategories(input.testCount),
    fidelity: fidelityFromMethodCounts({
      mockCoveredMethods: Math.max(covered, input.surfaceCoverage.mockCoveredMethods),
      realTotalMethods: input.surfaceCoverage.realTotalMethods,
      behavioralDivergences: divergences.length,
    }),
    perf: perfFromSamples(input.mockLatencySamplesMs),
    mutation: mutationFromCounts(input.mutation),
    cost: costFromSamples(input.mockCostSamplesUsd),
    latency: latencyFromSamples(input.mockLatencySamplesMs),
    token: tokenFromSamples({
      promptTokens: input.mockPromptTokenSamples,
      completionTokens: input.mockCompletionTokenSamples,
    }),
    accuracy: accuracyFromSamples({ samples: accuracySamples, method: 'jaccard' }),
    notes: renderNotes(divergences, input.opsUnderTest, accuracySamples),
  });

  const verdict = evaluateReleaseGate(report);
  return {
    divergences,
    report,
    verdict,
    markdown: emitMarkdown({ report, verdict }),
    json: emitJson(report),
  };
}

function compareTraces(mock: TraceEvent[], real: TraceEvent[]): TraceEvent[] {
  const divergences: TraceEvent[] = [];
  const mockByOp = groupByOp(mock);
  const realByOp = groupByOp(real);
  for (const [op, mockEntries] of mockByOp) {
    const realEntries = realByOp.get(op) ?? [];
    const mockOk = mockEntries.some((e) => e.ok);
    const realOk = realEntries.some((e) => e.ok);
    if (mockOk !== realOk) {
      divergences.push({
        op,
        ok: false,
        errorKind: 'BEHAVIORAL_DIVERGENCE',
        detail: {
          mockOk,
          realOk,
          realErrorKinds: realEntries.map((e) => e.errorKind).filter(Boolean),
        },
      });
    }
    // Detail-level divergence: when both adapters recorded success, compare
    // the trace `detail` payload we captured on each op — the tool call
    // order + parallel batch shape are directly diffable. This lifts the
    // harness from "op success" to "op observable behaviour".
    if (mockOk && realOk) {
      const mockOk1 = mockEntries.find((e) => e.ok);
      const realOk1 = realEntries.find((e) => e.ok);
      const mockOrder = extractToolCallOrder(mockOk1);
      const realOrder = extractToolCallOrder(realOk1);
      if (mockOrder !== undefined && realOrder !== undefined && !arraysEqual(mockOrder, realOrder)) {
        divergences.push({
          op,
          ok: false,
          errorKind: 'TOOL_ORDER_DIVERGENCE',
          detail: { mockOrder, realOrder },
        });
      }
      const mockBatches = extractParallelBatches(mockOk1);
      const realBatches = extractParallelBatches(realOk1);
      if (mockBatches !== undefined && realBatches !== undefined && !arraysEqual(mockBatches, realBatches)) {
        divergences.push({
          op,
          ok: false,
          errorKind: 'PARALLEL_SHAPE_DIVERGENCE',
          detail: { mockBatches, realBatches },
        });
      }
    }
  }
  for (const [op, realEntries] of realByOp) {
    if (!mockByOp.has(op)) {
      divergences.push({
        op,
        ok: false,
        errorKind: 'MOCK_MISSING_OP',
        detail: { realEntries },
      });
    }
  }
  return divergences;
}

function extractToolCallOrder(event: TraceEvent | undefined): string[] | undefined {
  const value = event?.detail?.['toolCallOrder'];
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
    ? (value as string[])
    : undefined;
}

function extractParallelBatches(event: TraceEvent | undefined): number[] | undefined {
  const value = event?.detail?.['parallelBatches'];
  return Array.isArray(value) && value.every((v) => typeof v === 'number')
    ? (value as number[])
    : undefined;
}

function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return false;
  return true;
}

function groupByOp(events: TraceEvent[]): Map<string, TraceEvent[]> {
  const out = new Map<string, TraceEvent[]>();
  for (const e of events) {
    const list = out.get(e.op) ?? [];
    list.push(e);
    out.set(e.op, list);
  }
  return out;
}

function countCoveredOps(mock: TraceEvent[], opsUnderTest: string[]): number {
  const observed = new Set(mock.filter((e) => e.ok).map((e) => e.op));
  return opsUnderTest.filter((op) => observed.has(op)).length;
}

function renderNotes(
  divergences: TraceEvent[],
  opsUnderTest: string[],
  accuracySamples: number[],
): string {
  const n = accuracySamples.length;
  const avg = n === 0 ? 0 : accuracySamples.reduce((s, v) => s + v, 0) / n;
  const acc = `Mean Jaccard accuracy across ${n} pair(s): ${avg.toFixed(3)}.`;
  if (divergences.length === 0) {
    return [
      `No behavioral divergences observed across ${opsUnderTest.length} ops.`,
      acc,
    ].join(' ');
  }
  return [
    `Observed ${divergences.length} divergences across ${opsUnderTest.length} ops:`,
    ...divergences.map((d) => `- ${d.op}: ${d.errorKind}`),
    acc,
  ].join('\n');
}

/**
 * Drive a set of flows against both adapters, capturing traces + rolled up
 * metric samples. The real adapter may be skipped — divergences are counted
 * from the trace either way.
 */
export async function runAdapterMatrix(input: {
  mock: AgentAdapter;
  real: AgentAdapter;
  run: (adapter: AgentAdapter) => Promise<void>;
}): Promise<{
  mockTraces: TraceEvent[];
  realTraces: TraceEvent[];
  mockCostSamplesUsd: number[];
  mockLatencySamplesMs: number[];
  mockPromptTokenSamples: number[];
  mockCompletionTokenSamples: number[];
}> {
  for (const adapter of [input.mock, input.real]) {
    try {
      await input.run(adapter);
    } catch {
      // Divergences captured in the trace; real-mode failure must not
      // abort the harness so mock coverage stays observable.
    }
  }
  const m = input.mock.metrics();
  const requests = Math.max(1, m.requests);
  const avgPrompt = Math.max(0, Math.round(m.totalPromptTokens / requests));
  const avgCompletion = Math.max(0, Math.round(m.totalCompletionTokens / requests));
  const avgCostUsd = m.totalCostUsd / requests;
  return {
    mockTraces: input.mock.traces(),
    realTraces: input.real.traces(),
    mockCostSamplesUsd: m.latencySamplesMs.map(() => avgCostUsd),
    mockLatencySamplesMs: m.latencySamplesMs.slice(),
    mockPromptTokenSamples: m.latencySamplesMs.map(() => avgPrompt),
    mockCompletionTokenSamples: m.latencySamplesMs.map(() => avgCompletion),
  };
}
