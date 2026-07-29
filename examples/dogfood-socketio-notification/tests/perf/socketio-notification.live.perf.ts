import { resolveKiwaRepoRoot, runPerf3LayerLive } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeRealAdapter } from '../../src/adapters/real.js';

const MODULE = 'dogfood-socketio-notification';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.live.md`,
);

describe(`${MODULE} — live`, () => {
  it(
    '3-layer LIVE perf: deliverNotification via real Socket.io / SSE (env-skip when SOCKETIO_URL absent)',
    async () => {
      const adapter = makeRealAdapter();
      const room = 'perf-live-room';
      try {
        await adapter.subscribeRoom({
          namespace: '/notify',
          room,
          userId: 'u-live-perf',
        });
      } catch {
        // env-missing skip
      }

      const result = await runPerf3LayerLive({
        moduleName: MODULE,
        // GC を呼べない測定は解放される一時使用まで拾い、memory 上限との
        // 比較が成立しない。 測れていない実行を pass にしない (#1708)。
        requireGc: true,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'deliverNotification.live',
            // Live threshold: in-cluster network + Redis adapter round-trip ~100ms
            serialP95CapMs: 100,
            requiredEnv: ['SOCKETIO_URL'],
            fn: async () => {
              try {
                await adapter.deliverNotification({
                  namespace: '/notify',
                  room,
                  payload: { userId: 'u-live-perf', priority: 'medium', body: 'ping' },
                });
              } catch (err) {
                if (err instanceof Error && err.message.includes('ENV_MISSING')) return;
                throw err;
              }
            },
          },
        ],
      });

      const measured = result.outcomes.filter((o) => !o.skipped);
      if (measured.length > 0) {
        for (const outcome of measured) {
          expect.soft(outcome.serialGatePassed, `${outcome.name} live serial p95`).toBe(true);
        }
        expect(result.allPassed).toBe(true);
      } else {
        expect(result.anySkipped).toBe(true);
      }
    },
    600_000,
  );
});
