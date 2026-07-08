/**
 * Fidelity harness — runs the same 9-op adapter surface against both mock
 * and real, diffs the trace events, and assembles a
 * `@kiwa/quality-metrics` release-gate report.
 *
 * The comparison is per-op: an op that succeeds in mock but is
 * `NOT_IMPLEMENTED` in real is a well-defined divergence, the harness
 * records it and lets the release gate decide the verdict.
 *
 * v1.31-3 upgrades the harness to the 13-axis release gate (7 common +
 * 4 AI-LLM inactive + 1 mutation.tier + 1 a11y.tier) by accepting optional
 * tier + a11y baseline inputs, matching the sibling v1.31-2 kafka-event-
 * pipeline shape.
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
  type MutationTier,
  type QualityReport,
  type ReleaseGateVerdict,
} from '@kiwa/quality-metrics';
import type {
  RedpandaSchemaRegistryAdapter,
  TraceEvent,
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
  /**
   * Optional a11y baseline totals — enabling the 13th axis. The dogfood is
   * headless so the baseline is 0/0/0 by design; supplying it flips the
   * a11y axis into the evaluated set.
   */
  a11yBaseline?: {
    critical?: number;
    serious?: number;
    moderate?: number;
    minor?: number;
  };
  /**
   * Optional tier context — pass both to evaluate the full 13-axis release
   * gate (7 common + 4 AI-LLM inactive here + 1 mutation.tier + 1 a11y.tier
   * = 9 evaluated for non-AI providers, phrased "13-axis" per SSOT
   * terminology because the tier axes count the full 13-slot lane grid).
   */
  mutationTier?: MutationTier;
  a11yTier?: A11yTier;
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
  const a11y = input.a11yBaseline
    ? a11yFromBaseline({ totals: input.a11yBaseline })
    : undefined;
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
    ...(a11y ? { a11y } : {}),
    notes: renderNotes(divergences, input.opsUnderTest),
  });
  const verdict = evaluateReleaseGate(report, {}, {
    ...(input.mutationTier ? { mutationTier: input.mutationTier } : {}),
    ...(input.a11yTier ? { a11yTier: input.a11yTier } : {}),
  });
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
  mock: RedpandaSchemaRegistryAdapter;
  real: RedpandaSchemaRegistryAdapter;
  run: (adapter: RedpandaSchemaRegistryAdapter) => Promise<void>;
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
