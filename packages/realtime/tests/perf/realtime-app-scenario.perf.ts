/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { RealtimeEngine } from '../../src/index.js';

const MODULE = 'realtime-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('realtime app scenario perf (real workload)', () => {
  it('3-layer perf: chat room / presence broadcast / reconnect resilience', { timeout: 60_000 }, async () => {
    const result = await runPerf3Layer({
      moduleName: MODULE,
      reportPath: REPORT_PATH,
      serialIterations: 15,
      serialWarmup: 3,
      concurrency: 4,
      iterationsPerWorker: 3,
      memoryIterations: 15,
      ops: [
        {
          name: 'chat_room_broadcast (subscribe + 20 publish)',
          fn: async () => {
            const engine = new RealtimeEngine({ artificialLatencyMs: 0 });
            const events: unknown[] = [];
            const sub = await engine.subscribe('room', (e) => events.push(e));
            for (let i = 0; i < 20; i++) await engine.publish('room', 'msg', { i });
            await sub.unsubscribe();
            await engine.disconnect();
          },
          serialP95CapMs: 100,
        },
        {
          name: 'presence_workload (trackPresence 10 users + untrack)',
          fn: async () => {
            const engine = new RealtimeEngine({ artificialLatencyMs: 0 });
            await engine.subscribe('room-presence', () => undefined);
            for (let i = 0; i < 10; i++) await engine.trackPresence('room-presence', `user-${i}`, { status: 'online' });
            for (let i = 0; i < 10; i++) await engine.untrackPresence('room-presence', `user-${i}`);
            await engine.disconnect();
          },
          serialP95CapMs: 100,
        },
        {
          name: 'reconnect_resilience (5x connect/disconnect/reconnect)',
          fn: async () => {
            // backoff は意図的な待機なので測定対象から外す。既定の 100ms を
            // 残すと 5 回で 500ms が下限になり、実装の処理速度が見えない。
            const engine = new RealtimeEngine({
              artificialLatencyMs: 0,
              reconnect: { initialBackoffMs: 0 },
            });
            for (let i = 0; i < 5; i++) {
              await engine.ensureConnected();
              await engine.disconnect();
              await engine.reconnect();
            }
            await engine.disconnect();
          },
          serialP95CapMs: 100,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
