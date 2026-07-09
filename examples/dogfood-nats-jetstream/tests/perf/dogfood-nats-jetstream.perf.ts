import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, it } from 'vitest';
import {
  makeMockAdapter,
  sampleOrderEvent,
  sampleUserProfile,
} from '../../src/adapters/mock.js';
import {
  driveJetStreamFlow,
  driveKVFlow,
  driveObjectFlow,
  driveRoutingFlow,
} from '../../src/flows/nats-flows.js';

const MODULE = 'dogfood-nats-jetstream';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: driveJetStream / driveKV / driveObject / driveRouting',
    async () => {
      await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'driveJetStream',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveJetStreamFlow(adapter, [sampleOrderEvent({ orderId: 'p1' })]);
              await adapter.reset();
            },
          },
          {
            name: 'driveKV',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveKVFlow(adapter, [sampleUserProfile({ userId: 'p1' })]);
              await adapter.reset();
            },
          },
          {
            name: 'driveObject',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveObjectFlow(adapter);
              await adapter.reset();
            },
          },
          {
            name: 'driveRouting',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveRoutingFlow(adapter);
              await adapter.reset();
            },
          },
        ],
      });
    },
    120_000,
  );
});
