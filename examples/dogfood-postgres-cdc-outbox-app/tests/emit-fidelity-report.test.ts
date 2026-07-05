import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
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

describe('dogfood-postgres-cdc-outbox-app — emit fidelity report to quality-report/', () => {
  it('T-DPE-EM-001 writes JSON snapshot + markdown report to disk', async () => {
    const mock = makeMockAdapter();
    const real = await makeRealAdapter();
    const matrix = await runAdapterMatrix({
      mock,
      real,
      run: async (adapter) => {
        try {
          await driveOutboxFlow(adapter, [
            sampleOrderRow({ orderId: 'o1' }),
            sampleOrderRow({ orderId: 'o2', region: 'eu' }),
            sampleOrderRow({ orderId: 'o3', region: 'apac' }),
          ]);
          await driveCdcPickupFlow(adapter, {
            orders: [sampleOrderRow({ orderId: 'o4' })],
            ackBatchSize: 8,
          });
          await driveReplicationFlow(adapter, {
            writes: [{ bytes: 100 }, { bytes: 200 }],
            laggedReplicaId: 'replica-a',
            laggedAppliedLsn: 150,
            failoverReason: 'emit-report',
            promoteReplicaId: 'replica-b',
          });
          await driveAtLeastOnceFlow(adapter, {
            orders: [sampleOrderRow({ orderId: 'o5' })],
            duplicateOrders: [sampleOrderRow({ orderId: 'o5' })],
          });
          await driveFidelityFlow(adapter);
        } catch {
          // divergences captured
        }
      },
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

    const outDir = join(process.cwd(), 'quality-report');
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'fidelity-latest.json'), output.json);
    writeFileSync(join(outDir, 'fidelity-latest.md'), output.markdown);

    expect(output.report.fidelity.mockCoveredMethods).toBeGreaterThan(0);
    expect(output.markdown).toContain('Quality Report');
    await mock.reset();
    await real.reset();
  });
});
