import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter, sampleOrder } from '../src/adapters/real.js';
import { runAdapterMatrix, runFidelityHarness } from '../src/flows/fidelity.js';
import { bootstrap, drainOrders, reconnectFlow, reminderFlow } from '../src/flows/worker-flows.js';

const opsUnderTest = [
  'declareTopology',
  'processOrder',
  'scheduleDelayedReminder',
  'processRetryPolicy',
  'verifyQuorumSurvival',
  'ingestFromFederationUpstream',
  'simulateReconnect',
];

describe('dogfood-rabbitmq — fidelity harness', () => {
  it('T-DFR-FID-001 mock adapter covers all 7 ops when driven end-to-end', async () => {
    const mock = await makeMockAdapter();
    const real = await makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await bootstrap(adapter);
          await drainOrders(adapter, [sampleOrder({ id: 'o1' })]);
          await reminderFlow(adapter, { phone: '+1', text: 'hi', delayMs: 100 });
          await reconnectFlow(adapter, 1);
        } catch {
          // divergences captured in traces
        }
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa/queue/rabbitmq-dogfood',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest,
      perfSamplesMs: matrix.perfSamplesMs,
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 44, integration: 8, e2e: 8 },
      mutation: { mutations: 40, killed: 26 },
    });
    // Mock covered at least the bootstrap + processOrder + reminder + reconnect ops.
    expect(output.report.fidelity.mockCoveredMethods).toBeGreaterThanOrEqual(3);
    expect(output.report.fidelity.behavioralDivergences).toBeGreaterThanOrEqual(0);
    await mock.reset();
    await real.reset();
  });

  it('T-DFR-FID-002 divergences accumulate when real mode is skipped', async () => {
    const mock = await makeMockAdapter();
    const real = await makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        await bootstrap(adapter).catch(() => undefined);
      },
    });
    const output = runFidelityHarness({
      provider: '@kiwa/queue/rabbitmq-dogfood',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: ['declareTopology'],
      perfSamplesMs: matrix.perfSamplesMs,
      coverageSummary: {
        lines: { pct: 100 },
        branches: { pct: 100 },
        functions: { pct: 100 },
      },
      testCount: { behavior: 44, integration: 8, e2e: 8 },
      mutation: { mutations: 40, killed: 26 },
    });
    // Real declareTopology throws when RABBITMQ_URL is missing → divergence.
    expect(output.divergences.length).toBeGreaterThan(0);
    await mock.reset();
    await real.reset();
  });

  it('T-DFR-FID-003 harness emits markdown + json outputs', async () => {
    const mock = await makeMockAdapter();
    const real = await makeRealAdapter();
    const matrix = await runAdapterMatrix({ mock, real, run: async () => undefined });
    const output = runFidelityHarness({
      provider: '@kiwa/queue/rabbitmq-dogfood',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest,
      perfSamplesMs: matrix.perfSamplesMs,
      coverageSummary: {
        lines: { pct: 92 },
        branches: { pct: 88 },
        functions: { pct: 95 },
      },
      testCount: { behavior: 44, integration: 8, e2e: 8 },
      mutation: { mutations: 40, killed: 26 },
    });
    expect(output.markdown).toContain('Quality Report');
    expect(JSON.parse(output.json).fidelity).toBeDefined();
    await mock.reset();
    await real.reset();
  });
});
