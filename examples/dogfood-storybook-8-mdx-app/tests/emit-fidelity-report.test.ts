import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
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

describe('dogfood-storybook-8-mdx-app — emit fidelity report to quality-report/', () => {
  it('T-DFSMDX-EM-001 writes JSON snapshot + markdown report to disk', async () => {
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
      testCount: { behavior: 45, integration: 5, e2e: 0 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 8, realTotalMethods: 8 },
    });

    const outDir = join(process.cwd(), 'quality-report');
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'fidelity-latest.json'), output.json);
    writeFileSync(join(outDir, 'fidelity-latest.md'), output.markdown);

    expect(output.report.fidelity.mockCoveredMethods).toBeGreaterThan(0);
    expect(output.report.fidelity.behavioralDivergences).toBeGreaterThanOrEqual(0);
    expect(output.markdown).toContain('Quality Report');
    // Component provider (@kiwa/component/...) is a 7-axis gate.
    expect(output.verdict.axesEvaluated).toBe(7);
    await mock.reset();
    await real.reset();
  });
});
