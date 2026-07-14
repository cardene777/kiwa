/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { invokeEdgeHandler, createKvNamespace } from '../../src/index.js';

const MODULE = 'edge-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('edge app scenario perf (real workload)', () => {
  it('3-layer perf: edge fetch workflow / KV-bound batch / error handling', async () => {
    const kv = createKvNamespace({
      'user:1': 'alice',
      'user:2': 'bob',
      'user:3': 'carol',
      'user:4': 'dave',
      'user:5': 'eve',
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
          name: 'edge_fetch_workflow (10 invokeEdgeHandler)',
          fn: async () => {
            for (let i = 0; i < 10; i++) {
              await invokeEdgeHandler({
                handler: async () => new Response(JSON.stringify({ ok: true, id: i }), { status: 200 }),
                url: `https://x/item/${i}`,
                env: {},
              });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'kv_bound_batch (5 invokeEdgeHandler with KV read)',
          fn: async () => {
            for (let i = 1; i <= 5; i++) {
              await invokeEdgeHandler({
                handler: async (_req, env) => {
                  const value = await (env.USER_KV as ReturnType<typeof createKvNamespace>).get(`user:${i}`);
                  return new Response(value ?? '', { status: 200 });
                },
                url: `https://x/user/${i}`,
                env: { USER_KV: kv },
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
                await invokeEdgeHandler({
                  handler: async () => { throw new Error('boom'); },
                  url: 'https://x/fail',
                  env: {},
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
