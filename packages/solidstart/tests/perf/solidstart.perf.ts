import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import {
  invokeServerFunction,
  invokeApiRoute,
  json,
  type ServerFunctionFunction,
  type APIRouteHandler,
} from '../../src/index.js';

const MODULE = 'solidstart';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf/framework', `${MODULE}.md`);
const BASELINE_PATH = path.join(REPO_ROOT, '.perf-baseline/framework', `${MODULE}.json`);

describe(MODULE, () => {
  it(
    '3-layer perf: SSR (server function) + hydration (API route) primary paths',
    async () => {
      // SSR path: SolidStart server function runs on the server, can throw
      // redirect(). Measures env snapshot + result / redirect capture.
      const fn: ServerFunctionFunction<readonly [string], { ok: true; name: string }> = async (name) => ({
        ok: true,
        name,
      });

      // Hydration proxy: API route handler returns Response, captures redirect
      // + response snapshot.
      const handler: APIRouteHandler = async () => json({ ok: true });

      const result = await runPerf3Layer({
        moduleName: MODULE,
        requireGc: true,
        reportPath: REPORT_PATH,
        baselinePath: BASELINE_PATH,
        ops: [
          {
            // SSR — invokeServerFunction wraps request headers / cookies env,
            // awaits fn, decodes redirect signal.
            name: 'invokeServerFunction',
            serialP95CapMs: 5,
            fn: async () => {
              await invokeServerFunction({ fn, args: ['kiwa'] });
            },
          },
          {
            // Hydration proxy — invokeApiRoute builds SimulatedAPIEvent, awaits
            // handler, captures Response + redirect.
            name: 'invokeApiRoute',
            serialP95CapMs: 5,
            fn: async () => {
              await invokeApiRoute({ handler, url: 'http://localhost/api/health' });
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
