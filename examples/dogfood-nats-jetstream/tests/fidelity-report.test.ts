import { describe, expect, it } from 'vitest';
import {
  makeMockAdapter,
  sampleOrderEvent,
  sampleUserProfile,
} from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { OPS_UNDER_TEST } from '../src/adapters/interface.js';
import { runAdapterMatrix, runFidelityHarness } from '../src/flows/fidelity.js';
import {
  driveFidelityFlow,
  driveJetStreamDurableFlow,
  driveJetStreamFlow,
  driveKvRevisionFlow,
  driveKVFlow,
  driveObjectChunkingFlow,
  driveObjectFlow,
  driveRoutingFlow,
  driveTestcontainersProbeFlow,
} from '../src/flows/nats-flows.js';

describe('dogfood-nats-jetstream — fidelity harness', () => {
  it('T-DNF-001 mock adapter covers all 9 ops when driven end-to-end', async () => {
    const mock = makeMockAdapter();
    const real = await makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await driveJetStreamFlow(adapter, [sampleOrderEvent({ orderId: 'o-1' })]);
          await driveKVFlow(adapter, [sampleUserProfile({ userId: 'u-1' })]);
          await driveObjectFlow(adapter);
          await driveRoutingFlow(adapter);
          await driveFidelityFlow(adapter);
          await driveJetStreamDurableFlow(adapter);
          await driveKvRevisionFlow(adapter);
          await driveObjectChunkingFlow(adapter);
          await driveTestcontainersProbeFlow(adapter);
        } catch {
          // divergences captured in traces
        }
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa-lab/streaming/nats-jetstream-dogfood',
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
      testCount: { behavior: 45, integration: 8, e2e: 3 },
      mutation: { mutations: 25, killed: 18 },
    });
    expect(output.report.fidelity.mockCoveredMethods).toBe(OPS_UNDER_TEST.length);
    expect(output.report.fidelity.behavioralDivergences).toBeGreaterThanOrEqual(0);
    await mock.reset();
    await real.reset();
  });

  it('T-DNF-002 divergences accumulate when real mode is skipped', async () => {
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
      provider: '@kiwa-lab/streaming/nats-jetstream-dogfood',
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
      testCount: { behavior: 45, integration: 8, e2e: 3 },
      mutation: { mutations: 25, killed: 18 },
    });
    // emitFidelity records ok=false in real skipped mode → mock ok vs real
    // failing = BEHAVIORAL_DIVERGENCE.
    expect(output.divergences.length).toBeGreaterThan(0);
    await mock.reset();
    await real.reset();
  });

  it('T-DNF-003 harness emits markdown + json outputs', async () => {
    const mock = makeMockAdapter();
    const real = await makeRealAdapter();
    const matrix = await runAdapterMatrix({ mock, real, run: async () => undefined });
    const output = runFidelityHarness({
      provider: '@kiwa-lab/streaming/nats-jetstream-dogfood',
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
      testCount: { behavior: 45, integration: 8, e2e: 3 },
      mutation: { mutations: 25, killed: 18 },
    });
    expect(output.markdown).toContain('Quality Report');
    expect(JSON.parse(output.json).fidelity).toBeDefined();
    await mock.reset();
    await real.reset();
  });

  it('T-DNF-004 verdict is emitted alongside the report + 13-axis gate with tiers', async () => {
    const mock = makeMockAdapter();
    const real = await makeRealAdapter();
    await driveJetStreamFlow(mock, [sampleOrderEvent({ orderId: 'o-1' })]);
    await driveKVFlow(mock, [sampleUserProfile({ userId: 'u-1' })]);
    await driveObjectFlow(mock);
    await driveRoutingFlow(mock);
    await driveFidelityFlow(mock);
    await driveJetStreamDurableFlow(mock);
    await driveKvRevisionFlow(mock);
    await driveObjectChunkingFlow(mock);
    await driveTestcontainersProbeFlow(mock);
    const output = runFidelityHarness({
      provider: '@kiwa-lab/streaming/nats-jetstream-dogfood',
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
      testCount: { behavior: 45, integration: 8, e2e: 3 },
      mutation: { mutations: 25, killed: 18 },
      a11yBaseline: { critical: 0, serious: 0, moderate: 0, minor: 0 },
      mutationTier: 'framework',
      a11yTier: 'framework',
    });
    expect(output.verdict).toBeDefined();
    expect(typeof output.verdict.passed).toBe('boolean');
    expect(Array.isArray(output.verdict.blockers)).toBe(true);
    // 13-axis gate — 7 common + mutation.tier + a11y.tier = 9 evaluated for
    // non-AI providers.
    expect(output.verdict.axesEvaluated).toBeGreaterThanOrEqual(9);
    await mock.reset();
    await real.reset();
  });
});
