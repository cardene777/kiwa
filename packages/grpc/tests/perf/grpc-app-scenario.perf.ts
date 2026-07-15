/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createGrpcServer,
  defineService,
  invokeUnary,
  invokeServerStream,
  invokeBidi,
  composeInterceptors,
  createDeadlineContext,
  isDeadlineExceeded,
  createCancelToken,
  createMetadata,
  STATUS_CODES,
  type Interceptor,
} from '../../src/index.js';

const MODULE = 'grpc-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('grpc app scenario perf v2.1 (real workload)', () => {
  it('5-op perf: unary / streaming / error / interceptor / cancel+deadline', async () => {
    const providers = ['grpc-js', 'nice-grpc', 'twirp', 'connect'] as const;
    const servers = providers.map((p) => {
      const s = createGrpcServer({ provider: p });
      s.addService(
        defineService('User', [
          { name: 'get', type: 'unary', handler: async (req: unknown) => ({ id: (req as { id: number }).id, name: `u${(req as { id: number }).id}` }) },
          { name: 'list', type: 'server-stream', handler: async function* () { for (let i = 0; i < 3; i++) yield { i }; } },
          { name: 'chat', type: 'bidi', handler: async function* (reqs: AsyncIterable<unknown>) { for await (const r of reqs) yield { reply: `ack:${JSON.stringify(r)}` }; } },
          { name: 'fail', type: 'unary', handler: async () => { throw Object.assign(new Error('boom'), { code: 13 }); } },
        ]),
      );
      return s;
    });

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
          name: 'multi_service_workflow (10 invokeUnary across 4 providers)',
          fn: async () => {
            for (let i = 0; i < 10; i++) {
              const s = servers[i % 4]!;
              await invokeUnary(s, 'User', 'get', { id: i });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'streaming_batch (5 server-stream + bidi mix)',
          fn: async () => {
            const s = servers[0]!;
            for (let i = 0; i < 5; i++) {
              if (i % 2 === 0) await invokeServerStream(s, 'User', 'list', {});
              else await invokeBidi(s, 'User', 'chat', [{ msg: `m${i}` }, { msg: `m${i}b` }]);
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'error_status_batch (5 fail method returns INTERNAL)',
          fn: async () => {
            const s = servers[0]!;
            for (let i = 0; i < 5; i++) {
              const r = await invokeUnary(s, 'User', 'fail', {});
              if (r.ok) throw new Error('expected error');
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'interceptor_chain_batch (10 unary through auth+log)',
          fn: async () => {
            const auth: Interceptor = async (ctx, next) => {
              if (!ctx.metadata.length) return { status: { code: STATUS_CODES.UNAUTHENTICATED, message: 'no auth' } };
              return next();
            };
            const log: Interceptor = async (_c, next) => next();
            const chain = composeInterceptors([auth, log]);
            for (let i = 0; i < 10; i++) {
              await chain(
                { service: 'User', method: 'get', metadata: createMetadata({ auth: 'bearer' }), request: { id: i } },
                async () => ({ response: { id: i }, status: { code: 0, message: '' } }),
              );
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'cancel_deadline_batch (5 cancel + 5 deadline expired)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              const token = createCancelToken();
              token.cancel(`abort-${i}`);
              if (!token.isCanceled()) throw new Error('cancel failed');
            }
            let t = 0;
            for (let i = 0; i < 5; i++) {
              const ctx = createDeadlineContext(10, () => t);
              t += 20;
              if (!isDeadlineExceeded(ctx)) throw new Error('deadline not detected');
            }
          },
          serialP95CapMs: 100,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
