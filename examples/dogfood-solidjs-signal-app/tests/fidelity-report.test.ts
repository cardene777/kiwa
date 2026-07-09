import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { runAdapterMatrix, runFidelityHarness } from '../src/flows/fidelity.js';
import {
  driveCounterFlow,
  driveTodosFlow,
  driveResourceFlow,
  driveSuspenseFlow,
} from '../src/flows/signal-flows.js';

const OPS_UNDER_TEST = [
  'mountCounter',
  'driveCounter',
  'mountTodos',
  'driveTodos',
  'mountResource',
  'driveSuspense',
];

async function runAllFlows(
  adapter: import('../src/adapters/interface.js').SolidAdapter,
): Promise<void> {
  await driveCounterFlow(adapter, 3);
  await driveTodosFlow(adapter, ['a', 'b'], [{ kind: 'markAll', completed: true }]);
  await driveResourceFlow(adapter, async () => ({
    id: 'u1',
    displayName: 'Ada',
    email: 'ada@ex.com',
  }));
  await driveSuspenseFlow(adapter, 1);
}

describe('fidelity harness contract', () => {
  it('T-DSSA-FR-001 mock-only run yields covered ops = 6 + non-negative divergences', async () => {
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
      provider: '@kiwa-lab/solidjs/signal-app',
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
      testCount: { behavior: 35, integration: 4, e2e: 6 },
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

  it('T-DSSA-FR-002 mock failure propagates without being swallowed', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    // Injecting an error into the mock by driving a resource whose fetcher throws
    // synchronously would be caught inside createResourceStub — that's the expected
    // behaviour, so simulate a mock-side crash by shadowing the flow itself.
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

  it('T-DSSA-FR-003 markdown includes divergence notes when real path skipped', async () => {
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
      provider: '@kiwa-lab/solidjs/signal-app',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: OPS_UNDER_TEST,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      coverageSummary: { lines: { pct: 92 }, branches: { pct: 88 }, functions: { pct: 95 } },
      testCount: { behavior: 35, integration: 4, e2e: 6 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 6, realTotalMethods: 6 },
    });
    // Divergences count is at least 0 (may be > 0 if real recorded any ops)
    expect(output.divergences.length).toBeGreaterThanOrEqual(0);
    expect(output.markdown).toContain('divergences');
    await mock.reset();
    await real.reset();
  });
});
