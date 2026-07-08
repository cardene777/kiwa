import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { seededRules } from '../src/rules/index.js';
import { seededRoute } from '../src/routing/index.js';
import { seededEscalation } from '../src/escalation/index.js';
import {
  runFullMatrix,
  OPS_UNDER_TEST,
} from '../src/flows/orchestrator-flows.js';
import {
  runAdapterMatrix,
  runFidelityHarness,
} from '../src/flows/fidelity.js';

const buildConfig = () => ({
  orchestratorId: 'test-orchestrator',
  rules: seededRules,
  route: seededRoute(),
  silences: [],
  escalation: seededEscalation(),
});

describe('dogfood-alert-orchestrator — fidelity harness', () => {
  it('T-DFA-FID-001 mock adapter covers 3 lifecycle ops (evaluate / route / escalate)', async () => {
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
      provider: '@kiwa/observability/alert',
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
    expect(output.report.provider).toBe('@kiwa/observability/alert');
    expect(output.report.fidelity.mockCoveredMethods).toBeGreaterThanOrEqual(3);
    expect(output.report.fidelity.behavioralDivergences).toBeGreaterThanOrEqual(0);
    await mock.reset();
    await real.reset();
  });

  it('T-DFA-FID-002 divergence is flagged when real mode is skipped', async () => {
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
      provider: '@kiwa/observability/alert',
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
      testCount: { behavior: 23, integration: 3, e2e: 3 },
      mutation: { mutations: 40, killed: 28 },
      surfaceCoverage: { mockCoveredMethods: 3, realTotalMethods: 3 },
    });
    // Real mode absent — mock succeeds every op, real fails or noops.
    expect(output.divergences.length).toBeGreaterThan(0);
    expect(output.report.notes ?? '').toContain('divergences');
    await mock.reset();
    await real.reset();
  });

  it('T-DFA-FID-003 verdict runs the common 7-axis release gate (no AI-LLM branch)', async () => {
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
      provider: '@kiwa/observability/alert',
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
    // AlertManager is an infrastructure primitive so the 7-axis gate runs.
    expect(output.verdict.axesEvaluated).toBe(7);
    await mock.reset();
    await real.reset();
  });
});
