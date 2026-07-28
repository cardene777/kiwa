/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createPythonAppEnv, dispatchRequest, renderTemplate } from '../../src/index.js';

const MODULE = 'python-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('python app scenario perf (real workload)', () => {
  it('3-layer perf: rest_workflow / template_render_batch / middleware_chain_error', async () => {
    const frameworks = ['django', 'flask', 'fastapi', 'starlette'] as const;

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
          name: 'rest_workflow (10 dispatch across 4 frameworks)',
          fn: async () => {
            for (let i = 0; i < 10; i++) {
              const env = createPythonAppEnv({ framework: frameworks[i % 4] });
              env.registerRoute('GET', `/items/${i}`, async () => ({
                status: 200,
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ id: i, ok: true }),
              }));
              await dispatchRequest(env, { method: 'GET', path: `/items/${i}` });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'template_render_batch (5 Jinja2-like renders)',
          fn: async () => {
            const env = createPythonAppEnv({ framework: 'django' });
            env.registerTemplate('user_card', '<div>{{ name }} - {{ role }}</div>');
            env.registerTemplate('order_receipt', '<h1>Order {{ id }}</h1><p>{{ amount }}</p>');
            for (let i = 0; i < 5; i++) {
              renderTemplate(env, i % 2 === 0 ? 'user_card' : 'order_receipt', {
                name: `user-${i}`,
                role: 'admin',
                id: `o-${i}`,
                amount: 100 * i,
              });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'middleware_chain_error_handling (5 throw + catch)',
          fn: async () => {
            const env = createPythonAppEnv({ framework: 'fastapi' });
            env.registerMiddleware({
              name: 'auth',
              handler: async (_req, _next) => {
                throw new Error('unauthorized');
              },
            });
            env.registerRoute('GET', '/secure', async () => ({ status: 200, headers: {}, body: 'ok' }));
            for (let i = 0; i < 5; i++) {
              try {
                await dispatchRequest(env, { method: 'GET', path: '/secure' });
              } catch { /* handled */ }
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
