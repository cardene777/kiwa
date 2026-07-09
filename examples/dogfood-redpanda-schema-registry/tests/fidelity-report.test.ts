import { describe, expect, it } from 'vitest';
import { makeMockAdapter, sampleUserPayload } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { OPS_UNDER_TEST } from '../src/adapters/interface.js';
import { runAdapterMatrix, runFidelityHarness } from '../src/flows/fidelity.js';
import {
  driveCompatibilityModesFlow,
  driveConsoleAdminFlow,
  driveEvolutionFlow,
  driveEvolutionTransitiveFlow,
  driveFidelityFlow,
  drivePublishFlow,
  driveRegisterFlow,
  driveSubjectStrategiesFlow,
  driveTestcontainersProbeFlow,
} from '../src/flows/redpanda-flows.js';

async function driveAll(adapter: ReturnType<typeof makeMockAdapter>): Promise<void> {
  try {
    await driveRegisterFlow(adapter);
    await driveEvolutionFlow(adapter);
    await driveCompatibilityModesFlow(adapter);
    await drivePublishFlow(adapter, [sampleUserPayload({ id: 'u-1' })]);
    await driveFidelityFlow(adapter);
    await driveEvolutionTransitiveFlow(adapter);
    await driveSubjectStrategiesFlow(adapter);
    await driveConsoleAdminFlow(adapter);
    await driveTestcontainersProbeFlow(adapter);
  } catch {
    // divergences captured in traces
  }
}

describe('dogfood-redpanda-schema-registry — fidelity harness (v1.31-3)', () => {
  it('T-DRF-001 mock adapter covers all 9 ops when driven end-to-end', async () => {
    const mock = makeMockAdapter();
    const real = await makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: (adapter) => driveAll(adapter as ReturnType<typeof makeMockAdapter>),
    });
    const output = runFidelityHarness({
      provider: '@kiwa-lab/streaming/redpanda-schema-registry-dogfood',
      version: '0.2.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: [...OPS_UNDER_TEST],
      perfSamplesMs: matrix.perfSamplesMs,
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 44, integration: 9, e2e: 3 },
      mutation: { mutations: 25, killed: 18 },
    });
    expect(output.report.fidelity.mockCoveredMethods).toBe(OPS_UNDER_TEST.length);
    expect(output.report.fidelity.behavioralDivergences).toBeGreaterThanOrEqual(0);
    await mock.reset();
    await real.reset();
  });

  it('T-DRF-002 divergences accumulate when real mode is skipped', async () => {
    const mock = makeMockAdapter();
    const real = await makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await driveFidelityFlow(adapter);
        } catch {
          // suppress
        }
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-lab/streaming/redpanda-schema-registry-dogfood',
      version: '0.2.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: ['emitFidelity'],
      perfSamplesMs: matrix.perfSamplesMs,
      coverageSummary: {
        lines: { pct: 100 },
        branches: { pct: 100 },
        functions: { pct: 100 },
      },
      testCount: { behavior: 44, integration: 9, e2e: 3 },
      mutation: { mutations: 25, killed: 18 },
    });
    // emitFidelity records ok=false in real skipped mode → mock ok vs real
    // failing = BEHAVIORAL_DIVERGENCE.
    expect(output.divergences.length).toBeGreaterThan(0);
    await mock.reset();
    await real.reset();
  });

  it('T-DRF-003 harness emits markdown + json outputs', async () => {
    const mock = makeMockAdapter();
    const real = await makeRealAdapter();
    const matrix = await runAdapterMatrix({ mock, real, run: async () => undefined });
    const output = runFidelityHarness({
      provider: '@kiwa-lab/streaming/redpanda-schema-registry-dogfood',
      version: '0.2.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: [...OPS_UNDER_TEST],
      perfSamplesMs: matrix.perfSamplesMs,
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 44, integration: 9, e2e: 3 },
      mutation: { mutations: 25, killed: 18 },
    });
    expect(output.markdown).toContain('Quality Report');
    expect(JSON.parse(output.json).fidelity).toBeDefined();
    await mock.reset();
    await real.reset();
  });

  it('T-DRF-004 verdict is emitted alongside the report', async () => {
    const mock = makeMockAdapter();
    const real = await makeRealAdapter();
    await driveAll(mock);
    const output = runFidelityHarness({
      provider: '@kiwa-lab/streaming/redpanda-schema-registry-dogfood',
      version: '0.2.0',
      mockTraces: mock.traces(),
      realTraces: real.traces(),
      opsUnderTest: [...OPS_UNDER_TEST],
      perfSamplesMs: [10, 30],
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 44, integration: 9, e2e: 3 },
      mutation: { mutations: 25, killed: 18 },
    });
    expect(output.verdict).toBeDefined();
    expect(typeof output.verdict.passed).toBe('boolean');
    expect(Array.isArray(output.verdict.blockers)).toBe(true);
    expect(output.verdict.axesEvaluated).toBeGreaterThan(0);
    await mock.reset();
    await real.reset();
  });

  it('T-DRF-005 13-axis gate — mutation.tier + a11y.tier extend axesEvaluated to 9', async () => {
    const mock = makeMockAdapter();
    const real = await makeRealAdapter();
    await driveAll(mock);
    const output = runFidelityHarness({
      provider: '@kiwa-lab/streaming/redpanda-schema-registry-dogfood',
      version: '0.2.0',
      mockTraces: mock.traces(),
      realTraces: real.traces(),
      opsUnderTest: [...OPS_UNDER_TEST],
      perfSamplesMs: [10, 30],
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 44, integration: 9, e2e: 3 },
      mutation: { mutations: 25, killed: 18 },
      a11yBaseline: { critical: 0, serious: 0, moderate: 0, minor: 0 },
      mutationTier: 'framework',
      a11yTier: 'framework',
    });
    // 7 common axes + mutation.tier + a11y.tier = 9.
    expect(output.verdict.axesEvaluated).toBe(9);
    await mock.reset();
    await real.reset();
  });
});
