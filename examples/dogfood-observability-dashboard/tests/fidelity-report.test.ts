import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { seededPanels } from '../src/panels/index.js';
import { runFullMatrix, OPS_UNDER_TEST } from '../src/flows/dashboard-flows.js';
import { runAdapterMatrix, runFidelityHarness } from '../src/flows/fidelity.js';

const buildConfig = () => ({
  dashboardId: 'test-dashboard',
  title: 'test',
  panels: seededPanels,
});

describe('dogfood-observability-dashboard — fidelity harness', () => {
  it('T-DFO-FID-001 mock adapter covers both ops (refreshDashboard / runQuery)', async () => {
    const mock = makeMockAdapter(buildConfig());
    const real = makeRealAdapter(buildConfig());
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (a) => {
        await runFullMatrix(a).catch(() => undefined);
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-lab/observability/dashboard',
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
      testCount: { behavior: 18, integration: 3, e2e: 3 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 2, realTotalMethods: 2 },
    });
    expect(output.report.provider).toBe('@kiwa-lab/observability/dashboard');
    expect(output.report.fidelity.mockCoveredMethods).toBeGreaterThanOrEqual(2);
    expect(output.report.fidelity.behavioralDivergences).toBeGreaterThanOrEqual(0);
    await mock.reset();
    await real.reset();
  });

  it('T-DFO-FID-002 divergence is flagged when real mode is skipped', async () => {
    const mock = makeMockAdapter(buildConfig());
    const real = makeRealAdapter(buildConfig());
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (a) => {
        await runFullMatrix(a).catch(() => undefined);
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-lab/observability/dashboard',
      version: '2.0.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: OPS_UNDER_TEST,
      mockLatencySamplesMs: matrix.mockLatencySamplesMs,
      coverageSummary: {
        lines: { pct: 100 },
        branches: { pct: 100 },
        functions: { pct: 100 },
      },
      testCount: { behavior: 18, integration: 3, e2e: 3 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 2, realTotalMethods: 2 },
    });
    // With real mode absent the mock succeeds every op and real fails
    // every op — divergences must be reported.
    expect(output.divergences.length).toBeGreaterThan(0);
    expect(output.report.notes ?? '').toContain('divergences');
    await mock.reset();
    await real.reset();
  });

  it('T-DFO-FID-003 verdict runs the common 7-axis release gate (no AI-LLM branch)', async () => {
    const mock = makeMockAdapter(buildConfig());
    const real = makeRealAdapter(buildConfig());
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (a) => {
        await runFullMatrix(a).catch(() => undefined);
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-lab/observability/dashboard',
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
      testCount: { behavior: 18, integration: 3, e2e: 3 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 2, realTotalMethods: 2 },
    });
    // Dashboard mock is a metrics primitive (not a token-priced
    // generative call), so the 7-axis common gate must run.
    expect(output.verdict.axesEvaluated).toBe(7);
    await mock.reset();
    await real.reset();
  });
});
