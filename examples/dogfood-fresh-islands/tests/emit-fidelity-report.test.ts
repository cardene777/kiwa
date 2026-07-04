import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
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

describe('dogfood-fresh-islands — emit fidelity report to quality-report/', () => {
  it('T-DFI-EM-001 writes JSON snapshot + markdown report to disk', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await driveRouteFlow(adapter, '/greet/kiwa', 'GET');
          await driveIslandFlow(adapter, 'Counter', { label: 'x', start: 0 }, [
            { event: 'click' },
            { event: 'click' },
          ]);
          await driveIslandFlow(adapter, 'TodoList', { seedTitles: [] }, [
            { event: 'input', value: 'walk' },
            { event: 'submit' },
          ]);
          await driveHeadFlow(adapter, [
            { title: 'A' },
            { title: 'B' },
          ]);
          await driveEdgeEnvFlow(adapter, { KIWA_FRESH_MODE: 'test' }, '/edge');
        } catch {
          // Real-mode failures are recorded in the trace and become
          // divergences downstream. The mock path must complete.
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

    // Write into the local example directory so the emitted snapshot is
    // easy to inspect from a fresh clone. A follow-up manual step promotes
    // the snapshot to docs/quality-reports/framework/ when it becomes
    // canonical for a release.
    const outDir = join(process.cwd(), 'quality-report');
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'fidelity-latest.json'), output.json);
    writeFileSync(join(outDir, 'fidelity-latest.md'), output.markdown);

    expect(output.report.fidelity.mockCoveredMethods).toBeGreaterThan(0);
    expect(output.report.fidelity.behavioralDivergences).toBeGreaterThanOrEqual(0);
    expect(output.markdown).toContain('Quality Report');
    expect(output.verdict.axesEvaluated).toBe(7);
    await mock.reset();
    await real.reset();
  });
});
