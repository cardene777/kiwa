/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { invokeRouteLoader, invokeRouteAction } from '../../src/index.js';

const MODULE = 'qwikcity-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('qwikcity app scenario perf (real workload)', () => {
  it('3-layer perf: route loader workflow / route action form batch / error handling', async () => {
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
          name: 'route_loader_workflow (10 invokeRouteLoader)',
          fn: async () => {
            for (let i = 0; i < 10; i++) {
              await invokeRouteLoader({
                loader: async () => ({ id: `${i}`, name: `kiwa-${i}` }),
                url: `http://localhost/item/${i}`,
              });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'route_action_form_batch (5 invokeRouteAction with FormData)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              const fd = new FormData();
              fd.set('name', `kiwa-${i}`);
              await invokeRouteAction({
                action: async () => ({ ok: true, id: i }),
                url: `http://localhost/save/${i}`,
                formData: fd,
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
                await invokeRouteLoader({
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
    expect(result.allPassed).toBe(true);
  });
});
