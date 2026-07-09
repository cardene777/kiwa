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
});
