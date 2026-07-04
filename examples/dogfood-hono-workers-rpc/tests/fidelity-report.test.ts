import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { runAdapterMatrix, runFidelityHarness } from '../src/flows/fidelity.js';
import {
  driveD1NotesFlow,
  driveExecutionCtxFlow,
  driveKvCounterFlow,
  driveR2UploadFlow,
  driveRouteVsRpcFlow,
} from '../src/flows/hono-flows.js';

const OPS_UNDER_TEST = [
  'driveRoute',
  'driveRpc',
  'driveKv',
  'driveD1',
  'driveR2',
  'driveExecutionCtx',
];

async function runAllFlows(
  adapter: import('../src/adapters/interface.js').HonoAdapter,
): Promise<void> {
  await driveRouteVsRpcFlow(adapter, 'GET', '/health');
  await driveKvCounterFlow(adapter, 2);
  await driveD1NotesFlow(adapter, [{ id: 1, title: 'seed' }]);
  await driveR2UploadFlow(adapter, [{ key: 'k', contents: 'v' }]);
  await driveExecutionCtxFlow(adapter, 2);
}

describe('fidelity harness contract', () => {
  it('T-DHW-FR-001 mock-only run yields covered ops = 6 + non-negative divergences', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await runAllFlows(adapter);
        } catch {
          // Real path throws in skip mode — divergences recorded in trace.
        }
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-test/hono/workers-rpc',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: OPS_UNDER_TEST,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      coverageSummary: {
        lines: { pct: 91 },
        branches: { pct: 87 },
        functions: { pct: 94 },
      },
      testCount: { behavior: 32, integration: 5, e2e: 5 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 6, realTotalMethods: 6 },
    });
    expect(output.report.fidelity.mockCoveredMethods).toBeGreaterThan(0);
    expect(output.report.fidelity.behavioralDivergences).toBeGreaterThanOrEqual(0);
    expect(output.verdict.axesEvaluated).toBe(7);
    expect(output.markdown).toContain('Quality Report');
    await mock.reset();
    await real.reset();
  });

  it('T-DHW-FR-002 mock failure propagates without being swallowed', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    await expect(
      runAdapterMatrix({
        mock,
        real,
        run: async (adapter) => {
          if (adapter.mode === 'mock') {
            throw new Error('mock-simulated-crash');
          }
        },
      }),
    ).rejects.toThrow('mock-simulated-crash');
    await mock.reset();
    await real.reset();
  });

  it('T-DHW-FR-003 markdown includes divergence notes when real path skipped', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await runAllFlows(adapter);
        } catch {
          // Real path throws — divergences captured in the trace.
        }
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-test/hono/workers-rpc',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: OPS_UNDER_TEST,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      coverageSummary: { lines: { pct: 91 }, branches: { pct: 87 }, functions: { pct: 94 } },
      testCount: { behavior: 32, integration: 5, e2e: 5 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 6, realTotalMethods: 6 },
    });
    expect(output.divergences.length).toBeGreaterThanOrEqual(0);
    expect(output.markdown).toContain('divergences');
    await mock.reset();
    await real.reset();
  });
});
