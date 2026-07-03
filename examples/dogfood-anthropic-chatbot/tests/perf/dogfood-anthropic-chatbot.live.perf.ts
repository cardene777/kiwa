import { resolveKiwaRepoRoot, runPerf3LayerLive } from '@kiwa-test/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeRealAdapter } from '../../src/adapters/real.js';
import { greetUser } from '../../src/flows/chatbot-flows.js';

const MODULE = 'dogfood-anthropic-chatbot';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.live.md`,
);

describe(`${MODULE} — live`, () => {
  it(
    '3-layer LIVE perf: reply via real Anthropic Messages API (env-skip when ANTHROPIC_API_KEY absent)',
    async () => {
      // Reuse the same real adapter across iterations so DNS + connection
      // reuse work naturally — matches how a SaaS handler would behave.
      const adapter = makeRealAdapter();

      const result = await runPerf3LayerLive({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'reply.live',
            // Live threshold from docs/quality/perf-thresholds.md
            // (Anthropic Messages non-streaming SLA ~1500ms).
            serialP95CapMs: 1500,
            requiredEnv: ['ANTHROPIC_API_KEY'],
            fn: async () => {
              try {
                await greetUser(adapter);
              } catch (err) {
                // ANTHROPIC_ENV_MISSING should never fire here (requiredEnv
                // guarded above). Any other error is a real network / API
                // failure and re-thrown so the perf run surfaces it.
                if (err instanceof Error && err.message.includes('ENV_MISSING')) return;
                throw err;
              }
            },
          },
        ],
      });

      // Live runs pass when env is missing (skipped state is expected in
      // CI-less environments). When env is present all gates must pass.
      const measured = result.outcomes.filter((o) => !o.skipped);
      if (measured.length > 0) {
        for (const outcome of measured) {
          expect.soft(outcome.serialGatePassed, `${outcome.name} live serial p95`).toBe(true);
        }
        expect(result.allPassed).toBe(true);
      } else {
        // No env: report is emitted with LIVE_ENV_MISSING marker.
        expect(result.anySkipped).toBe(true);
      }
    },
    600_000,
  );
});
