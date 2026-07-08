import { resolveKiwaRepoRoot, runPerf3LayerLive } from '@kiwa/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeRealAdapter } from '../../src/adapters/real.js';
import { seededRules } from '../../src/rules/index.js';
import { seededRoute } from '../../src/routing/index.js';
import { seededEscalation } from '../../src/escalation/index.js';

const MODULE = 'dogfood-alert-orchestrator';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.live.md`,
);

describe(`${MODULE} — live`, () => {
  it(
    '3-layer LIVE perf: evaluateRules via real Prometheus AlertManager (env-skip when ALERTMANAGER_URL absent)',
    async () => {
      const adapter = makeRealAdapter({
        orchestratorId: 'perf-live',
        rules: seededRules,
        route: seededRoute(),
        silences: [],
        escalation: seededEscalation(),
      });

      const result = await runPerf3LayerLive({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'evaluateRules.live',
            // Live threshold: AlertManager `/api/v2/alerts` is typically
            // 50-200 ms round trip for a small deployment. 500 ms cap
            // catches regression without noise.
            serialP95CapMs: 500,
            requiredEnv: ['ALERTMANAGER_URL'],
            fn: async () => {
              try {
                await adapter.evaluateRules();
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
