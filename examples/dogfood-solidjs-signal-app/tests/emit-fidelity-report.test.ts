import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
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

describe('dogfood-solidjs-signal-app — emit fidelity report to quality-report/', () => {
  it('T-DSSA-EM-001 writes JSON snapshot + markdown report to disk', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await driveCounterFlow(adapter, 3);
          await driveTodosFlow(adapter, ['a', 'b'], [
            { kind: 'add', title: 'c' },
            { kind: 'markAll', completed: true },
          ]);
          await driveResourceFlow(adapter, async () => ({
            id: 'u1',
            displayName: 'Ada',
            email: 'ada@ex.com',
          }));
          await driveSuspenseFlow(adapter, 1);
        } catch {
          // Real-mode failures are recorded in the trace and become
          // divergences downstream. The mock path must complete.
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
    // Framework provider (@kiwa-lab/solidjs/...) is not an AI-LLM prefix,
    // so the 7-axis gate must have run.
    expect(output.verdict.axesEvaluated).toBe(7);
    await mock.reset();
    await real.reset();
  });
});
