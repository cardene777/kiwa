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
} from '@kiwa-test/quality-metrics';
import type { AuthAdapter, TraceEvent } from '../adapters/interface.js';

/**
 * Fidelity harness — compares the trace of a mock adapter run vs a real
 * adapter run, feeds the divergence count into `@kiwa-test/quality-metrics`
 * and emits a JSON + markdown fidelity report the release-gate can consume.
 *
 * The fidelity ratio expresses "how much of the real API surface the mock
 * covers"; the behavioral divergence count expresses "how many of the ops
 * we ran diverged from real". Both feed the release gate.
 */

export interface FidelityRunInput {
  mockTraces: TraceEvent[];
  realTraces: TraceEvent[];
  /** All op names the app calls end-to-end. */
  opsUnderTest: string[];
  /**
   * Sample latencies (ms) collected while running the flows. Passed straight
   * into the quality-metrics perf axis.
   */
  perfSamplesMs: number[];
  /** Package under test — kept as a string so it can be fed by tests. */
  provider: string;
  version: string;
  /**
   * Coverage summary a real test runner would emit — for the fidelity
   * harness itself we accept an inline value so we do not need to run c8.
   */
  coverageSummary: {
    lines: { pct: number };
    branches: { pct: number };
    functions: { pct: number };
  };
  testCount: { behavior: number; integration: number; e2e: number };
  mutation: { mutations: number; killed: number };
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
      mockCoveredMethods: covered,
      realTotalMethods: input.opsUnderTest.length,
      behavioralDivergences: divergences.length,
    }),
    perf: perfFromSamples(input.perfSamplesMs),
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
    // Any op the mock ran successfully but the real adapter errored on is a
    // divergence. Any op the real adapter succeeded on but the mock failed
    // to run at all is also a divergence.
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
  // Ops that appear only on the real side (mock never invoked them) are
  // also divergences — the app under test never exercised the mock path.
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

function renderNotes(divergences: TraceEvent[], opsUnderTest: string[]): string {
  if (divergences.length === 0) {
    return `No behavioral divergences observed across ${opsUnderTest.length} ops.`;
  }
  return [
    `Observed ${divergences.length} divergences across ${opsUnderTest.length} ops:`,
    ...divergences.map((d) => `- ${d.op}: ${d.errorKind}`),
  ].join('\n');
}

/**
 * Drive a set of ops against both adapters, capturing traces + latency.
 */
export async function runAdapterMatrix(input: {
  mock: AuthAdapter;
  real: AuthAdapter;
  run: (adapter: AuthAdapter) => Promise<void>;
}): Promise<{
  mockTraces: TraceEvent[];
  realTraces: TraceEvent[];
  perfSamplesMs: number[];
}> {
  const perfSamplesMs: number[] = [];
  for (const [label, adapter] of [
    ['mock', input.mock] as const,
    ['real', input.real] as const,
  ]) {
    const start = performance.now();
    try {
      await input.run(adapter);
    } catch {
      // Divergences are captured in the traces; we do not want a real-mode
      // failure to abort the harness.
    }
    perfSamplesMs.push(performance.now() - start);
    // Label keeps eslint quiet + surfaces the loop iteration for logs.
    void label;
  }
  return {
    mockTraces: input.mock.traces(),
    realTraces: input.real.traces(),
    perfSamplesMs,
  };
}
