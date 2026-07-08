/**
 * Fidelity harness — compares an app run under {@link makeMockAdapter}
 * against one under {@link makeRealAdapter}, feeds the divergence count
 * (missing ops, unmatched behaviour) into `@kiwa/quality-metrics`
 * 13-axis release gate, and emits a JSON + markdown report so the release
 * process can consume it.
 *
 * The dogfood app is the source of truth for whether the kiwa Realtime v0.2
 * QUIC multiplex mock tracks real nginx-quic behaviour closely enough to be
 * trusted as a mock in unit tests. The report tracks the same 9 ops the
 * adapter contract exposes so any divergence surfaces the op that broke.
 *
 * Realtime dogfoods use the common 7 axes (coverage 3 / fidelity / perf p95
 * / mutation / behavior test count) + optional a11y axis (v1.30-4, SaaS-tier
 * strict 0/0/0 because HTTP/3 is a transport primitive with no DOM). The
 * AI-LLM 4 axes do not apply. Connection open / stream open / write /
 * concurrent-send latency samples feed `perf.p95Ms`.
 */

import {
  a11yFromBaseline,
  assembleReport,
  coverageFromV8Summary,
  emitJson,
  emitMarkdown,
  evaluateReleaseGate,
  fidelityFromMethodCounts,
  mutationFromCounts,
  perfFromSamples,
  testCountFromCategories,
  type A11yTier,
  type QualityReport,
  type ReleaseGateVerdict,
} from '@kiwa/quality-metrics';
import type {
  Http3MultiplexAdapter,
  TraceEvent,
} from '../adapters/interface.js';

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
   * How many mock methods the app exercised vs the nginx-quic surface — 9
   * methods (openConnection / closeConnection / openStream / concurrentSend /
   * writeStream / readStream / closeStream / insertHpackHeader / resumeZeroRtt)
   * are the AC scope of Sub-Issue #974.
   */
  surfaceCoverage: { mockCoveredMethods: number; realTotalMethods: number };
  /**
   * A11y baseline totals + tier for the 13th release gate axis (v1.30-4,
   * Issue #995). Absent = keep legacy 7-axis behaviour. Transport-primitive
   * apps map to the SaaS tier (strict 0/0/0) because they emit no DOM.
   */
  a11y?: {
    totals: {
      critical?: number;
      serious?: number;
      moderate?: number;
      minor?: number;
    };
    tier?: A11yTier;
  };
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

  // exactOptionalPropertyTypes: true — spread only when defined so `a11y`
  // stays absent from the report object rather than being present-with-undefined.
  const assembleInput: Parameters<typeof assembleReport>[0] = {
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
  };
  if (input.a11y) {
    assembleInput.a11y = a11yFromBaseline({ totals: input.a11y.totals });
  }
  const report = assembleReport(assembleInput);

  // v1.30-4 (Issue #995) — pass a11yTier through so the 13th axis kicks in
  // for baseline-declaring apps. Absent = legacy 7-axis behaviour. Default
  // tier is SaaS (strict 0/0/0) — HTTP/3 is a transport primitive.
  const verdict = evaluateReleaseGate(
    report,
    {},
    input.a11y ? { a11yTier: input.a11y.tier ?? 'saas' } : {},
  );
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
        op: op as TraceEvent['op'],
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
        op: op as TraceEvent['op'],
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
  const observed = new Set<string>(mock.filter((e) => e.ok).map((e) => e.op));
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
 * Drive a set of flows against both adapters, capturing traces + rolled up
 * metric samples. The real adapter may be skipped — divergences are counted
 * from the trace either way.
 */
export async function runAdapterMatrix(input: {
  mock: Http3MultiplexAdapter;
  real: Http3MultiplexAdapter;
  run: (adapter: Http3MultiplexAdapter) => Promise<void>;
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
  // Combine connection open + stream open + write + concurrent-send samples
  // so `perf.p95Ms` reflects the full user-facing multiplex + resumption
  // round-trip.
  const samples = [
    ...m.openConnectionLatencySamplesMs,
    ...m.openStreamLatencySamplesMs,
    ...m.writeLatencySamplesMs,
    ...m.concurrentSendLatencySamplesMs,
  ];
  return {
    mockTraces: input.mock.traces(),
    realTraces: input.real.traces(),
    mockLatencySamplesMs: samples,
  };
}
