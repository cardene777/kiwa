/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createRouter,
  defineProcedure,
  invokeProcedure,
  createClient,
  middleware,
  TRPCError,
} from '../../src/index.js';

const MODULE = 'trpc-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('trpc app scenario perf (real workload)', () => {
  it('3-layer perf: router_dispatch_workflow / mutation_batch / middleware_error_handling', async () => {
    const authMw = middleware(async ({ ctx, next }) => {
      if (!ctx.userId) return { ok: false, error: new TRPCError({ code: 'UNAUTHORIZED' }) };
      return next();
    });

    const router = createRouter({
      procedures: {
        'user.get': defineProcedure('query', async ({ input, ctx }) => ({
          userId: ctx.userId,
          input,
        })),
        'user.list': defineProcedure('query', async () => [{ id: '1' }, { id: '2' }]),
        'post.create': defineProcedure(
          'mutation',
          async ({ input, ctx }) => ({ id: 'p1', authorId: ctx.userId, input }),
          [authMw],
        ),
        'post.delete': defineProcedure(
          'mutation',
          async ({ input }) => ({ deleted: (input as { id: string }).id }),
          [authMw],
        ),
        'admin.reset': defineProcedure('mutation', async () => {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'admin only' });
        }),
      },
    });
    const client = createClient(router);

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
          name: 'router_dispatch_workflow (10 query mix via client)',
          fn: async () => {
            for (let i = 0; i < 10; i++) {
              if (i % 2 === 0) {
                await client['user.get']!.query({ id: `u-${i}` }, { userId: `u-${i}` });
              } else {
                await client['user.list']!.query(undefined, { userId: 'admin' });
              }
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'mutation_batch (5 authenticated mutation)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              await invokeProcedure(
                router,
                'post.create',
                { title: `t-${i}` },
                { userId: `u-${i}` },
              );
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'middleware_error_handling (5 UNAUTHORIZED + FORBIDDEN throw+catch)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              try {
                if (i % 2 === 0) {
                  await invokeProcedure(router, 'post.delete', { id: `p-${i}` }, {});
                } else {
                  await invokeProcedure(router, 'admin.reset', {}, { userId: 'u' });
                }
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
