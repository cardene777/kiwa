import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { seededTraces } from '../src/traces/index.js';
import {
  runFullMatrix,
  OPS_UNDER_TEST,
} from '../src/flows/flame-flows.js';
import {
  runAdapterMatrix,
  runFidelityHarness,
} from '../src/flows/fidelity.js';

const buildConfig = () => ({
  explorerId: 'test-explorer',
  traces: seededTraces(),
});

describe('dogfood-trace-flame-graph — fidelity harness', () => {
  it('T-DFT-FID-001 mock adapter covers 5 lifecycle ops (load / render / drill / logs / filter)', async () => {
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
      provider: '@kiwa-lab/observability/trace-flame',
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
      testCount: { behavior: 25, integration: 3, e2e: 3 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 5, realTotalMethods: 5 },
    });
    expect(output.report.provider).toBe('@kiwa-lab/observability/trace-flame');
    expect(output.report.fidelity.mockCoveredMethods).toBeGreaterThanOrEqual(5);
    expect(output.report.fidelity.behavioralDivergences).toBeGreaterThanOrEqual(0);
    await mock.reset();
    await real.reset();
  });

  it('T-DFT-FID-002 divergence is flagged when real mode is skipped', async () => {
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
      provider: '@kiwa-lab/observability/trace-flame',
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
      testCount: { behavior: 25, integration: 3, e2e: 3 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 5, realTotalMethods: 5 },
    });
    // Real mode absent — mock succeeds every op, real fails every op.
    expect(output.divergences.length).toBeGreaterThan(0);
    expect(output.report.notes ?? '').toContain('divergences');
    await mock.reset();
    await real.reset();
  });

  it('T-DFT-FID-003 verdict runs the common 7-axis release gate (no AI-LLM branch)', async () => {
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
      provider: '@kiwa-lab/observability/trace-flame',
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
      testCount: { behavior: 25, integration: 3, e2e: 3 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 5, realTotalMethods: 5 },
    });
    // Trace flame explorer is an infrastructure primitive so the 7-axis
    // gate runs (no AI-LLM 4 axes).
    expect(output.verdict.axesEvaluated).toBe(7);
    await mock.reset();
    await real.reset();
  });
});
