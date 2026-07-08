import { describe, expect, it } from 'vitest';
import { makeMockAdapter, sampleOrderEvent } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { OPS_UNDER_TEST } from '../src/adapters/interface.js';
import { runAdapterMatrix, runFidelityHarness } from '../src/flows/fidelity.js';
import {
  driveConsumerGroupFlow,
  driveDlqFlow,
  driveFidelityFlow,
  driveIsrHighWatermarkFlow,
  driveProducerFlow,
  driveRawProtocolFlow,
  driveSchemaRegistryFlow,
  driveTestcontainersProbeFlow,
  driveTransactionFlow,
} from '../src/flows/kafka-flows.js';

describe('dogfood-kafka-event-pipeline — fidelity harness', () => {
  it('T-DKF-001 mock adapter covers all 9 ops when driven end-to-end', async () => {
    const mock = makeMockAdapter();
    const real = await makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await driveProducerFlow(adapter, [sampleOrderEvent({ orderId: 'o1' })]);
          await driveConsumerGroupFlow(adapter, 'topic-cg');
          await driveTransactionFlow(adapter, 'topic-tx', ['x'], ['y']);
          await driveDlqFlow(adapter, [
            { orderId: 'p1', valid: false },
            { orderId: 'ok', valid: true },
          ]);
          await driveFidelityFlow(adapter);
          await driveRawProtocolFlow(adapter);
          await driveIsrHighWatermarkFlow(adapter, 'topic-isr', 0, 10);
          await driveSchemaRegistryFlow(adapter, {
            subject: 'topic-schema',
            compatibility: 'BACKWARD',
          });
          await driveTestcontainersProbeFlow(adapter);
        } catch {
          // divergences captured in traces
        }
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa/streaming/kafka-dogfood',
      version: '0.2.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: [...OPS_UNDER_TEST],
      perfSamplesMs: matrix.perfSamplesMs,
      coverageSummary: {
        lines: { pct: 93 },
        branches: { pct: 89 },
        functions: { pct: 96 },
      },
      testCount: { behavior: 52, integration: 8, e2e: 7 },
      mutation: { mutations: 40, killed: 32 },
    });
    // Mock covered every op — the ok flag is set on all 9 emitted events.
    expect(output.report.fidelity.mockCoveredMethods).toBe(OPS_UNDER_TEST.length);
    expect(output.report.fidelity.behavioralDivergences).toBeGreaterThanOrEqual(0);
    await mock.reset();
    await real.reset();
  });

  it('T-DKF-002 divergences accumulate when real mode is skipped', async () => {
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
      provider: '@kiwa/streaming/kafka-dogfood',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: ['emitFidelity'],
      perfSamplesMs: matrix.perfSamplesMs,
      coverageSummary: {
        lines: { pct: 100 },
        branches: { pct: 100 },
        functions: { pct: 100 },
      },
      testCount: { behavior: 32, integration: 7, e2e: 7 },
      mutation: { mutations: 30, killed: 22 },
    });
    // emitFidelity records ok=false in real skipped mode → mock ok vs real
    // failing = BEHAVIORAL_DIVERGENCE.
    expect(output.divergences.length).toBeGreaterThan(0);
    await mock.reset();
    await real.reset();
  });

  it('T-DKF-003 harness emits markdown + json outputs', async () => {
    const mock = makeMockAdapter();
    const real = await makeRealAdapter();
    const matrix = await runAdapterMatrix({ mock, real, run: async () => undefined });
    const output = runFidelityHarness({
      provider: '@kiwa/streaming/kafka-dogfood',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: [...OPS_UNDER_TEST],
      perfSamplesMs: matrix.perfSamplesMs,
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 32, integration: 7, e2e: 7 },
      mutation: { mutations: 30, killed: 22 },
    });
    expect(output.markdown).toContain('Quality Report');
    expect(JSON.parse(output.json).fidelity).toBeDefined();
    await mock.reset();
    await real.reset();
  });

  it('T-DKF-004 verdict is emitted alongside the report', async () => {
    const mock = makeMockAdapter();
    const real = await makeRealAdapter();
    await driveProducerFlow(mock, [sampleOrderEvent({ orderId: 'o1' })]);
    await driveConsumerGroupFlow(mock, 'topic-cg');
    await driveTransactionFlow(mock, 'topic-tx', ['x'], ['y']);
    await driveDlqFlow(mock, [{ orderId: 'p', valid: false }]);
    await driveFidelityFlow(mock);
    await driveRawProtocolFlow(mock);
    await driveIsrHighWatermarkFlow(mock, 'topic-isr', 0, 5);
    await driveSchemaRegistryFlow(mock, { subject: 't', compatibility: 'BACKWARD' });
    await driveTestcontainersProbeFlow(mock);
    const output = runFidelityHarness({
      provider: '@kiwa/streaming/kafka-dogfood',
      version: '0.1.0',
      mockTraces: mock.traces(),
      realTraces: real.traces(),
      opsUnderTest: [...OPS_UNDER_TEST],
      perfSamplesMs: [10, 30],
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 32, integration: 7, e2e: 7 },
      mutation: { mutations: 30, killed: 22 },
    });
    expect(output.verdict).toBeDefined();
    expect(typeof output.verdict.passed).toBe('boolean');
    expect(Array.isArray(output.verdict.blockers)).toBe(true);
    expect(output.verdict.axesEvaluated).toBeGreaterThan(0);
    await mock.reset();
    await real.reset();
  });
});
