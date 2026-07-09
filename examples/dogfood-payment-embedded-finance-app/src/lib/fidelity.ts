/**
 * Fidelity harness — compares an app run under {@link makeMockAdapter}
 * against one under {@link makeRealAdapter}, feeds the divergence count
 * (missing ops, unmatched behaviour) into `@kiwa-lab/quality-metrics`
 * 13-axis release gate, and emits a JSON + markdown report so the release
 * process can consume it.
 *
 * The dogfood app is the source of truth for whether the v1.41-1
 * `@kiwa-lab/payment` v0.5 embedded-finance helpers track the real
 * Stripe Treasury / Unit / Column broker behaviour closely enough to be
 * trusted as a mock in unit tests. The report tracks the same 15 ops
 * the adapter contract exposes so any divergence surfaces the op that
 * broke.
 *
 * Payment dogfoods use the common 7 axes (coverage 3 / fidelity / perf
 * p95 / mutation / behavior test count) + optional a11y axis. The AI-LLM
 * 4 axes (cost / latency / token / accuracy) do not apply. Treasury /
 * card / kyc latency samples feed `perf.p95Ms` so end-user timings stay
 * visible.
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
} from '@kiwa-lab/quality-metrics';
import type { PaymentAdapter, TraceEvent } from '../adapters/interface.js';

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
   * How many mock methods the app exercised vs the treasury + card + kyc
   * surface — 15 ops (startTreasury / openAccount / fundAccount /
   * transferFunds / closeTreasury / startCard / issueCard / activateCard /
   * spendCard / closeCard / startKyc / verifyIndividual / verifyBusiness /
   * checkScoreThreshold / closeKyc) are the AC scope of Issue CAR-978.
   */
  surfaceCoverage: { mockCoveredMethods: number; realTotalMethods: number };
  /**
   * A11y baseline totals + tier for the 13th release gate axis (v1.30-4).
   * Absent = keep the legacy 7-axis behaviour so this test suite does not
   * regress before the app declares an axe-config baseline. The payment
   * dogfood maps to the SaaS tier (strict 0/0/0) by default because the
   * mock adapter emits no DOM.
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

  const assembleInput: Parameters<typeof assembleReport>[0] = {
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
    notes: renderNotes(divergences, input.opsUnderTest),
  };
  if (input.a11y) {
    assembleInput.a11y = a11yFromBaseline({ totals: input.a11y.totals });
  }
  const report = assembleReport(assembleInput);

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
 * Drive a set of flows against both adapters, capturing traces + latency
 * samples. The real adapter may be skipped — divergences are counted from
 * the trace either way.
 */
export async function runAdapterMatrix(input: {
  mock: PaymentAdapter;
  real: PaymentAdapter;
  run: (adapter: PaymentAdapter) => Promise<number[]>;
}): Promise<{
  mockTraces: TraceEvent[];
  realTraces: TraceEvent[];
  mockLatencySamplesMs: number[];
}> {
  let mockLatencySamplesMs: number[] = [];
  for (const adapter of [input.mock, input.real]) {
    try {
      const samples = await input.run(adapter);
      if (adapter === input.mock) {
        mockLatencySamplesMs = samples;
      }
    } catch {
      // divergences are captured in the trace; a real-mode failure must
      // not abort the harness.
    }
  }
  return {
    mockTraces: [...input.mock.traces()],
    realTraces: [...input.real.traces()],
    mockLatencySamplesMs,
  };
}
