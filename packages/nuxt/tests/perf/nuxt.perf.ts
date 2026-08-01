import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { baselinePathFor, resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import {
  invokeEventHandler,
  invokeRouteMiddleware,
  type EventHandlerFunction,
  type RouteMiddlewareFunction,
} from '../../src/index.js';

const MODULE = 'nuxt';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf/framework', `${MODULE}.md`);
const BASELINE_PATH = baselinePathFor(REPO_ROOT, MODULE, 'framework');

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
        requireGc: true,
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

  it(
    'timing baseline: performance.now() 100 回連続で serial p95 < 1ms (perf harness 環境 sanity)',
    () => {
      const N = 100;
      const samples: number[] = [];
      for (let i = 0; i < N; i += 1) {
        const s = performance.now();
        void performance.now();
        samples.push(performance.now() - s);
      }
      samples.sort((a, b) => a - b);
      const p95 = samples[Math.floor(samples.length * 0.95)] ?? 0;
      expect(p95).toBeLessThan(1);
    },
    30_000,
  );

  it(
    'allocation baseline: 小 object 100 回生成の max latency < 5ms (V8 alloc floor)',
    () => {
      const N = 100;
      let maxLatency = 0;
      for (let i = 0; i < N; i += 1) {
        const start = performance.now();
        const obj = { id: i, val: `v${i}`, ts: Date.now() };
        if (obj.id < 0) throw new Error('unreachable');
        const elapsed = performance.now() - start;
        if (elapsed > maxLatency) maxLatency = elapsed;
      }
      expect(maxLatency).toBeLessThan(5);
    },
    30_000,
  );
});
