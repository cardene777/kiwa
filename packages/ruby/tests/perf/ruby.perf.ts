import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import {
  createRubyAppEnv,
  dispatchRailsRequest,
  dispatchGenericRequest,
  renderERB,
} from '../../src/index.js';

const MODULE = 'ruby';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf', `${MODULE}.md`);
const BASELINE_PATH = path.join(REPO_ROOT, '.perf-baseline', `${MODULE}.json`);

describe(MODULE, () => {
  it(
    '3-layer perf: rails dispatch + generic dispatch + erb render primary paths',
    async () => {
      const railsEnv = createRubyAppEnv({ framework: 'rails' });
      const sinatraEnv = createRubyAppEnv({
        framework: 'sinatra',
        routes: [
          {
            method: 'GET',
            path: '/hello',
            handler: () => ({ status: 200, body: 'hi', headers: {}, cookies: {}, session: {} }),
          },
        ],
      });

      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        baselinePath: BASELINE_PATH,
        ops: [
          {
            name: 'dispatchRailsRequest',
            serialP95CapMs: 5,
            fn: async () => {
              await dispatchRailsRequest(
                railsEnv,
                { method: 'GET', path: '/users/1' },
                {
                  action: async () => ({
                    status: 200,
                    body: '{"id":1}',
                    headers: { 'content-type': 'application/json' },
                    cookies: {},
                    session: {},
                  }),
                },
              );
            },
          },
          {
            name: 'dispatchGenericRequest',
            serialP95CapMs: 5,
            fn: async () => {
              await dispatchGenericRequest(sinatraEnv, { method: 'GET', path: '/hello' });
            },
          },
          {
            name: 'renderERB',
            serialP95CapMs: 5,
            fn: async () => {
              renderERB('<h1><%= name %></h1>', { name: 'kiwa' });
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
