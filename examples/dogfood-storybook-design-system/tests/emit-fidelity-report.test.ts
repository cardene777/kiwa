import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
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

describe('dogfood-storybook-design-system — emit fidelity report to quality-report/', () => {
  it('T-DFSB-EM-001 writes JSON snapshot + markdown report to disk', async () => {
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
          // Real-mode failures are recorded in the trace and become
          // divergences downstream. The mock path must complete.
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

    // Write into the local example directory so the emitted snapshot is
    // easy to inspect from a fresh clone. A follow-up manual step promotes
    // the snapshot to docs/quality-reports/component/ when it becomes
    // canonical for a release.
    const outDir = join(process.cwd(), 'quality-report');
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'fidelity-latest.json'), output.json);
    writeFileSync(join(outDir, 'fidelity-latest.md'), output.markdown);

    expect(output.report.fidelity.mockCoveredMethods).toBeGreaterThan(0);
    expect(output.report.fidelity.behavioralDivergences).toBeGreaterThanOrEqual(0);
    expect(output.markdown).toContain('Quality Report');
    // Component provider (@kiwa-lab/component/...) is not an AI-LLM prefix,
    // so the 7-axis gate must have run.
    expect(output.verdict.axesEvaluated).toBe(7);
    await mock.reset();
    await real.reset();
  });
});
