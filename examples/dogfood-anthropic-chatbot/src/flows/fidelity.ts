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
import type { ChatbotAdapter, TraceEvent } from '../adapters/interface.js';

/**
 * Fidelity harness — compares an app run under {@link makeMockAdapter}
 * against one under {@link makeRealAdapter}, feeds the divergence count
 * (SSE token diff, missing ops, unmatched behaviour) into the
 * `@kiwa/quality-metrics` 11-axis release gate, and emits a JSON +
 * markdown report so the release process can consume it.
 *
 * The dogfood app is the source of truth for whether the kiwa mock tracks
 * real Anthropic behaviour closely enough to be trusted as a mock in unit
 * tests — this harness is where that trust is measured.
 */

export interface FidelityRunInput {
  provider: string;
  version: string;
  mockTraces: TraceEvent[];
  realTraces: TraceEvent[];
  /**
   * Rolled up cost / token / latency samples the app collected while
   * driving the flows. Feed straight into the 4 AI-LLM axes.
   */
  mockCostSamplesUsd: number[];
  mockLatencySamplesMs: number[];
  mockPromptTokenSamples: number[];
  mockCompletionTokenSamples: number[];
  /** All op names the app exercises end-to-end. */
  opsUnderTest: string[];
  /**
   * Real vs mock text pairs — accuracy is calculated as the mean Jaccard
   * similarity of the two strings. When the real adapter is skipped we
   * still record a placeholder score so the harness has something to
   * report on.
   */
  accuracyPairs: Array<{ real: string; mock: string }>;
  coverageSummary: {
    lines: { pct: number };
    branches: { pct: number };
    functions: { pct: number };
  };
  testCount: { behavior: number; integration: number; e2e: number };
  mutation: { mutations: number; killed: number };
  /**
   * How many mock methods the app exercised vs the real Anthropic surface
   * — 3 methods (reply / replyStream / toolLoop) are the AC scope of
   * Issue #696.
   */
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
      mockCoveredMethods: Math.max(
        covered,
        input.surfaceCoverage.mockCoveredMethods,
      ),
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
  mock: ChatbotAdapter;
  real: ChatbotAdapter;
  run: (adapter: ChatbotAdapter) => Promise<void>;
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
      // divergences are captured in the trace; a real-mode failure must
      // not abort the harness.
    }
  }
  const m = input.mock.metrics();
  const requests = Math.max(1, m.requests);
  // quality-metrics tokenFromSamples requires non-negative integers, so
  // round per-request averages before broadcasting one sample per request.
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
