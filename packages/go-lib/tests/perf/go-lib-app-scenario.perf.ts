/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  invokeGinHandler,
  invokeEchoHandler,
  invokeFiberHandler,
  captureChiRoute,
  retryWithBackoff,
  batchDispatch,
} from '../../src/index.js';
import { createChiApp } from '../../src/chi.js';

const MODULE = 'go-lib-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('go-lib app scenario perf (real workload)', () => {
  it('5-op v2.1: framework_workflow / rest_batch / error / retry_workflow / batch_dispatch', async () => {
    const chi = createChiApp();
    chi.addRoute('GET', '/users/{id}', async (req) => ({ status: 200, body: { id: req.params?.id } }));
    chi.addRoute('POST', '/users', async (req) => ({ status: 201, body: req.body }));
    chi.addRoute('DELETE', '/users/{id}', async () => ({ status: 204 }));
    chi.use('logger', async (_name, next) => { await next(); });
    chi.use('recovery', async (_name, next) => { await next(); });

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
          name: '4_framework_workflow (10 dispatch across gin/echo/fiber/chi)',
          fn: async () => {
            for (let i = 0; i < 10; i++) {
              const kind = i % 4;
              if (kind === 0) {
                await invokeGinHandler({
                  handler: (c) => { c.JSON(200, { framework: 'gin', i }); },
                  req: { method: 'GET', path: `/gin/${i}` },
                });
              } else if (kind === 1) {
                await invokeEchoHandler({
                  handler: (c) => c.JSON(200, { framework: 'echo', i }),
                  req: { method: 'GET', path: `/echo/${i}` },
                });
              } else if (kind === 2) {
                await invokeFiberHandler({
                  handler: (c) => c.Status(200).JSON({ framework: 'fiber', i }),
                  req: { method: 'GET', path: `/fiber/${i}` },
                });
              } else {
                await captureChiRoute({ app: chi, method: 'GET', path: `/users/${i}` });
              }
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'rest_batch (5 POST + GET + DELETE via chi router)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              await captureChiRoute({ app: chi, method: 'POST', path: '/users', body: { name: `u-${i}` } });
              await captureChiRoute({ app: chi, method: 'GET', path: `/users/${i}` });
              await captureChiRoute({ app: chi, method: 'DELETE', path: `/users/${i}` });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'route_error_handling (5 unmatched 404 + echo handler error)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              await captureChiRoute({ app: chi, method: 'GET', path: `/nowhere/${i}` });
              await invokeEchoHandler({
                handler: () => new Error(`boom-${i}`),
                req: { method: 'GET', path: `/echo-fail/${i}` },
              });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'v2.1 retry_workflow (5 flaky handler、 3 attempt で成功)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              let attempts = 0;
              await retryWithBackoff(async () => {
                attempts += 1;
                if (attempts < 2) throw new Error(`flaky-${i}`);
                return `ok-${i}`;
              }, { maxAttempts: 3, initialDelayMs: 1 });
            }
          },
          serialP95CapMs: 200,
        },
        {
          name: 'v2.1 batch_dispatch (10 handler concurrent=4 で並列 dispatch)',
          fn: async () => {
            const handlers = Array.from({ length: 10 }, (_, i) => async () =>
              (await invokeGinHandler({
                handler: (c) => { c.JSON(200, { batch: i }); },
                req: { method: 'GET', path: `/b/${i}` },
              })).status,
            );
            await batchDispatch(handlers, { concurrency: 4 });
          },
          serialP95CapMs: 100,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
