import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../../src/adapters/mock.js';
import { seededPanels } from '../../src/panels/index.js';
import {
  errorRateQuery,
  p99LatencyQuery,
  queueDepthQuery,
  requestRateQuery,
} from '../../src/queries/index.js';

const MODULE = 'dogfood-observability-dashboard';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: refreshDashboard / runQuery (5 panels, 4 metric queries)',
    async () => {
      const adapter = makeMockAdapter({
        dashboardId: 'perf-mock',
        title: 'perf mock',
        panels: seededPanels,
      });
      const queries = [
        errorRateQuery(),
        p99LatencyQuery(),
        queueDepthQuery(),
        requestRateQuery(),
      ];
      let queryIndex = 0;

      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'refreshDashboard',
            // Refresh evaluates 5 panels against an in-memory collector —
            // ~5 * O(matched) filters, well below 30 ms serial p95.
            serialP95CapMs: 30,
            fn: async () => {
              await adapter.refreshDashboard();
            },
          },
          {
            name: 'runQuery',
            // Single-query path is a single collector filter + reduce,
            // ~10x faster than refreshDashboard.
            serialP95CapMs: 20,
            fn: async () => {
              const q = queries[queryIndex % queries.length];
              queryIndex += 1;
              await adapter.runQuery(q!);
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
