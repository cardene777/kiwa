import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { runAdapterMatrix, runFidelityHarness } from '../src/flows/fidelity.js';
import {
  computeStoryCoverage,
  registerAndDiscoverStories,
  renderAllMdxDocs,
  resolveArgsForAll,
  runA11yForAll,
  runInteractionFocusStories,
} from '../src/flows/story-flows.js';

const opsUnderTest = [
  'registerAll',
  'listStories',
  'resolveArgs',
  'mount',
  'renderMdx',
  'runInteraction',
  'runA11y',
  'computeCoverage',
];

describe('dogfood-storybook-8-mdx-app — fidelity harness (7-axis release gate)', () => {
  it('T-DFSMDX-FID-001 fidelity harness runs mock + skipped real, produces divergences + report', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await registerAndDiscoverStories(adapter);
          await resolveArgsForAll(adapter);
          await renderAllMdxDocs(adapter);
          await runInteractionFocusStories(adapter);
          await runA11yForAll(adapter);
          await computeStoryCoverage(adapter);
        } catch {
          // Real-mode failures are recorded in the trace.
        }
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa/component/storybook-8-mdx',
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
      testCount: { behavior: 45, integration: 4, e2e: 0 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 8, realTotalMethods: 8 },
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

  it('T-DFSMDX-FID-002 divergences include every op the real adapter skipped', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await registerAndDiscoverStories(adapter);
          await renderAllMdxDocs(adapter);
          await runInteractionFocusStories(adapter);
        } catch {
          // Skip failures recorded in trace.
        }
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa/component/storybook-8-mdx',
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
      testCount: { behavior: 45, integration: 4, e2e: 0 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 6, realTotalMethods: 8 },
    });
    const divergentOps = new Set(output.divergences.map((d) => d.op));
    expect(divergentOps.has('registerAll')).toBe(true);
    expect(divergentOps.has('renderMdx')).toBe(true);
    expect(divergentOps.has('runInteraction')).toBe(true);
    await mock.reset();
    await real.reset();
  });

  it('T-DFSMDX-FID-003 mockLatencySamplesMs are non-empty and non-negative', async () => {
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

  it('T-DFSMDX-FID-004 mock adapter failures propagate through runAdapterMatrix', async () => {
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

  it('T-DFSMDX-FID-005 8 op contract is exercised by end-to-end flows', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await registerAndDiscoverStories(adapter);
          await resolveArgsForAll(adapter);
          await renderAllMdxDocs(adapter);
          await runInteractionFocusStories(adapter);
          await runA11yForAll(adapter);
          await computeStoryCoverage(adapter);
        } catch {
          /* real-side skip */
        }
      },
    });
    const mockOps = new Set(matrix.mockTraces.filter((t) => t.ok).map((t) => t.op));
    for (const op of opsUnderTest) {
      expect(mockOps.has(op)).toBe(true);
    }
    await mock.reset();
    await real.reset();
  });
});
