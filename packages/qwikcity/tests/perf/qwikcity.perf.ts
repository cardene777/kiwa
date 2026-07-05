import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-test/perf-harness';
import {
  invokeRouteLoader,
  invokeRouteAction,
  type RouteLoaderFunction,
  type RouteActionFunction,
} from '../../src/index.js';

const MODULE = 'qwikcity';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf/framework', `${MODULE}.md`);
const BASELINE_PATH = path.join(REPO_ROOT, '.perf-baseline/framework', `${MODULE}.json`);

describe(MODULE, () => {
  it(
    '3-layer perf: SSR (route loader) + hydration (route action) primary paths',
    async () => {
      // SSR path: Qwik City routeLoader$ runs on the server, hydrates client.
      // Measures event build (params + query + cookie) + await + wrap.
      const loader: RouteLoaderFunction = async () => ({ id: '1', name: 'kiwa' });

      // Hydration path: routeAction$ processes form POST, returns data.
      const action: RouteActionFunction = async () => ({ ok: true });

      const fd = new FormData();
      fd.set('name', 'kiwa');

      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        baselinePath: BASELINE_PATH,
        ops: [
          {
            // SSR — invokeRouteLoader builds SimulatedLoaderEvent (params +
            // query + cookie + redirect), awaits loader, wraps result.
            name: 'invokeRouteLoader',
            serialP95CapMs: 5,
            fn: async () => {
              await invokeRouteLoader({ loader, url: 'http://localhost/x' });
            },
          },
          {
            // Hydration — invokeRouteAction wraps event + FormData, awaits
            // action, captures fail / redirect signals.
            name: 'invokeRouteAction',
            serialP95CapMs: 5,
            fn: async () => {
              await invokeRouteAction({
                action,
                url: 'http://localhost/x',
                formData: fd,
              });
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
