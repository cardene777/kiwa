import { resolveKiwaRepoRoot, runPerf3LayerLive } from '@kiwa/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeRealAdapter } from '../../src/adapters/real.js';

const MODULE = 'dogfood-ably-collab-cursor';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.live.md`,
);

describe(`${MODULE} — live`, () => {
  it(
    '3-layer LIVE perf: moveCursor via real Ably (env-skip when ABLY_API_KEY absent)',
    async () => {
      const adapter = makeRealAdapter();
      const board = 'perf-live-board';
      try {
        await adapter.joinBoard({ board, userId: 'u-live-perf' });
      } catch {
        // env-missing skip
      }

      const result = await runPerf3LayerLive({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'moveCursor.live',
            // Live threshold: Ably SLA — 99.999% delivery within 200ms
            serialP95CapMs: 200,
            requiredEnv: ['ABLY_API_KEY'],
            fn: async () => {
              try {
                await adapter.moveCursor({
                  board,
                  userId: 'u-live-perf',
                  moveIntervalsMs: [16, 16, 16, 16, 16],
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
