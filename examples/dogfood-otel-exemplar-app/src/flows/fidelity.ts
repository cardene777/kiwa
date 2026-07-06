/**
 * Fidelity harness — compares an app run under {@link makeMockAdapter}
 * against one under {@link makeRealAdapter}, feeds the divergence count
 * (missing ops, unmatched behaviour) into `@kiwa-test/quality-metrics`
 * 13-axis release gate, and emits a JSON + markdown report so the
 * release process can consume it.
 *
 * The dogfood app is the source of truth for whether the v1.35-1
 * `@kiwa-test/observability` v2.1 exemplar + otel-advanced axes track
 * the production OpenTelemetry Collector + Jaeger + Prometheus + Loki
 * pipeline closely enough to be trusted as a mock in unit tests. The
 * report tracks the same 15 ops the adapter contract exposes so any
 * divergence surfaces the op that broke.
 *
 * Observability dogfoods use the common 7 axes (coverage 3 / fidelity /
 * perf p95 / mutation / behavior test count). The AI-LLM 4 axes (cost /
 * latency / token / accuracy) do not apply.
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
import type { OtelExemplarAdapter, TraceEvent } from '../adapters/interface.js';

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
   * The mock adapter walks 15 methods on the OtelExemplarAdapter surface;
   * the ops list reflects the granularity the fidelity trace tracks.
   * `mockCoveredMethods` reports how many of the 15 methods were
   * exercised (target = 15/15 = 100%).
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

  const verdict = evaluateReleaseGate(report, {}, {});
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
        bucket: mockEntries[0]?.bucket ?? '',
        neutralEvent: 'otel.behavioral_divergence',
        providerEvent: 'kiwa.behavioral_divergence',
        target: mockEntries[0]?.target ?? 'otel-collector',
        state: 'divergence',
        timestampMs: Date.now(),
        ok: false,
        errorKind: 'BEHAVIORAL_DIVERGENCE',
        metadata: {
          mockOk,
          realOk,
          realErrorKinds: realEntries
            .map((e) => e.errorKind ?? '')
            .filter((k) => k.length > 0)
            .join(','),
        },
      });
    }
  }
  for (const [op, realEntries] of realByOp) {
    if (!mockByOp.has(op)) {
      divergences.push({
        op,
        bucket: realEntries[0]?.bucket ?? '',
        neutralEvent: 'otel.mock_missing_op',
        providerEvent: 'kiwa.mock_missing_op',
        target: realEntries[0]?.target ?? 'otel-collector',
        state: 'divergence',
        timestampMs: Date.now(),
        ok: false,
        errorKind: 'MOCK_MISSING_OP',
        metadata: { realEntryCount: realEntries.length },
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

function countCoveredOps(
  mock: TraceEvent[],
  opsUnderTest: readonly string[],
): number {
  const observed = new Set<string>(mock.filter((e) => e.ok).map((e) => e.op));
  return opsUnderTest.filter((op) => observed.has(op)).length;
}

function renderNotes(
  divergences: TraceEvent[],
  opsUnderTest: readonly string[],
): string {
  if (divergences.length === 0) {
    return `No behavioral divergences observed across ${opsUnderTest.length} ops (OTEL_EXEMPLAR_HARNESS_OPS).`;
  }
  const divergentOps = Array.from(new Set(divergences.map((d) => d.op)));
  return `Divergent ops (${divergences.length}): ${divergentOps.join(', ')} of ${opsUnderTest.length} OTEL_EXEMPLAR_HARNESS_OPS.`;
}

/**
 * Convenience runner — drive both adapters through the same fixture and
 * return their traces + latency samples. Callers can then feed the
 * result to {@link runFidelityHarness}.
 */
export async function runAdapterMatrix<T>(input: {
  mock: OtelExemplarAdapter;
  real: OtelExemplarAdapter;
  run: (adapter: OtelExemplarAdapter) => Promise<T>;
}): Promise<{
  mockTraces: TraceEvent[];
  realTraces: TraceEvent[];
  mockLatencySamplesMs: number[];
  realLatencySamplesMs: number[];
}> {
  const mockLatencies: number[] = [];
  const realLatencies: number[] = [];
  const mockStart = performance.now();
  await input.run(input.mock);
  mockLatencies.push(performance.now() - mockStart);
  const realStart = performance.now();
  await input.run(input.real);
  realLatencies.push(performance.now() - realStart);
  return {
    mockTraces: input.mock.trace(),
    realTraces: input.real.trace(),
    mockLatencySamplesMs: mockLatencies,
    realLatencySamplesMs: realLatencies,
  };
}
