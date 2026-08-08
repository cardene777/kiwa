/**
 * Fidelity harness — diffs the mock adapter (in-process anvil-shaped state)
 * against the real adapter (Sepolia env-skip), rolls the divergence count +
 * coverage % + latency samples into the 11-axis release gate, and emits a
 * JSON + Markdown quality report.
 *
 * The 11 axes were chosen to match the Rust dogfood (`dogfood-reth-node-test`)
 * so both dapp paths converged on one schema. #1864 removed that dogfood; the
 * schema stays because `@kiwa-lab/quality-metrics` reads it.
 */

import type { ReorgOp, TraceEvent } from '../adapters/interface.js';
import { OPS_UNDER_TEST } from '../adapters/interface.js';

export interface FidelityInput {
  provider: string;
  version: string;
  mockTraces: TraceEvent[];
  realTraces: TraceEvent[];
  mockLatencySamplesMs: number[];
  coverage: {
    linePct: number;
    branchPct: number;
    functionPct: number;
  };
  testCountBehavior: number;
  mutation: { mutations: number; killed: number };
  chain: { blockHeight: number; eventCount: number };
  abi: { transferSelector: string };
}

export interface FidelityAxis {
  name: string;
  value: number;
  threshold: number;
  pass: boolean;
}

export interface FidelityReport {
  provider: string;
  version: string;
  opsUnderTest: string[];
  mockCoveredOps: number;
  divergences: TraceEvent[];
  matrix: Array<{ op: string; mockOk: boolean; realOk: boolean }>;
  axes: FidelityAxis[];
  passed: boolean;
  notes: string;
}

const AXIS_THRESHOLDS = {
  coverageLine: 85,
  coverageBranch: 80,
  coverageFunction: 90,
  fidelityRatio: 70,
  fidelityMatrixRows: 4,
  perfP95Ms: 100,
  mutationKillRate: 60,
  testCountBehavior: 4,
  chainBlockHeight: 4,
  chainEventCount: 3,
  abiTransferSelector: 1,
} as const;

export function runFidelityHarness(input: FidelityInput): FidelityReport {
  const divergences = compareTraces(input.mockTraces, input.realTraces);
  const covered = countCoveredOps(input.mockTraces, OPS_UNDER_TEST);
  const matrix = buildMatrix(input.mockTraces, input.realTraces, OPS_UNDER_TEST);
  const perfP95 = computeP95(input.mockLatencySamplesMs);
  const killRate =
    input.mutation.mutations > 0
      ? (input.mutation.killed / input.mutation.mutations) * 100
      : 0;
  const fidelityRatio = (covered / OPS_UNDER_TEST.length) * 100;

  const axes: FidelityAxis[] = [
    axis('coverage.line', input.coverage.linePct, AXIS_THRESHOLDS.coverageLine),
    axis(
      'coverage.branch',
      input.coverage.branchPct,
      AXIS_THRESHOLDS.coverageBranch,
    ),
    axis(
      'coverage.function',
      input.coverage.functionPct,
      AXIS_THRESHOLDS.coverageFunction,
    ),
    axis('fidelity.ratio', fidelityRatio, AXIS_THRESHOLDS.fidelityRatio),
    axis(
      'fidelity.matrix.rows',
      matrix.length,
      AXIS_THRESHOLDS.fidelityMatrixRows,
      matrix.length >= AXIS_THRESHOLDS.fidelityMatrixRows,
    ),
    axis('perf.p95Ms', perfP95, AXIS_THRESHOLDS.perfP95Ms, perfP95 <= AXIS_THRESHOLDS.perfP95Ms),
    axis(
      'mutation.killRate',
      killRate,
      AXIS_THRESHOLDS.mutationKillRate,
      killRate >= AXIS_THRESHOLDS.mutationKillRate,
    ),
    axis(
      'testCount.behavior',
      input.testCountBehavior,
      AXIS_THRESHOLDS.testCountBehavior,
    ),
    axis(
      'chain.blockHeight',
      input.chain.blockHeight,
      AXIS_THRESHOLDS.chainBlockHeight,
    ),
    axis(
      'chain.eventCount',
      input.chain.eventCount,
      AXIS_THRESHOLDS.chainEventCount,
    ),
    axis(
      'abi.transferSelector',
      input.abi.transferSelector === '0xa9059cbb' ? 1 : 0,
      AXIS_THRESHOLDS.abiTransferSelector,
      input.abi.transferSelector === '0xa9059cbb',
    ),
  ];

  const passed = axes.every((a) => a.pass);

  return {
    provider: input.provider,
    version: input.version,
    opsUnderTest: OPS_UNDER_TEST as unknown as string[],
    mockCoveredOps: covered,
    divergences,
    matrix,
    axes,
    passed,
    notes: renderNotes(divergences),
  };
}

function axis(
  name: string,
  value: number,
  threshold: number,
  pass?: boolean,
): FidelityAxis {
  return {
    name,
    value,
    threshold,
    pass: pass ?? value >= threshold,
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

function countCoveredOps(mock: TraceEvent[], opsUnderTest: readonly ReorgOp[]): number {
  const observed = new Set(mock.filter((e) => e.ok).map((e) => e.op));
  return opsUnderTest.filter((op) => observed.has(op)).length;
}

function buildMatrix(
  mock: TraceEvent[],
  real: TraceEvent[],
  ops: readonly ReorgOp[],
): Array<{ op: string; mockOk: boolean; realOk: boolean }> {
  const mockByOp = groupByOp(mock);
  const realByOp = groupByOp(real);
  return ops.map((op) => ({
    op,
    mockOk: (mockByOp.get(op) ?? []).some((e) => e.ok),
    realOk: (realByOp.get(op) ?? []).some((e) => e.ok),
  }));
}

function computeP95(samples: number[]): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  return sorted[idx]!;
}

function renderNotes(divergences: TraceEvent[]): string {
  if (divergences.length === 0) {
    return 'No behavioural divergences observed.';
  }
  return [
    `Observed ${divergences.length} divergences:`,
    ...divergences.map((d) => `- ${d.op}: ${d.errorKind}`),
  ].join('\n');
}

export function emitMarkdown(report: FidelityReport): string {
  const lines: string[] = [];
  lines.push(`# Quality Report — ${report.provider} v${report.version}`);
  lines.push('');
  lines.push(`Overall verdict — **${report.passed ? 'PASS' : 'FAIL'}**`);
  lines.push('');
  lines.push('## Release gate (11 axes)');
  lines.push('');
  lines.push('| Axis | Value | Threshold | Pass |');
  lines.push('|---|---:|---:|:---:|');
  for (const a of report.axes) {
    lines.push(
      `| ${a.name} | ${a.value.toFixed(2)} | ${a.threshold.toFixed(2)} | ${a.pass ? 'YES' : 'NO'} |`,
    );
  }
  lines.push('');
  lines.push('## Fidelity matrix (mock vs real)');
  lines.push('');
  lines.push('| Op | Mock OK | Real OK |');
  lines.push('|---|:---:|:---:|');
  for (const row of report.matrix) {
    lines.push(
      `| ${row.op} | ${row.mockOk ? 'YES' : 'NO'} | ${row.realOk ? 'YES' : 'NO'} |`,
    );
  }
  lines.push('');
  lines.push('## Notes');
  lines.push('');
  lines.push(report.notes);
  return `${lines.join('\n')}\n`;
}

export function emitJson(report: FidelityReport): string {
  return `${JSON.stringify(report, replaceBigInt, 2)}\n`;
}

function replaceBigInt(_key: string, value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString();
  return value;
}
