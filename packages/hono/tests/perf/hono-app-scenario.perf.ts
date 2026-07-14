/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createHonoApp, invokeRoute } from '../../src/index.js';
import { createRpcClient } from '../../src/rpc.js';

const MODULE = 'hono-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('hono app scenario perf (real workload)', () => {
  it('3-layer perf: route workflow / rpc client batch / error handling', async () => {
    const app = createHonoApp();
    app.get('/items/:id', (c) => c.json({ ok: true, id: c.req.param('id') }));
    app.post('/items', async (c) => {
      const body = await c.req.json();
      return c.json({ saved: body });
    });
    app.get('/fail', () => { throw new Error('boom'); });

    const rpcApp = createHonoApp();
    rpcApp.get('/hello', (c) => c.json({ ok: 1 }));
    const client = createRpcClient(rpcApp) as {
      hello: { $get: () => Promise<{ status: number; ok: boolean; json: () => Promise<unknown> }> };
    };

    const result = await runPerf3Layer({
      moduleName: MODULE,
      reportPath: REPORT_PATH,
      serialIterations: 20,
      serialWarmup: 3,
      concurrency: 4,
      iterationsPerWorker: 5,
      memoryIterations: 20,
      ops: [
        {
          name: 'route_workflow (10 invokeRoute GET+POST mix)',
          fn: async () => {
            for (let i = 0; i < 10; i++) {
              if (i % 2 === 0) {
                await invokeRoute({ app, method: 'GET', path: `/items/${i}` });
              } else {
                await invokeRoute({
                  app,
                  method: 'POST',
                  path: '/items',
                  body: JSON.stringify({ id: i }),
                  headers: { 'content-type': 'application/json' },
                });
              }
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'rpc_client_batch (5 rpc calls)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              await client.hello.$get();
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'route_error_handling (5 throw + catch)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              try {
                await invokeRoute({ app, method: 'GET', path: '/fail' });
              } catch { /* handled */ }
            }
          },
          serialP95CapMs: 100,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
