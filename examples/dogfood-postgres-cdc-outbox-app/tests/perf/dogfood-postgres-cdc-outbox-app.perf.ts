import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-test/perf-harness';
import path from 'node:path';
import { describe, it } from 'vitest';
import { makeMockAdapter } from '../../src/adapters/mock.js';
import { sampleOrderRow } from '../../src/adapters/interface.js';
import {
  driveCdcPickupFlow,
  driveOutboxFlow,
  driveReplicationFlow,
  driveAtLeastOnceFlow,
} from '../../src/flows/postgres-flows.js';

const MODULE = 'dogfood-postgres-cdc-outbox-app';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: driveOutbox / driveCdcPickup / driveReplication / driveAtLeastOnce',
    async () => {
      await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'driveOutbox',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveOutboxFlow(adapter, [sampleOrderRow({ orderId: 'p1' })]);
              await adapter.reset();
            },
          },
          {
            name: 'driveCdcPickup',
            serialP95CapMs: 100,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveCdcPickupFlow(adapter, {
                orders: [sampleOrderRow({ orderId: 'p2', region: 'eu' })],
                ackBatchSize: 4,
              });
              await adapter.reset();
            },
          },
          {
            name: 'driveReplication',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveReplicationFlow(adapter, {
                writes: [{ bytes: 100 }],
                laggedReplicaId: 'replica-a',
                laggedAppliedLsn: 50,
                failoverReason: 'perf',
                promoteReplicaId: 'replica-b',
              });
              await adapter.reset();
            },
          },
          {
            name: 'driveAtLeastOnce',
            serialP95CapMs: 100,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveAtLeastOnceFlow(adapter, {
                orders: [sampleOrderRow({ orderId: 'p3', region: 'apac' })],
                duplicateOrders: [],
              });
              await adapter.reset();
            },
          },
        ],
      });
    },
    120_000,
  );
});
