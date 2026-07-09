import { resolveKiwaRepoRoot, runPerf3LayerLive } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeRealAdapter } from '../../src/adapters/real.js';
import { seededPanels } from '../../src/panels/index.js';
import { requestRateQuery } from '../../src/queries/index.js';

const MODULE = 'dogfood-observability-dashboard';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.live.md`,
);

describe(`${MODULE} — live`, () => {
  it(
    '3-layer LIVE perf: runQuery via real Prometheus (env-skip when PROMETHEUS_URL absent)',
    async () => {
      const adapter = makeRealAdapter({
        dashboardId: 'perf-live',
        title: 'perf live',
        panels: seededPanels,
      });

      const result = await runPerf3LayerLive({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'runQuery.live',
            // Live threshold: typical Prometheus instant query p95 sits
            // in the 50-200 ms range for a small metric surface. 500 ms
            // is a generous cap that still catches regression.
            serialP95CapMs: 500,
            requiredEnv: ['PROMETHEUS_URL'],
            fn: async () => {
              try {
                await adapter.runQuery(requestRateQuery());
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
