/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createRubyAppEnv,
  dispatchRailsRequest,
  dispatchGenericRequest,
  renderERB,
  captureActiveRecord,
} from '../../src/index.js';

const MODULE = 'ruby-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('ruby app scenario perf (real workload)', () => {
  it('3-layer perf: rails_crud_workflow / multi_framework_batch / erb_error_handling', async () => {
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
          name: 'rails_crud_workflow (10 dispatch with AR log)',
          fn: async () => {
            const env = createRubyAppEnv({ framework: 'rails' });
            for (let i = 0; i < 10; i++) {
              await dispatchRailsRequest(
                env,
                { method: 'POST', path: `/posts/${i}` },
                {
                  beforeActions: [() => { env.recordAR({ op: 'find', model: 'User', args: { id: 1 } }); }],
                  action: async () => {
                    env.recordAR({ op: 'create', model: 'Post', args: { title: `p${i}` } });
                    return { status: 201, body: `{"id":${i}}`, headers: {}, cookies: {}, session: {} };
                  },
                },
              );
            }
            captureActiveRecord(env);
          },
          serialP95CapMs: 100,
        },
        {
          name: 'multi_framework_batch (4 framework dispatch x2)',
          fn: async () => {
            const frameworks = ['rails', 'sinatra', 'roda', 'hanami'] as const;
            for (let round = 0; round < 2; round++) {
              for (const framework of frameworks) {
                const env = createRubyAppEnv({
                  framework,
                  routes: [
                    {
                      method: 'GET',
                      path: '/hello',
                      handler: () => ({
                        status: 200,
                        body: `${framework}-${round}`,
                        headers: {},
                        cookies: {},
                        session: {},
                      }),
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
                await dispatchGenericRequest(env, { method: 'GET', path: '/hello' });
              }
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'erb_render_missing_key (5 render + missing collect)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              const result = renderERB('<b><%= name %></b><i><%= missing %></i>', { name: `u${i}` });
              if (result.missing.length !== 1) throw new Error('unexpected missing count');
            }
          },
          serialP95CapMs: 100,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
