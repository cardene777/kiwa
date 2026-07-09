import { resolveKiwaRepoRoot, runPerf3LayerLive } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeRealAdapter } from '../../src/adapters/real.js';
import { seededTraces } from '../../src/traces/index.js';

const MODULE = 'dogfood-trace-flame-graph';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.live.md`,
);

describe(`${MODULE} — live`, () => {
  it(
    '3-layer LIVE perf: loadTrace via real Jaeger HTTP API (env-skip when JAEGER_URL absent)',
    async () => {
      const adapter = makeRealAdapter({
        explorerId: 'perf-live',
        traces: seededTraces(),
      });

      const result = await runPerf3LayerLive({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'loadTrace.live',
            // Live threshold: Jaeger `/api/traces/{id}` is typically
            // 20-200 ms for a small deployment. 500 ms cap catches
            // regression without noise.
            serialP95CapMs: 500,
            requiredEnv: ['JAEGER_URL'],
            fn: async () => {
              try {
                await adapter.loadTrace('trace-http-handler');
              } catch (err) {
                if (err instanceof Error && err.message.includes('ENV_MISSING')) return;
                if (err instanceof Error && err.message.includes('FETCH_MISSING')) return;
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
