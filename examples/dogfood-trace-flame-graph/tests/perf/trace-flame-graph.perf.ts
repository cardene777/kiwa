import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-test/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../../src/adapters/mock.js';
import { seededTraces } from '../../src/traces/index.js';

const MODULE = 'dogfood-trace-flame-graph';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: loadTrace / renderFlame / drillDown (10 traces × flame graph × log correlation)',
    async () => {
      const adapter = makeMockAdapter({
        explorerId: 'perf-mock',
        traces: seededTraces(),
      });
      // Warm the cache so the perf loop measures lookup latency instead
      // of tree-build latency. The alert-orchestrator equivalent seeds
      // the collector; here we seed the memoised flame + span tree.
      await adapter.loadTrace('trace-http-handler');
      await adapter.renderFlame('trace-http-handler');
      await adapter.loadTrace('trace-nested-retry');
      await adapter.renderFlame('trace-nested-retry');

      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'loadTrace',
            // Load walks the seeded map + Bumps counters. Well below
            // 20 ms p95 for the mock cache path.
            serialP95CapMs: 20,
            fn: async () => {
              await adapter.loadTrace('trace-http-handler');
            },
          },
          {
            name: 'renderFlame',
            // Render builds + memoises the flame; second-call collapse
            // is a Map lookup — O(1). 30 ms p95 leaves room for the
            // cold-cache first hit inside the loop's rotation.
            serialP95CapMs: 30,
            fn: async () => {
              await adapter.renderFlame('trace-nested-retry');
            },
          },
          {
            name: 'drillDown',
            // DrillDown walks the flame tree recursively — O(nodes).
            // The nested retry fixture has 6 spans so this stays
            // well under 20 ms.
            serialP95CapMs: 20,
            fn: async () => {
              await adapter.drillDown('trace-nested-retry', 'http.retry');
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
