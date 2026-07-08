/**
 * Fidelity harness — compares a Vercel Edge run under `makeMockAdapter`
 * against one under `makeRealAdapter`, feeds the divergence count
 * (missing ops, behavioural mismatch) into the `@kiwa/quality-metrics`
 * 7-axis release gate, and emits a JSON + markdown report the release
 * process can consume.
 *
 * The dogfood app is the source of truth for whether the kiwa
 * `@kiwa/edge` v0.2 geo-replicated + edge-kv + streaming-response
 * axes track a real Vercel Edge runtime closely enough to be trusted in
 * unit tests.
 *
 * The 8 ops under test correspond to the 8 axis routing pattern:
 *  - geo-replicated: driveGeoRoute, driveGeoPrimaryWrite, driveGeoReplicaSync
 *  - edge-kv: driveKvRead, driveKvWrite, driveKvRangeQuery
 *  - streaming-response: driveSseOpen, driveSseBackpressure
 *
 * Framework dogfoods use the common 7 axes (coverage 3 / fidelity /
 * perf p95 / mutation / behavior test count). The AI-LLM 4 axes do not
 * apply — Vercel KV writes and SSE chunks are not token-priced generative
 * surfaces. Latency samples feed `perf.p95Ms` so geo-route + kv-read + SSE
 * throughput performance stays visible.
 */

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
} from '@kiwa/quality-metrics';
import type { TraceEvent, VercelEdgeAdapter } from './vercel-adapter.js';

export interface FidelityRunInput {
  provider: string;
  version: string;
  mockTraces: TraceEvent[];
  realTraces: TraceEvent[];
  mockLatencySamplesMs: number[];
  opsUnderTest: string[];
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

  const report = assembleReport({
    provider: input.provider,
    version: input.version,
    coverage: coverageFromV8Summary(input.coverageSummary),
    testCount: testCountFromCategories(input.testCount),
    fidelity: fidelityFromMethodCounts({
      // Observed-trace coverage is the source of truth. A caller-supplied
      // `surfaceCoverage.mockCoveredMethods` cannot inflate the number
      // past what the mock actually executed — the fidelity report must
      // regress visibly when an op stops recording.
      mockCoveredMethods: covered,
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
 * Drive the flows against both adapters, capturing traces + rolled up
 * latency samples. The real adapter may be skipped — divergences are
 * counted from the trace either way. Mock failures propagate: the release
 * gate must never spuriously pass on a partial trace.
 */
export async function runAdapterMatrix(input: {
  mock: VercelEdgeAdapter;
  real: VercelEdgeAdapter;
  run: (adapter: VercelEdgeAdapter) => Promise<void>;
}): Promise<{
  mockTraces: TraceEvent[];
  realTraces: TraceEvent[];
  mockLatencySamplesMs: number[];
}> {
  // Mock path must complete — a mock failure means the harness cannot
  // measure fidelity and the caller needs to know. Do not catch here.
  await input.run(input.mock);
  // Real path is allowed to throw when KIWA_MODE=real + VERCEL_KEY=1
  // are not both set (SkippedError) — divergences are recorded in the
  // trace by the adapter, and the harness proceeds with the mock's
  // measurements.
  try {
    await input.run(input.real);
  } catch {
    // Trace already reflects the failure. Downstream divergences count is
    // computed from `traces()` so this catch does not lose signal.
  }
  return {
    mockTraces: input.mock.traces(),
    realTraces: input.real.traces(),
    mockLatencySamplesMs: input.mock.metrics().latencySamplesMs.slice(),
  };
}
