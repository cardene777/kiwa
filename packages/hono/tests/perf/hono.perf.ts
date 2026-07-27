import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import { createHonoApp, invokeRoute } from '../../src/index.js';
import { createRpcClient } from '../../src/rpc.js';

const MODULE = 'hono';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf/framework', `${MODULE}.md`);
const BASELINE_PATH = path.join(REPO_ROOT, '.perf-baseline/framework', `${MODULE}.json`);

describe(MODULE, () => {
  it(
    '3-layer perf: SSR (invokeRoute) + hydration (RPC client) primary paths',
    async () => {
      // SSR path: HonoApp receives Request, dispatches to matching handler,
      // returns Response. Measures route compile + match + handler exec.
      const app = createHonoApp();
      app.get('/hello', (c) => c.json({ ok: 1 }));

      // Hydration proxy: RPC client is edge runtime typed client, calls
      // route via $get / $post. Measures request build + response snapshot.
      const rpcApp = createHonoApp();
      rpcApp.get('/hello', (c) => c.json({ ok: 1 }));
      const client = createRpcClient(rpcApp) as {
        hello: { $get: () => Promise<{ status: number; ok: boolean; json: () => Promise<unknown> }> };
      };

      const result = await runPerf3Layer({
        moduleName: MODULE,
        requireGc: true,
        reportPath: REPORT_PATH,
        baselinePath: BASELINE_PATH,
        ops: [
          {
            // SSR — invokeRoute compiles route + matches path + runs handler +
            // captures response body / bodyKind + middleware trace.
            name: 'invokeRoute',
            serialP95CapMs: 5,
            fn: async () => {
              await invokeRoute({ app, method: 'GET', path: '/hello' });
            },
          },
          {
            // Hydration — RPC client proxies method call to HTTP request via
            // Hono client shape. Same path resolution + response wrap.
            name: 'rpcClient$get',
            serialP95CapMs: 5,
            fn: async () => {
              await client.hello.$get();
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
