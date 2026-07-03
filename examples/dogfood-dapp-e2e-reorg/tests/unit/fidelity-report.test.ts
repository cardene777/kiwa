/**
 * Fidelity harness tests — mock adapter walks 4 ops, real adapter env-skips,
 * runFidelityHarness diffs the traces, feeds the 11-axis release gate, and
 * emits Markdown + JSON. The tests assert the divergence count is 4 (every
 * mock-succeeds vs real-skipped op), all 11 axes are present, and the
 * fidelity ratio is 100 (mock covers every op).
 */

import { describe, expect, it } from 'vitest';
import {
  emitJson,
  emitMarkdown,
  makeMockAdapter,
  makeRealAdapter,
  runAllScenarios,
  runFidelityHarness,
  OPS_UNDER_TEST,
  MockChainState,
} from '../../src/index.js';

async function buildReport() {
  const mock = makeMockAdapter();
  const real = makeRealAdapter();
  await runAllScenarios(mock);
  try {
    await runAllScenarios(real);
  } catch {
    // skip is expected
  }

  const chainState = new MockChainState();
  for (let i = 0; i < 4; i += 1) {
    chainState.transferConfirmed(
      '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      BigInt(i + 1) * 10n ** 18n,
    );
  }

  return {
    mock,
    real,
    report: runFidelityHarness({
      provider: '@kiwa-test/dapp/reorg-dogfood',
      version: '0.1.0',
      mockTraces: mock.traces(),
      realTraces: real.traces(),
      mockLatencySamplesMs: mock.metrics().latencySamplesMs,
      coverage: { linePct: 92, branchPct: 85, functionPct: 95 },
      testCountBehavior: 10,
      mutation: { mutations: 30, killed: 22 },
      chain: {
        blockHeight: chainState.blockNumber,
        eventCount: chainState.logCount(),
      },
      abi: { transferSelector: '0xa9059cbb' },
    }),
  };
}

describe('dogfood-dapp-e2e-reorg — fidelity harness contract', () => {
  it('T-DR-FID-001 harness produces 11 axes and a matrix row per op', async () => {
    const { report } = await buildReport();
    expect(report.axes).toHaveLength(11);
    expect(report.matrix).toHaveLength(OPS_UNDER_TEST.length);
    for (const row of report.matrix) {
      expect(row.mockOk).toBe(true);
      expect(row.realOk).toBe(false);
    }
  });

  it('T-DR-FID-002 divergence count equals mock-ok vs real-skipped op count', async () => {
    const { report } = await buildReport();
    // Every mock op succeeded while real skipped → 4 behavioural divergences.
    expect(report.divergences).toHaveLength(4);
    for (const d of report.divergences) {
      expect(d.errorKind).toBe('BEHAVIORAL_DIVERGENCE');
    }
  });

  it('T-DR-FID-003 fidelity.ratio axis is 100 when mock covers every op', async () => {
    const { report } = await buildReport();
    const ratio = report.axes.find((a) => a.name === 'fidelity.ratio');
    expect(ratio).toBeDefined();
    expect(ratio!.value).toBe(100);
    expect(ratio!.pass).toBe(true);
  });

  it('T-DR-FID-004 abi.transferSelector axis fails on wrong selector', () => {
    const wrongReport = runFidelityHarness({
      provider: '@kiwa-test/dapp/reorg-dogfood',
      version: '0.1.0',
      mockTraces: [],
      realTraces: [],
      mockLatencySamplesMs: [1, 2, 3],
      coverage: { linePct: 100, branchPct: 100, functionPct: 100 },
      testCountBehavior: 10,
      mutation: { mutations: 30, killed: 22 },
      chain: { blockHeight: 100, eventCount: 100 },
      abi: { transferSelector: '0xdeadbeef' },
    });
    const abi = wrongReport.axes.find((a) => a.name === 'abi.transferSelector');
    expect(abi!.pass).toBe(false);
  });

  it('T-DR-FID-005 emitMarkdown produces the Quality Report header + 11 rows', async () => {
    const { report } = await buildReport();
    const md = emitMarkdown(report);
    expect(md).toContain('Quality Report');
    expect(md).toContain('| coverage.line |');
    expect(md).toContain('| fidelity.ratio |');
    expect(md).toContain('| abi.transferSelector |');
    // Every axis row starts with a pipe and axis name.
    for (const axis of report.axes) {
      expect(md).toContain(`| ${axis.name} |`);
    }
  });

  it('T-DR-FID-006 emitJson round-trips through JSON.parse', async () => {
    const { report } = await buildReport();
    const jsonText = emitJson(report);
    const parsed = JSON.parse(jsonText);
    expect(parsed.provider).toBe('@kiwa-test/dapp/reorg-dogfood');
    expect(parsed.axes).toHaveLength(11);
    expect(parsed.matrix).toHaveLength(4);
  });

  it('T-DR-FID-007 all 11 axes pass on the default input', async () => {
    const { report } = await buildReport();
    expect(report.passed).toBe(true);
    for (const axis of report.axes) {
      expect(axis.pass).toBe(true);
    }
  });

  it('T-DR-FID-008 perf.p95Ms axis fails when latency exceeds threshold', () => {
    const report = runFidelityHarness({
      provider: '@kiwa-test/dapp/reorg-dogfood',
      version: '0.1.0',
      mockTraces: [{ op: 'pendingTx', ok: true }],
      realTraces: [],
      mockLatencySamplesMs: [200, 300, 400], // p95 exceeds 100 ms
      coverage: { linePct: 100, branchPct: 100, functionPct: 100 },
      testCountBehavior: 10,
      mutation: { mutations: 30, killed: 22 },
      chain: { blockHeight: 100, eventCount: 100 },
      abi: { transferSelector: '0xa9059cbb' },
    });
    const perf = report.axes.find((a) => a.name === 'perf.p95Ms');
    expect(perf!.pass).toBe(false);
  });

  it('T-DR-FID-009 mutation.killRate axis fails below threshold', () => {
    const report = runFidelityHarness({
      provider: '@kiwa-test/dapp/reorg-dogfood',
      version: '0.1.0',
      mockTraces: [],
      realTraces: [],
      mockLatencySamplesMs: [1],
      coverage: { linePct: 100, branchPct: 100, functionPct: 100 },
      testCountBehavior: 10,
      mutation: { mutations: 100, killed: 30 }, // 30% kill rate
      chain: { blockHeight: 100, eventCount: 100 },
      abi: { transferSelector: '0xa9059cbb' },
    });
    const mut = report.axes.find((a) => a.name === 'mutation.killRate');
    expect(mut!.value).toBe(30);
    expect(mut!.pass).toBe(false);
  });
});
