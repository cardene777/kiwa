/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { invokeLoader, invokeAction } from '../../src/index.js';

const MODULE = 'remix-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('remix app scenario perf (real workload)', () => {
  it('3-layer perf: loader workflow / action batch / error handling', async () => {
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
          name: 'loader_workflow (10 invokeLoader)',
          fn: async () => {
            for (let i = 0; i < 10; i++) {
              await invokeLoader({
                loader: async () => ({ id: i, ok: true }),
                url: `http://localhost/items/${i}`,
              });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'action_batch (5 invokeAction)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              await invokeAction({
                action: async () => ({ saved: i }),
                url: `http://localhost/items/${i}`,
              });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'loader_error_handling (5 throw + catch)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              try {
                await invokeLoader({
                  loader: async () => { throw new Error('boom'); },
                  url: 'http://localhost/fail',
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
