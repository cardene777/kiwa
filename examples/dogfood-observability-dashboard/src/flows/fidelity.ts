import {
  assembleReport,
  coverageFromV8Summary,
  emitJson,
  emitMarkdown,
  evaluateReleaseGate,
  fidelityFromMethodCounts,
  mutationFromCounts,
  perfFromSamples,
  testCountFromCategories,
  type QualityReport,
  type ReleaseGateVerdict,
} from '@kiwa-lab/quality-metrics';
import type { DashboardAdapter, TraceEvent } from '../adapters/interface.js';

/**
 * Fidelity harness — compares an app run under {@link makeMockAdapter}
 * against one under {@link makeRealAdapter}, feeds the divergence count
 * (missing ops, unmatched behaviour) into the `@kiwa-lab/quality-metrics`
 * 7-axis release gate, and emits a JSON + markdown report so the release
 * process can consume it.
 *
 * The dogfood app is the source of truth for whether the kiwa
 * `@kiwa-lab/observability` DashboardMock tracks real Prometheus /
 * Grafana behaviour closely enough to be trusted as a mock in unit
 * tests — this harness is where that trust is measured.
 *
 * Observability-dashboard dogfoods use the common 7 axes (coverage 3 /
 * fidelity / perf p95 / mutation / behavior test count). The AI-LLM 4
 * axes (cost / latency / token / accuracy) do not apply — Prometheus is
 * a metrics primitive, not a token-priced generative call. Query
 * latency samples still feed `perf.p95Ms` (the HTTP query round-trip
 * axis) so dashboard performance stays visible in the report.
 */

export interface FidelityRunInput {
  provider: string;
  version: string;
  mockTraces: TraceEvent[];
  realTraces: TraceEvent[];
  /** Latency samples the app collected while driving the flows (ms). */
  mockLatencySamplesMs: number[];
  /** All op names the app exercises end-to-end. */
  opsUnderTest: readonly string[];
  coverageSummary: {
    lines: { pct: number };
    branches: { pct: number };
    functions: { pct: number };
  };
  testCount: { behavior: number; integration: number; e2e: number };
  mutation: { mutations: number; killed: number };
  /**
   * How many mock ops the app exercised vs the real Prometheus surface —
   * the 2 ops (`runQuery` / `refreshDashboard`) scope the AC of Issue
   * #779.
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
    notes: renderNotes(divergences, input.opsUnderTest),
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
        detail: JSON.stringify({
          mockOk,
          realOk,
          realErrorKinds: realEntries.map((e) => e.errorKind).filter(Boolean),
        }),
      });
    }
  }
  for (const [op, realEntries] of realByOp) {
    if (!mockByOp.has(op)) {
      divergences.push({
        op,
        ok: false,
        errorKind: 'BEHAVIORAL_DIVERGENCE',
        detail: JSON.stringify({ mockMissingOp: true, realEntries }),
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

function countCoveredOps(mock: TraceEvent[], opsUnderTest: readonly string[]): number {
  const observed = new Set(mock.filter((e) => e.ok).map((e) => e.op));
  return opsUnderTest.filter((op) => observed.has(op)).length;
}

function renderNotes(
  divergences: TraceEvent[],
  opsUnderTest: readonly string[],
): string {
  if (divergences.length === 0) {
    return `No behavioral divergences observed across ${opsUnderTest.length} ops.`;
  }
  return [
    `Observed ${divergences.length} divergences across ${opsUnderTest.length} ops:`,
    ...divergences.map((d) => `- ${d.op}: ${d.errorKind}`),
  ].join('\n');
}

/**
 * Drive a set of flows against both adapters, capturing traces + rolled
 * up query latency samples. The real adapter may be skipped —
 * divergences are counted from the trace either way.
 */
export async function runAdapterMatrix(input: {
  mock: DashboardAdapter;
  real: DashboardAdapter;
  run: (adapter: DashboardAdapter) => Promise<void>;
}): Promise<{
  mockTraces: TraceEvent[];
  realTraces: TraceEvent[];
  mockLatencySamplesMs: number[];
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
  // Combine query + refresh latency samples so `perf.p95Ms` reflects
  // the end-to-end HTTP path a Grafana user sees on the dashboard page.
  const samples = [...m.queryLatencySamplesMs, ...m.refreshLatencySamplesMs];
  return {
    mockTraces: input.mock.traces(),
    realTraces: input.real.traces(),
    mockLatencySamplesMs: samples,
  };
}
