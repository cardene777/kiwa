import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../../src/adapters/mock.js';
import {
  acceptAllPendingChanges,
  captureAllScenesChanged,
  captureAllScenesNeutral,
  seedAllBaselines,
} from '../../src/flows/visual-flows.js';

const MODULE = 'dogfood-visual-regression';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: seedAllBaselines / captureAllScenesNeutral / captureAllScenesChanged / acceptAllPendingChanges',
    async () => {
      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'seedAllBaselines',
            serialP95CapMs: 50,
            fn: async () => {
              const adapter = makeMockAdapter();
              await seedAllBaselines(adapter);
              await adapter.reset();
            },
          },
          {
            name: 'captureAllScenesNeutral',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await seedAllBaselines(adapter);
              await captureAllScenesNeutral(adapter);
              await adapter.reset();
            },
          },
          {
            name: 'captureAllScenesChanged',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await seedAllBaselines(adapter);
              await captureAllScenesChanged(adapter);
              await adapter.reset();
            },
          },
          {
            name: 'acceptAllPendingChanges',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await seedAllBaselines(adapter);
              await captureAllScenesChanged(adapter);
              await acceptAllPendingChanges(adapter);
              await adapter.reset();
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
