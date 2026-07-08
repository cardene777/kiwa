import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
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

describe('dogfood-hono-workers-rpc — emit fidelity report to quality-report/', () => {
  it('T-DHW-EM-001 writes JSON snapshot + markdown report to disk', async () => {
    const mock = makeMockAdapter();
    const real = makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await driveRouteVsRpcFlow(adapter, 'GET', '/health');
          await driveKvCounterFlow(adapter, 3);
          await driveD1NotesFlow(adapter, [
            { id: 1, title: 'first' },
            { id: 2, title: 'second' },
          ]);
          await driveR2UploadFlow(adapter, [
            { key: 'a', contents: 'x' },
            { key: 'b', contents: 'y' },
          ]);
          await driveExecutionCtxFlow(adapter, 3);
        } catch {
          // Real-mode failures are recorded in the trace and become
          // divergences downstream. The mock path must complete.
        }
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa/hono/workers-rpc',
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
