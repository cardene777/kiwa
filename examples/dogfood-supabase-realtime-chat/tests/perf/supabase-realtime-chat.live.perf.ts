import { resolveKiwaRepoRoot, runPerf3LayerLive } from '@kiwa/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeRealAdapter } from '../../src/adapters/real.js';

const MODULE = 'dogfood-supabase-realtime-chat';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.live.md`,
);

describe(`${MODULE} — live`, () => {
  it(
    '3-layer LIVE perf: sendMessage via real Supabase Realtime (env-skip when SUPABASE_URL / SUPABASE_ANON_KEY absent)',
    async () => {
      const adapter = makeRealAdapter();
      const channel = 'perf-live-room';
      try {
        await adapter.joinRoom({ channel, userId: 'u-live-perf' });
      } catch {
        // env-missing skip path handled below
      }

      const result = await runPerf3LayerLive({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'sendMessage.live',
            // Live threshold: Supabase Realtime WebSocket round-trip ~250ms
            serialP95CapMs: 250,
            requiredEnv: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
            fn: async () => {
              try {
                await adapter.sendMessage({
                  channel,
                  userId: 'u-live-perf',
                  text: 'perf-ping',
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
