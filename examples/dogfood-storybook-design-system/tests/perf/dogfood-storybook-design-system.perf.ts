import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../../src/adapters/mock.js';
import { ALL_METAS } from '../../src/components/stories.js';
import {
  registerAndDiscoverStories,
  runA11yForAll,
  runPlayFunctionsForAll,
} from '../../src/flows/story-flows.js';

const MODULE = 'dogfood-storybook-design-system';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: registerAll / runPlayFunctionsForAll / runA11yForAll',
    async () => {
      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'registerAndDiscover',
            serialP95CapMs: 50,
            fn: async () => {
              const adapter = makeMockAdapter();
              await registerAndDiscoverStories(adapter);
              await adapter.reset();
            },
          },
          {
            name: 'runPlayFunctionsForAll',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await adapter.registerAll(ALL_METAS);
              await runPlayFunctionsForAll(adapter);
              await adapter.reset();
            },
          },
          {
            name: 'runA11yForAll',
            serialP95CapMs: 80,
            fn: async () => {
              const adapter = makeMockAdapter();
              await adapter.registerAll(ALL_METAS);
              await runA11yForAll(adapter);
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
