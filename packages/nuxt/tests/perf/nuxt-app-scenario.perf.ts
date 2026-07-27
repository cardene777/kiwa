/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { invokeEventHandler, invokeRouteMiddleware } from '../../src/index.js';

const MODULE = 'nuxt-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('nuxt app scenario perf (real workload)', () => {
  it('3-layer perf: event handler workflow / middleware chain / error handling', async () => {
    const result = await runPerf3Layer({
      moduleName: MODULE,
      requireGc: true,
      reportPath: REPORT_PATH,
      serialIterations: 20,
      serialWarmup: 3,
      concurrency: 4,
      iterationsPerWorker: 5,
      memoryIterations: 20,
      ops: [
        {
          name: 'event_handler_workflow (10 invokeEventHandler)',
          fn: async () => {
            for (let i = 0; i < 10; i++) {
              await invokeEventHandler({
                handler: async () => ({ ok: true, id: i }),
                url: `http://localhost/api/item/${i}`,
              });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'middleware_chain (5 invokeRouteMiddleware)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              await invokeRouteMiddleware({
                middleware: () => undefined,
                to: { path: `/page/${i}` },
                from: { path: '/' },
              });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'handler_error_handling (5 throw + catch)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              try {
                await invokeEventHandler({
                  handler: async () => { throw new Error('boom'); },
                  url: 'http://localhost/api/fail',
                });
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
