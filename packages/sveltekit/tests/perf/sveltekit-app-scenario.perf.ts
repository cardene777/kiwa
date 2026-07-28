/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { invokeLoad, invokeAction } from '../../src/index.js';

const MODULE = 'sveltekit-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('sveltekit app scenario perf (real workload)', () => {
  it('3-layer perf: load workflow / form action batch / error handling', async () => {
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
          name: 'load_workflow (10 invokeLoad)',
          fn: async () => {
            for (let i = 0; i < 10; i++) {
              await invokeLoad({
                load: async () => ({ id: i, msg: `hello-${i}` }),
                url: `http://localhost/item/${i}`,
              });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'form_action_batch (5 invokeAction with FormData)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              const fd = new FormData();
              fd.set('name', `kiwa-${i}`);
              await invokeAction({
                action: async ({ request }) => {
                  const data = await request.formData();
                  return { ok: true, name: data.get('name') };
                },
                url: `http://localhost/save/${i}`,
                formData: fd,
              });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'load_error_handling (5 throw + catch)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              try {
                await invokeLoad({
                  load: async () => { throw new Error('boom'); },
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
