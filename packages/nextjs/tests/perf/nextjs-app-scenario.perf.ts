/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { invokeServerAction } from '../../src/index.js';

const MODULE = 'nextjs-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('nextjs app scenario perf (real workload)', () => {
  it('3-layer perf: server action / form submission / error boundary', async () => {
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
          name: 'server_action_workflow (10 invokeServerAction)',
          fn: async () => {
            for (let i = 0; i < 10; i++) {
              await invokeServerAction({ action: async () => ({ ok: true, id: i }) });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'form_submission_batch (5 invoke with FormData)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              const fd = new FormData();
              fd.append('key', `v-${i}`);
              await invokeServerAction({ action: async (data: FormData) => data.get('key'), formData: fd });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'action_error_handling (5 throw + catch)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              try {
                await invokeServerAction({ action: async () => { throw new Error('boom'); } });
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
