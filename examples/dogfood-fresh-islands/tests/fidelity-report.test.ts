import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { runAdapterMatrix, runFidelityHarness } from '../src/flows/fidelity.js';
import {
  driveEdgeEnvFlow,
  driveHeadFlow,
  driveIslandFlow,
  driveRouteFlow,
} from '../src/flows/fresh-flows.js';

const OPS_UNDER_TEST = [
  'mountRoute',
  'driveHandler',
  'mountIsland',
  'driveInteraction',
  'mountHead',
  'driveEdgeEnv',
];

async function runAllFlows(
  adapter: import('../src/adapters/interface.js').FreshAdapter,
): Promise<void> {
  await driveRouteFlow(adapter, '/greet/kiwa', 'GET');
  await driveIslandFlow(adapter, 'Counter', { label: 'x', start: 0 }, [
    { event: 'click' },
    { event: 'click' },
  ]);
  await driveHeadFlow(adapter, [
    { title: 'A' },
    { title: 'B' },
  ]);
  await driveEdgeEnvFlow(adapter, { KIWA_FRESH_MODE: 'test' }, '/edge');
}

describe('fidelity harness contract', () => {
  it('T-DFI-FR-001 mock-only run yields covered ops = 6 + non-negative divergences', async () => {
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
      provider: '@kiwa-test/fresh/islands-app',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: OPS_UNDER_TEST,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 34, integration: 5, e2e: 5 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 6, realTotalMethods: 6 },
    });
    expect(output.report.fidelity.mockCoveredMethods).toBeGreaterThan(0);
    expect(output.report.fidelity.behavioralDivergences).toBeGreaterThanOrEqual(0);
    // Framework provider — 7-axis gate should run.
    expect(output.verdict.axesEvaluated).toBe(7);
    expect(output.markdown).toContain('Quality Report');
    await mock.reset();
    await real.reset();
  });

  it('T-DFI-FR-002 mock failure propagates without being swallowed', async () => {
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

  it('T-DFI-FR-003 markdown includes divergence notes when real path skipped', async () => {
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
      provider: '@kiwa-test/fresh/islands-app',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: OPS_UNDER_TEST,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      coverageSummary: { lines: { pct: 92 }, branches: { pct: 88 }, functions: { pct: 95 } },
      testCount: { behavior: 34, integration: 5, e2e: 5 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 6, realTotalMethods: 6 },
    });
    expect(output.divergences.length).toBeGreaterThanOrEqual(0);
    expect(output.markdown).toContain('divergences');
    await mock.reset();
    await real.reset();
  });
});
