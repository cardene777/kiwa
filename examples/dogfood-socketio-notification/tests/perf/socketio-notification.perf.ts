import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../../src/adapters/mock.js';

const MODULE = 'dogfood-socketio-notification';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: subscribeRoom / deliverNotification / getPending / simulateReconnect',
    async () => {
      const adapter = makeMockAdapter();
      const sharedRoom = 'room-shared';
      await adapter.subscribeRoom({
        namespace: '/notify',
        room: sharedRoom,
        userId: 'u1',
      });

      let subCounter = 0;
      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'subscribeRoom',
            serialP95CapMs: 50,
            fn: async () => {
              const roomKey = `room-perf-${(subCounter += 1) % 5}`;
              await adapter.subscribeRoom({
                namespace: '/notify',
                room: roomKey,
                userId: 'u-perf',
              });
            },
          },
          {
            name: 'deliverNotification',
            serialP95CapMs: 30,
            fn: async () => {
              await adapter.deliverNotification({
                namespace: '/notify',
                room: sharedRoom,
                payload: { userId: 'u1', priority: 'medium', body: 'ping' },
              });
            },
          },
          {
            name: 'getPending',
            serialP95CapMs: 30,
            fn: async () => {
              await adapter.getPending({ room: sharedRoom });
            },
          },
          {
            name: 'simulateReconnect',
            serialP95CapMs: 100,
            fn: async () => {
              await adapter.simulateReconnect();
            },
          },
        ],
        serialIterations: 40,
      });

      for (const outcome of result.outcomes) {
        expect.soft(outcome.serialGatePassed, `${outcome.name} serial p95`).toBe(true);
        expect.soft(outcome.concurrentGatePassed, `${outcome.name} concurrent p95`).toBe(true);
        expect.soft(outcome.memoryGatePassed, `${outcome.name} memory arrayBuffers`).toBe(true);
      }
      expect(result.allPassed).toBe(true);
    },
    240_000,
  );
});
