/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { invokeEndpoint, renderAstroPage } from '../../src/index.js';

const MODULE = 'astro-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('astro app scenario perf (real workload)', () => {
  it('3-layer perf: page render workflow / endpoint batch / error handling', async () => {
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
          name: 'page_render_workflow (10 renderAstroPage)',
          fn: async () => {
            for (let i = 0; i < 10; i++) {
              await renderAstroPage({
                page: () => `<h1>item ${i}</h1>`,
                url: `https://x/item/${i}`,
              });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'endpoint_batch (5 invokeEndpoint JSON responses)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              await invokeEndpoint({
                endpoint: async () =>
                  new Response(JSON.stringify({ ok: true, id: i }), {
                    headers: { 'content-type': 'application/json' },
                  }),
                url: `http://localhost/api/item/${i}`,
              });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'endpoint_error_handling (5 throw + catch)',
          fn: async () => {
            for (let i = 0; i < 5; i++) {
              try {
                await invokeEndpoint({
                  endpoint: async () => { throw new Error('boom'); },
                  url: 'http://localhost/api/fail',
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
