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
import type { FormCTAdapter, TraceEvent } from '../adapters/interface.js';

/**
 * Fidelity harness — compares a Playwright CT form run under
 * `makeMockAdapter` against one under `makeRealAdapter`, feeds the divergence
 * count (missing ops, unmatched behaviour) into the `@kiwa-test/quality-metrics`
 * 7-axis release gate, and emits a JSON + markdown report.
 *
 * The dogfood app is the source of truth for whether the kiwa
 * `@kiwa-test/component` `createPlaywrightCTMock` tracks real Playwright CT
 * closely enough to be trusted in unit tests — this harness is where that
 * trust is measured.
 *
 * Component dogfoods use the common 7 axes (coverage 3 / fidelity / perf p95 /
 * mutation / behavior test count). The AI-LLM 4 axes (cost / latency / token /
 * accuracy) do not apply — CT is a rendering + interaction surface, not a
 * token-priced generative surface. Latency samples still feed `perf.p95Ms`
 * (the mount + interact round-trip axis) so form CT performance stays visible
 * in the report.
 */

export interface FidelityRunInput {
  provider: string;
  version: string;
  mockTraces: TraceEvent[];
  realTraces: TraceEvent[];
  /** Latency samples the app collected while driving the flows (ms). */
  mockLatencySamplesMs: number[];
  /** All op names the app exercises end-to-end. */
  opsUnderTest: string[];
  coverageSummary: {
    lines: { pct: number };
    branches: { pct: number };
    functions: { pct: number };
  };
  testCount: { behavior: number; integration: number; e2e: number };
  mutation: { mutations: number; killed: number };
  /**
   * How many mock ops the app exercised vs the real Playwright CT adapter
   * surface — 4 ops (mount / interactValidation / interactSubmit / checkA11y)
   * are the AC scope of Issue #765.
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

function renderNotes(divergences: TraceEvent[], opsUnderTest: string[]): string {
  if (divergences.length === 0) {
    return `No behavioural divergences observed across ${opsUnderTest.length} ops.`;
  }
  return [
    `Observed ${divergences.length} divergences across ${opsUnderTest.length} ops:`,
    ...divergences.map((d) => `- ${d.op}: ${d.errorKind}`),
  ].join('\n');
}

/**
 * Drive the 4 form flows against both adapters, capturing traces + rolled up
 * latency samples. The real adapter may be skipped — divergences are counted
 * from the trace either way. Mock failures propagate: the release gate must
 * never spuriously pass on a partial trace.
 */
export async function runAdapterMatrix(input: {
  mock: FormCTAdapter;
  real: FormCTAdapter;
  run: (adapter: FormCTAdapter) => Promise<void>;
}): Promise<{
  mockTraces: TraceEvent[];
  realTraces: TraceEvent[];
  mockLatencySamplesMs: number[];
}> {
  // Mock path must complete — a mock failure means the harness cannot measure
  // fidelity and the caller needs to know. Do not catch here.
  await input.run(input.mock);
  // Real path is allowed to throw when PW_CT_ENDPOINT is unset (SkippedError)
  // or when the live driver is not implemented — the divergence is recorded
  // in the trace by the adapter, and the harness proceeds with the mock's
  // measurements. Only real-mode exceptions are swallowed.
  try {
    await input.run(input.real);
  } catch {
    // Trace already reflects the failure (PW_CT_REAL_ENV_MISSING /
    // PW_CT_LIVE_NOT_IMPLEMENTED). Downstream divergences count is computed
    // from `traces()` so this catch does not lose signal.
  }
  return {
    mockTraces: input.mock.traces(),
    realTraces: input.real.traces(),
    mockLatencySamplesMs: input.mock.metrics().latencySamplesMs.slice(),
  };
}
