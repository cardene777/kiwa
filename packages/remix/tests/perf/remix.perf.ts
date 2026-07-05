import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-test/perf-harness';
import {
  invokeLoader,
  invokeAction,
  type LoaderFunction,
  type ActionFunction,
} from '../../src/index.js';

const MODULE = 'remix';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf/framework', `${MODULE}.md`);
const BASELINE_PATH = path.join(REPO_ROOT, '.perf-baseline/framework', `${MODULE}.json`);

describe(MODULE, () => {
  it(
    '3-layer perf: SSR (loader) + hydration (action) primary paths',
    async () => {
      // SSR path: Remix loader returns data or a Response for the initial
      // render. Measures Request build + args wrap + result / Response snapshot.
      const loader: LoaderFunction = async () => ({ ok: true });

      // Hydration path: Remix action handles POST forms, returns data or a
      // Response. Same wrap cost as loader.
      const action: ActionFunction = async () => ({ saved: 1 });

      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        baselinePath: BASELINE_PATH,
        ops: [
          {
            // SSR — invokeLoader builds SimulatedRouteArgs (Request + params +
            // context), runs loader, captures redirect / Response.
            name: 'invokeLoader',
            serialP95CapMs: 5,
            fn: async () => {
              await invokeLoader({ loader, url: 'http://localhost/items' });
            },
          },
          {
            // Hydration — invokeAction reads FormData / Request body, runs
            // action, captures redirect / Response snapshot.
            name: 'invokeAction',
            serialP95CapMs: 5,
            fn: async () => {
              await invokeAction({ action, url: 'http://localhost/items' });
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
