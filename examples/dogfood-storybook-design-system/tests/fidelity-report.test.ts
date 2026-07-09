import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { runAdapterMatrix, runFidelityHarness } from '../src/flows/fidelity.js';
import {
  registerAndDiscoverStories,
  resolveArgsForAll,
  runA11yForAll,
  runPlayFunctionsForAll,
} from '../src/flows/story-flows.js';

const opsUnderTest = [
  'registerAll',
  'listStories',
  'resolveArgs',
  'mount',
  'play',
  'runA11y',
];

describe('dogfood-storybook-design-system — fidelity harness contract (7-axis release gate)', () => {
  it('T-DFSB-FID-001 fidelity harness runs mock + skipped real, produces divergences + report', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await registerAndDiscoverStories(adapter);
          await resolveArgsForAll(adapter);
          await runPlayFunctionsForAll(adapter);
          await runA11yForAll(adapter);
        } catch {
          // Real-mode failures are recorded in the trace.
        }
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-lab/component/storybook-design-system',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 53, integration: 6, e2e: 7 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 6, realTotalMethods: 6 },
    });

    // 7-axis provider (component prefix, not AI-LLM).
    expect(output.verdict.axesEvaluated).toBe(7);
    expect(output.report.fidelity.mockCoveredMethods).toBeGreaterThan(0);
    expect(output.report.fidelity.behavioralDivergences).toBeGreaterThan(0);
    expect(output.markdown).toContain('Quality Report');
    expect(output.json).toContain('"provider"');
    await mock.reset();
    await real.reset();
  });

  it('T-DFSB-FID-002 divergences include every op the real adapter skipped', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await registerAndDiscoverStories(adapter);
          await runPlayFunctionsForAll(adapter);
        } catch {
          // Skip failures recorded in trace.
        }
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-lab/component/storybook-design-system',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 53, integration: 6, e2e: 7 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 5, realTotalMethods: 6 },
    });
    // At least the ops the flow exercised in mock mode should appear as
    // divergences (mockOk=true / realOk=false) because the real adapter
    // reports STORYBOOK_REAL_ENV_MISSING for every op.
    const divergentOps = new Set(output.divergences.map((d) => d.op));
    expect(divergentOps.has('registerAll')).toBe(true);
    expect(divergentOps.has('listStories')).toBe(true);
    await mock.reset();
    await real.reset();
  });

  it('T-DFSB-FID-003 mockLatencySamplesMs are non-empty and non-negative', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await registerAndDiscoverStories(adapter);
          await runA11yForAll(adapter);
        } catch {
          // Real-mode failures are recorded in the trace.
        }
      },
    });
    expect(matrix.mockLatencySamplesMs.length).toBeGreaterThan(0);
    for (const sample of matrix.mockLatencySamplesMs) {
      expect(sample).toBeGreaterThanOrEqual(0);
    }
    await mock.reset();
    await real.reset();
  });

  it('T-DFSB-FID-004 mock adapter failures propagate through runAdapterMatrix', async () => {
    // A mock adapter that always throws must fail the matrix — the release
    // gate cannot silently pass on a partial trace. Real-mode failures are
    // still swallowed (skipped adapter is normal), but mock failures are not.
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    await expect(
      runAdapterMatrix({
        mock,
        real,
        run: async (adapter) => {
          if (adapter.mode === 'mock') {
            throw new Error('injected mock failure');
          }
        },
      }),
    ).rejects.toThrow(/injected mock failure/);
    await mock.reset();
    await real.reset();
  });
});
