import {
  createAblyMock,
  createPusherMock,
  createSocketioMock,
  createSupabaseRealtimeMock,
} from '../../src/index.js';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-test/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const MODULE = 'realtime';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: 4 provider mocks (supabase / ably / pusher / socketio)',
    async () => {
      const supabase = createSupabaseRealtimeMock();
      const ably = createAblyMock();
      const pusher = createPusherMock();
      const socketio = createSocketioMock();

      // Fixed channel / room names keep the mocks' internal `channels` Map
      // bounded across iterations. Using Math.random() names would leak
      // channel entries and confuse per-call retention with unbounded growth
      // (the pattern the v1.14-1 pushBounded fix in engine.ts addressed).
      const supabaseChannel = supabase.channel('perf-room');
      await supabaseChannel.subscribe();
      const ablyChannelHandle = ably.channels.get('perf-ch');
      const pusherPersistentChannel = pusher.subscribeChannel('perf-ch');
      pusherPersistentChannel.bind('event', () => {});
      const socketClient = socketio.io('/notify');

      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'supabasePresenceTrack',
            serialP95CapMs: 20,
            fn: async () => {
              await supabaseChannel.track({
                userId: 'u1',
                online_at: new Date().toISOString(),
              });
            },
          },
          {
            name: 'ablyPublish',
            serialP95CapMs: 20,
            fn: async () => {
              await ablyChannelHandle.publish('event', { data: 'ping' });
            },
          },
          {
            name: 'pusherSubscribeChannel',
            serialP95CapMs: 20,
            fn: async () => {
              pusher.subscribeChannel('perf-ch');
            },
          },
          {
            name: 'socketioEmit',
            serialP95CapMs: 20,
            fn: async () => {
              socketClient.emit('event', { data: 'ping' });
            },
          },
        ],
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
