/**
 * Fidelity harness — runs the same 5-op adapter surface against both
 * mock and real, diffs the trace events, and assembles a
 * `@kiwa-test/quality-metrics` release-gate report.
 *
 * The comparison is per-op: an op that succeeds in mock but is
 * `VECTOR_ENV_MISSING` / `REAL_ADAPTER_NOT_IMPLEMENTED` in real is a
 * well-defined divergence; the harness records it and lets the release
 * gate decide the verdict.
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
} from '@kiwa-test/quality-metrics';
import type {
  TraceEvent,
  VectorSearchAdapter,
} from '../adapters/interface.js';

export interface FidelityRunInput {
  mockTraces: TraceEvent[];
  realTraces: TraceEvent[];
  opsUnderTest: string[];
  perfSamplesMs: number[];
  provider: string;
  version: string;
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
    return `No behavioral divergences observed across ${opsUnderTest.length} ops.`;
  }
  return [
    `Observed ${divergences.length} divergences across ${opsUnderTest.length} ops:`,
    ...divergences.map((d) => `- ${d.op}: ${d.errorKind}`),
  ].join('\n');
}

export async function runAdapterMatrix(input: {
  mock: VectorSearchAdapter;
  real: VectorSearchAdapter;
  run: (adapter: VectorSearchAdapter) => Promise<void>;
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
      // Divergences captured in traces; do not abort on real-mode failure.
    }
    perfSamplesMs.push(performance.now() - start);
    void label;
  }
  return {
    mockTraces: input.mock.traces(),
    realTraces: input.real.traces(),
    perfSamplesMs,
  };
}
