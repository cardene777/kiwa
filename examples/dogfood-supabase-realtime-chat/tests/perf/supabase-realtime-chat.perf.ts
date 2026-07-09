import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../../src/adapters/mock.js';

const MODULE = 'dogfood-supabase-realtime-chat';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: joinRoom / sendMessage / getPresence / sendTyping',
    async () => {
      const adapter = makeMockAdapter();
      // Seed a shared room + user so the perf loop exercises the hot path,
      // not the initial join. joinRoom itself is measured on its own room
      // ('joinRoomTarget') to keep the mock's presence Map bounded.
      await adapter.joinRoom({
        channel: 'room-fixed',
        userId: 'u1',
      });

      let joinCounter = 0;
      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'joinRoom',
            serialP95CapMs: 50,
            fn: async () => {
              // exercise the idempotent re-join path so channels Map stays bounded
              const roomKey = `room-shared-${(joinCounter += 1) % 5}`;
              await adapter.joinRoom({
                channel: roomKey,
                userId: 'u-perf',
              });
            },
          },
          {
            name: 'sendMessage',
            serialP95CapMs: 30,
            fn: async () => {
              await adapter.sendMessage({
                channel: 'room-fixed',
                userId: 'u1',
                text: 'hello',
              });
            },
          },
          {
            name: 'getPresence',
            serialP95CapMs: 30,
            fn: async () => {
              await adapter.getPresence({ channel: 'room-fixed' });
            },
          },
          {
            name: 'sendTyping',
            serialP95CapMs: 100,
            fn: async () => {
              await adapter.sendTyping({
                channel: 'room-fixed',
                userId: 'u1',
                keystrokeIntervalsMs: [10, 10, 10, 10, 10],
              });
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
    180_000,
  );
});
