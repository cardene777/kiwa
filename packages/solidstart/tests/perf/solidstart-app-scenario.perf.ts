/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { invokeServerFunction, invokeApiRoute, json } from '../../src/index.js';

const MODULE = 'solidstart-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('solidstart app scenario perf (real workload)', () => {
  it('3-layer perf: server fn workflow / api route batch / error handling', async () => {
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
          name: 'server_function_workflow (10 invokeServerFunction)',
          fn: async () => {
            for (let i = 0; i < 10; i++) {
              await invokeServerFunction({
                fn: async (name: string, id: number) => ({ ok: true, name, id }),
                args: [`kiwa-${i}`, i],
              });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'api_route_batch (5 invokeApiRoute)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              await invokeApiRoute({
                handler: async () => json({ ok: true, id: i }),
                url: `http://localhost/api/item/${i}`,
              });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'fn_error_handling (5 throw + catch)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              try {
                await invokeServerFunction({
                  fn: async () => { throw new Error('boom'); },
                  args: [],
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
