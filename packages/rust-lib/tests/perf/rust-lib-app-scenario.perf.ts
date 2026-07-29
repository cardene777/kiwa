/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createRustAppEnv,
  invokeAxumHandler,
  invokeActixHandler,
  captureTowerMiddleware,
  invokeRocketRoute,
} from '../../src/index.js';

const MODULE = 'rust-lib-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('rust-lib app scenario perf (real workload)', () => {
  it('3-layer perf: rest_handler_workflow / middleware_chain_batch / route_error_handling', async () => {
    const env = createRustAppEnv({ framework: 'axum' });
    for (let i = 0; i < 5; i++) {
      env.addRoute({
        method: 'GET',
        path: `/items/${i}`,
        handler: async () => ({ id: i, name: `item-${i}` }),
      });
    }

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
          name: 'rest_handler_workflow (10 axum + actix + rocket mixed)',
          fn: async () => {
            for (let i = 0; i < 10; i++) {
              const frameworks = ['axum', 'actix', 'rocket'];
              const framework = frameworks[i % 3];
              if (framework === 'axum') {
                await invokeAxumHandler({
                  handler: async () => ({ ok: true, id: i }),
                  method: 'GET',
                  path: `/x/${i}`,
                });
              } else if (framework === 'actix') {
                await invokeActixHandler({
                  handler: async () => ({ ok: true, id: i }),
                  method: 'POST',
                  path: `/y/${i}`,
                });
              } else {
                await invokeRocketRoute({
                  route: async () => ({ ok: true, id: i }),
                  method: 'GET',
                  path: `/z/${i}`,
                });
              }
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'middleware_chain_batch (5 tower layer chains)',
          fn: async () => {
            const logMw = async (req: { method: string; path: string; headers: Record<string, string> }, next: (r: typeof req) => Promise<{ status: number; body: unknown }>) => next(req);
            const authMw = async (req: { method: string; path: string; headers: Record<string, string> }, next: (r: typeof req) => Promise<{ status: number; body: unknown }>) => next(req);
            for (let i = 0; i < 5; i++) {
              await captureTowerMiddleware({
                middleware: [logMw, authMw],
                request: { method: 'GET', path: `/api/${i}`, headers: { 'x-req-id': String(i) } },
                handler: async () => ({ status: 200, body: { i } }),
              });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'route_error_handling (5 handler throw + catch)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              const res = await invokeAxumHandler({
                handler: async () => { throw new Error('boom'); },
                method: 'GET',
                path: '/fail',
              });
              if (res.status !== 500) throw new Error(`expected 500 got ${res.status}`);
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'retry_recovery (5 flaky async retry to success)',
          fn: async () => {
            const mod = await import('../../src/index.js');
            const wr = mod.withRetry;
            let ctr = 0;
            const wrapped = wr(async () => {
              ctr += 1;
              if (ctr % 3 !== 0) throw new Error('flake');
              return 'ok';
            }, { maxAttempts: 3 });
            for (let i = 0; i < 5; i += 1) {
              await wrapped().catch(() => null);
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'concurrent_batch (5 batches of 4 items with error isolation)',
          fn: async () => {
            const mod = await import('../../src/index.js');
            const bo = mod.batchOperate;
            for (let i = 0; i < 5; i += 1) {
              await bo(
                [{ name: 'a', input: 1 }, { name: 'b', input: 2 }, { name: 'c', input: 3 }, { name: 'd', input: 4 }],
                async (item) => (item.input as number) * 2,
              );
            }
          },
          serialP95CapMs: 100,
        },
      ],
    });
    expect(result.allPassed).toBe(true);
  });
});
