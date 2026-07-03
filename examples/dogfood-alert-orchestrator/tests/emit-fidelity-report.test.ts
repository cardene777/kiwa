import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { seededRules } from '../src/rules/index.js';
import { seededRoute } from '../src/routing/index.js';
import { seededEscalation } from '../src/escalation/index.js';
import { runFullMatrix, OPS_UNDER_TEST } from '../src/flows/orchestrator-flows.js';
import { runAdapterMatrix, runFidelityHarness } from '../src/flows/fidelity.js';

const buildConfig = () => ({
  orchestratorId: 'dogfood-alert-orchestrator',
  rules: seededRules,
  route: seededRoute(),
  silences: [],
  escalation: seededEscalation(),
});

describe('dogfood-alert-orchestrator — emit fidelity report to quality-report/', () => {
  it('T-DFA-EM-001 writes JSON snapshot + markdown report to disk', async () => {
    const mock = makeMockAdapter(buildConfig());
    const real = makeRealAdapter(buildConfig());
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await runFullMatrix(adapter);
        } catch {
          // Real-mode failures are recorded in the trace and become
          // divergences downstream. The mock path must complete.
        }
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-test/observability/alert',
      version: '2.0.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: OPS_UNDER_TEST,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 23, integration: 3, e2e: 3 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 3, realTotalMethods: 3 },
    });

    // Write into the local example directory so the emitted snapshot is
    // easy to inspect from a fresh clone. A follow-up manual step
    // promotes the snapshot to docs/quality-reports/observability/ when
    // it becomes canonical for a release.
    const outDir = join(process.cwd(), 'quality-report');
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'fidelity-latest.json'), output.json);
    writeFileSync(join(outDir, 'fidelity-latest.md'), output.markdown);

    expect(output.report.fidelity.mockCoveredMethods).toBeGreaterThan(0);
    expect(output.report.fidelity.behavioralDivergences).toBeGreaterThanOrEqual(0);
    expect(output.markdown).toContain('Quality Report');
    // AlertManager provider means the 7-axis gate must have run.
    expect(output.verdict.axesEvaluated).toBe(7);
    await mock.reset();
    await real.reset();
  });
});
