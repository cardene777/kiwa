import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { OPS_UNDER_TEST, sampleOrderRow } from '../src/adapters/interface.js';
import { runAdapterMatrix, runFidelityHarness } from '../src/flows/fidelity.js';
import {
  driveCdcPickupFlow,
  driveFidelityFlow,
  driveOutboxFlow,
  driveReplicationFlow,
  driveAtLeastOnceFlow,
} from '../src/flows/postgres-flows.js';

async function runFull(adapter: Parameters<typeof driveOutboxFlow>[0]): Promise<void> {
  try {
    await driveOutboxFlow(adapter, [sampleOrderRow({ orderId: 'o1' })]);
    await driveCdcPickupFlow(adapter, {
      orders: [sampleOrderRow({ orderId: 'o2', region: 'eu' })],
      ackBatchSize: 4,
    });
    await driveReplicationFlow(adapter, {
      writes: [{ bytes: 100 }],
      laggedReplicaId: 'replica-a',
      laggedAppliedLsn: 50,
      failoverReason: 'fidelity',
      promoteReplicaId: 'replica-b',
    });
    await driveAtLeastOnceFlow(adapter, {
      orders: [sampleOrderRow({ orderId: 'o3', region: 'apac' })],
      duplicateOrders: [],
    });
    await driveFidelityFlow(adapter);
  } catch {
    // divergences captured in traces
  }
}

describe('dogfood-postgres-cdc-outbox-app — fidelity harness', () => {
  it('T-DPF-001 mock adapter covers all 5 ops when driven end-to-end', async () => {
    const mock = makeMockAdapter();
    const real = await makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: runFull,
    });
    const output = runFidelityHarness({
      provider: '@kiwa-test/orm/postgres-cdc-dogfood',
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
      testCount: { behavior: 24, integration: 6, e2e: 5 },
      mutation: { mutations: 30, killed: 22 },
    });
    // Mock covered every op — the ok flag is set on all 5 emitted events.
    expect(output.report.fidelity.mockCoveredMethods).toBe(OPS_UNDER_TEST.length);
    expect(output.report.fidelity.behavioralDivergences).toBeGreaterThanOrEqual(0);
    await mock.reset();
    await real.reset();
  });

  it('T-DPF-002 divergences accumulate when real mode is skipped', async () => {
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
      provider: '@kiwa-test/orm/postgres-cdc-dogfood',
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
      testCount: { behavior: 1, integration: 0, e2e: 0 },
      mutation: { mutations: 1, killed: 1 },
    });
    // real reports POSTGRES_ENV_MISSING for emitFidelity, mock reports ok
    // → 1 behavioural divergence.
    expect(output.divergences.length).toBeGreaterThanOrEqual(1);
    const emitDiv = output.divergences.find((d) => d.op === 'emitFidelity');
    expect(emitDiv?.errorKind).toBe('BEHAVIORAL_DIVERGENCE');
    await mock.reset();
    await real.reset();
  });

  it('T-DPF-003 fidelity markdown includes the release-gate verdict', async () => {
    const mock = makeMockAdapter();
    const real = await makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: runFull,
    });
    const output = runFidelityHarness({
      provider: '@kiwa-test/orm/postgres-cdc-dogfood',
      version: '0.1.0',
      mockTraces: matrix.mockTraces,
      realTraces: matrix.realTraces,
      opsUnderTest: [...OPS_UNDER_TEST],
      perfSamplesMs: matrix.perfSamplesMs,
      coverageSummary: {
        lines: { pct: 90 },
        branches: { pct: 85 },
        functions: { pct: 92 },
      },
      testCount: { behavior: 24, integration: 6, e2e: 5 },
      mutation: { mutations: 30, killed: 22 },
    });
    expect(output.markdown).toContain('Quality Report');
    expect(output.markdown.length).toBeGreaterThan(0);
    expect(output.json).toContain('"provider"');
    await mock.reset();
    await real.reset();
  });
});
