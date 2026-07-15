/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  invokeGinHandler,
  invokeEchoHandler,
  invokeFiberHandler,
  captureChiRoute,
} from '../../src/index.js';
import { createChiApp } from '../../src/chi.js';

const MODULE = 'go-lib-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('go-lib app scenario perf (real workload)', () => {
  it('3-layer perf: 4_framework_workflow / rest_batch / route_error_handling', async () => {
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
      ],
    });
    expect(result).toBeDefined();
  });
});
