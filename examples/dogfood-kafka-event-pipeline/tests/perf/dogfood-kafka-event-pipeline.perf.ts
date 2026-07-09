import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, it } from 'vitest';
import { makeMockAdapter, sampleOrderEvent } from '../../src/adapters/mock.js';
import {
  driveConsumerGroupFlow,
  driveDlqFlow,
  driveProducerFlow,
  driveTransactionFlow,
} from '../../src/flows/kafka-flows.js';

const MODULE = 'dogfood-kafka-event-pipeline';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: driveProducer / driveConsumerGroup / driveTransaction / driveDlq',
    async () => {
      await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'driveProducer',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveProducerFlow(adapter, [sampleOrderEvent({ orderId: 'p1' })]);
              await adapter.reset();
            },
          },
          {
            name: 'driveConsumerGroup',
            serialP95CapMs: 150,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveConsumerGroupFlow(adapter, 'perf-topic');
              await adapter.reset();
            },
          },
          {
            name: 'driveTransaction',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveTransactionFlow(adapter, 'perf-tx', ['a'], ['b']);
              await adapter.reset();
            },
          },
          {
            name: 'driveDlq',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await driveDlqFlow(adapter, [{ orderId: 'p', valid: false }]);
              await adapter.reset();
            },
          },
        ],
      });
    },
    120_000,
  );
});
