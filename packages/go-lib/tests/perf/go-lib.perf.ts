import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { baselinePathFor, resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import {
  createGoAppEnv,
  invokeGinHandler,
  invokeEchoHandler,
  invokeFiberHandler,
  captureChiRoute,
} from '../../src/index.js';
import { createChiApp } from '../../src/chi.js';

const MODULE = 'go-lib';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf', `${MODULE}.md`);
const BASELINE_PATH = baselinePathFor(REPO_ROOT, MODULE);

describe(MODULE, () => {
  it(
    '3-layer perf: 4 framework handler dispatch primary paths',
    async () => {
      const app = createChiApp();
      app.addRoute('GET', '/health', async () => ({ status: 200, body: { ok: true } }));

      const result = await runPerf3Layer({
        moduleName: MODULE,
        requireGc: true,
        reportPath: REPORT_PATH,
        baselinePath: BASELINE_PATH,
        ops: [
          {
            name: 'invokeGinHandler',
            serialP95CapMs: 5,
            fn: async () => {
              await invokeGinHandler({
                handler: (c) => { c.JSON(200, { ok: true }); },
                req: { method: 'GET', path: '/health' },
              });
            },
          },
          {
            name: 'invokeEchoHandler',
            serialP95CapMs: 5,
            fn: async () => {
              await invokeEchoHandler({
                handler: (c) => c.JSON(200, { ok: true }),
                req: { method: 'GET', path: '/health' },
              });
            },
          },
          {
            name: 'invokeFiberHandler',
            serialP95CapMs: 5,
            fn: async () => {
              await invokeFiberHandler({
                handler: (c) => c.Status(200).JSON({ ok: true }),
                req: { method: 'GET', path: '/health' },
              });
            },
          },
          {
            name: 'captureChiRoute',
            serialP95CapMs: 5,
            fn: async () => {
              await captureChiRoute({ app, method: 'GET', path: '/health' });
            },
          },
        ],
      });

      const env = createGoAppEnv({ framework: 'gin' });
      env.addRoute({ method: 'GET', path: '/x', handlerName: 'h' });
      expect(env.listRoutes().length).toBe(1);

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
    'timing baseline: performance.now() 100 回連続で serial p95 < 1ms',
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
    'allocation baseline: 小 object 100 回生成の max latency < 5ms',
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
