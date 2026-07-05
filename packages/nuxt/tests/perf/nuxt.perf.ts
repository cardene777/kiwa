import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-test/perf-harness';
import {
  invokeEventHandler,
  invokeRouteMiddleware,
  type EventHandlerFunction,
  type RouteMiddlewareFunction,
} from '../../src/index.js';

const MODULE = 'nuxt';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf/framework', `${MODULE}.md`);
const BASELINE_PATH = path.join(REPO_ROOT, '.perf-baseline/framework', `${MODULE}.json`);

describe(MODULE, () => {
  it(
    '3-layer perf: SSR (event handler) + hydration (route middleware) primary paths',
    async () => {
      // SSR path: defineEventHandler receives simulated H3Event, returns
      // response body. Measures URL parse + env capture + handler execution.
      const eventHandler: EventHandlerFunction<{ ok: boolean }> = async () => ({ ok: true });

      // Hydration path: client-side route middleware runs before navigation.
      // Measures route location snapshot + navigation signal decode.
      const routeMiddleware: RouteMiddlewareFunction = () => undefined;

      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        baselinePath: BASELINE_PATH,
        ops: [
          {
            // SSR — invokeEventHandler builds SimulatedH3Event + env snapshot,
            // awaits handler, captures response headers / cookies / status.
            name: 'invokeEventHandler',
            serialP95CapMs: 5,
            fn: async () => {
              await invokeEventHandler({
                handler: eventHandler,
                url: 'http://localhost/api/health',
              });
            },
          },
          {
            // Hydration proxy — client route middleware runs same wrap cost
            // as SSR event handler (simulated route location + env snapshot).
            name: 'invokeRouteMiddleware',
            serialP95CapMs: 5,
            fn: async () => {
              await invokeRouteMiddleware({
                middleware: routeMiddleware,
                to: { path: '/next' },
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
