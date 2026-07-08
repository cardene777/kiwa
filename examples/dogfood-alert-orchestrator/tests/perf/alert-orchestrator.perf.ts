import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../../src/adapters/mock.js';
import { seededRules } from '../../src/rules/index.js';
import { seededRoute } from '../../src/routing/index.js';
import { seededEscalation } from '../../src/escalation/index.js';
import type { AlertFireEvent } from '../../src/adapters/interface.js';

const MODULE = 'dogfood-alert-orchestrator';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: evaluateRules / routeAlert / advanceEscalation (10 rules × 3 routing × silence × escalation)',
    async () => {
      const adapter = makeMockAdapter({
        orchestratorId: 'perf-mock',
        rules: seededRules,
        route: seededRoute(),
        silences: [],
        escalation: seededEscalation(),
      });
      // Seed the collector with a batch of samples so every rule has
      // data to evaluate over the perf loop.
      await adapter.emitMetric({ metricName: 'http.errors', kind: 'counter', value: 20 });
      await adapter.emitMetric({ metricName: 'http.latency.ms', kind: 'histogram', value: 900 });
      await adapter.emitMetric({ metricName: 'queue.depth', kind: 'gauge', value: 1500 });
      await adapter.emitMetric({ metricName: 'disk.usage.percent', kind: 'gauge', value: 95 });

      const canonicalFire: AlertFireEvent = {
        ruleId: 'perf-canonical',
        severity: 'critical',
        labels: { severity: 'critical', team: 'platform' },
        value: 1,
        firedAt: 1_000,
        state: 'firing',
      };

      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'evaluateRules',
            // Evaluate walks 10 rules; each is a scalar filter + compare
            // over the collector. Well below 30 ms p95.
            serialP95CapMs: 30,
            fn: async () => {
              await adapter.evaluateRules();
            },
          },
          {
            name: 'routeAlert',
            // walkRoute descends a 3-level tree; O(3) filter compares.
            serialP95CapMs: 20,
            fn: async () => {
              await adapter.routeAlert(canonicalFire);
            },
          },
          {
            name: 'advanceEscalation',
            // Escalation tick walks active fires × 3 ladder steps —
            // O(fires × ladder). No active fires in the perf loop so
            // this collapses to O(1).
            serialP95CapMs: 20,
            fn: async () => {
              await adapter.advanceEscalation();
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
