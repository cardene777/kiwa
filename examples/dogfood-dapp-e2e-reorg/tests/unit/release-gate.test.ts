/**
 * Release-gate 11-axis contract — matches dogfood-reth-node-test so both dapp
 * paths converge on the same schema. The test forces every axis through the
 * harness at least once so downstream consumers (docs / VitePress / npm
 * publish) have a stable structure to bind to.
 */

import { describe, expect, it } from 'vitest';
import {
  makeMockAdapter,
  makeRealAdapter,
  MockChainState,
  runAllScenarios,
  runFidelityHarness,
} from '../../src/index.js';

const EXPECTED_AXES = [
  'coverage.line',
  'coverage.branch',
  'coverage.function',
  'fidelity.ratio',
  'fidelity.matrix.rows',
  'perf.p95Ms',
  'mutation.killRate',
  'testCount.behavior',
  'chain.blockHeight',
  'chain.eventCount',
  'abi.transferSelector',
];

async function computeAxes() {
  const mock = makeMockAdapter();
  const real = makeRealAdapter();
  await runAllScenarios(mock);
  try {
    await runAllScenarios(real);
  } catch {
    // skip is expected
  }
  const chain = new MockChainState();
  for (let i = 0; i < 4; i += 1) {
    chain.transferConfirmed(
      '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
      BigInt(i + 1) * 10n ** 18n,
    );
  }
  return runFidelityHarness({
    provider: '@kiwa-test/dapp/reorg-dogfood',
    version: '0.1.0',
    mockTraces: mock.traces(),
    realTraces: real.traces(),
    mockLatencySamplesMs: mock.metrics().latencySamplesMs,
    coverage: { linePct: 92, branchPct: 85, functionPct: 95 },
    testCountBehavior: 10,
    mutation: { mutations: 30, killed: 22 },
    chain: {
      blockHeight: chain.blockNumber,
      eventCount: chain.logCount(),
    },
    abi: { transferSelector: '0xa9059cbb' },
  }).axes;
}

describe('dogfood-dapp-e2e-reorg — release-gate 11-axis contract', () => {
  it('T-DR-GATE-001 all 11 expected axes present in order', async () => {
    const axes = await computeAxes();
    expect(axes.map((a) => a.name)).toEqual(EXPECTED_AXES);
  });

  it('T-DR-GATE-002 all 11 axes pass on the default input', async () => {
    const axes = await computeAxes();
    for (const axis of axes) {
      expect(axis.pass).toBe(true);
    }
  });

  it('T-DR-GATE-003 fidelity.matrix.rows axis is at least 4 (one per op)', async () => {
    const axes = await computeAxes();
    const rows = axes.find((a) => a.name === 'fidelity.matrix.rows');
    expect(rows!.value).toBeGreaterThanOrEqual(4);
  });

  it('T-DR-GATE-004 chain.blockHeight axis reflects the harness chain state', async () => {
    const axes = await computeAxes();
    const bh = axes.find((a) => a.name === 'chain.blockHeight');
    expect(bh!.value).toBe(4);
  });

  it('T-DR-GATE-005 chain.eventCount axis reflects transferConfirmed count', async () => {
    const axes = await computeAxes();
    const ec = axes.find((a) => a.name === 'chain.eventCount');
    expect(ec!.value).toBe(4);
  });

  it('T-DR-GATE-006 abi.transferSelector axis matches canonical ERC-20 selector', async () => {
    const axes = await computeAxes();
    const abi = axes.find((a) => a.name === 'abi.transferSelector');
    expect(abi!.value).toBe(1);
    expect(abi!.pass).toBe(true);
  });
});
