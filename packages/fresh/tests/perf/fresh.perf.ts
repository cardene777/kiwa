import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa/perf-harness';
import {
  invokeFreshHandler,
  defineIsland,
  mountIsland,
  h,
  type FreshHandlers,
} from '../../src/index.js';

const MODULE = 'fresh';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf/framework', `${MODULE}.md`);
const BASELINE_PATH = path.join(REPO_ROOT, '.perf-baseline/framework', `${MODULE}.json`);

describe(MODULE, () => {
  it(
    '3-layer perf: SSR (route handler) + hydration (island mount) primary paths',
    async () => {
      // SSR path: Fresh route handler dispatches by HTTP method, returns
      // Response. Measures method-map lookup + Response snapshot.
      const handlers: FreshHandlers = {
        GET: () => new Response('hi', { status: 200 }),
      };

      // Client hydration path: island component mount serializes props +
      // component render into HTML + handlers. Measures mount pipeline.
      const Counter = defineIsland<{ start: number }>({
        name: 'Counter',
        component: (p) => h('span', { class: 'counter' }, `n=${p.start}`),
      });

      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        baselinePath: BASELINE_PATH,
        ops: [
          {
            // SSR — invokeFreshHandler dispatches handler by method, awaits
            // response, captures redirect / notFound signals.
            name: 'invokeFreshHandler',
            serialP95CapMs: 5,
            fn: async () => {
              await invokeFreshHandler({
                handlers,
                req: new Request('http://x/'),
              });
            },
          },
          {
            // Client hydration — mountIsland runs the component with props,
            // serializes tree to HTML, collects onClick / onInput handlers.
            name: 'mountIsland',
            serialP95CapMs: 5,
            fn: () => {
              mountIsland(Counter, { start: 5 });
            },
          },
        ],
      });

      for (const outcome of result.outcomes) {
        expect.soft(outcome.serialGatePassed, `${outcome.name} serial p95`).toBe(true);
        expect.soft(outcome.concurrentGatePassed, `${outcome.name} concurrent p95`).toBe(true);
        expect.soft(outcome.memoryGatePassed, `${outcome.name} memory arrayBuffers`).toBe(true);
      }
      expect(result.allPassed).toBe(true);
    },
    120_000,
  );
});
