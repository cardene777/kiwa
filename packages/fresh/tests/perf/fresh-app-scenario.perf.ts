/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { invokeFreshHandler, defineIsland, mountIsland, h, type FreshHandlers } from '../../src/index.js';

const MODULE = 'fresh-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('fresh app scenario perf (real workload)', () => {
  it('3-layer perf: handler workflow / island mount batch / error handling', async () => {
    const handlers: FreshHandlers = {
      GET: () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
      POST: async (req) => {
        const body = await req.text();
        return new Response(JSON.stringify({ saved: body.length }), { status: 200 });
      },
    };

    const Counter = defineIsland<{ start: number; label: string }>({
      name: 'Counter',
      component: (p) => h('div', { class: 'counter' }, h('span', null, p.label), h('span', null, `n=${p.start}`)),
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
          name: 'handler_workflow (10 invokeFreshHandler GET+POST mix)',
          fn: async () => {
            for (let i = 0; i < 10; i++) {
              const method = i % 2 === 0 ? 'GET' : 'POST';
              await invokeFreshHandler({
                handlers,
                req: new Request(`http://x/item/${i}`, {
                  method,
                  body: method === 'POST' ? `data-${i}` : undefined,
                }),
              });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'island_mount_batch (5 mountIsland with different props)',
          fn: () => {
            for (let i = 0; i < 5; i++) {
              mountIsland(Counter, { start: i, label: `counter-${i}` });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'handler_error_handling (5 throw + catch)',
          fn: async () => {
            const throwing: FreshHandlers = {
              GET: () => { throw new Error('boom'); },
            };
            for (let i = 0; i < 5; i++) {
              try {
                await invokeFreshHandler({
                  handlers: throwing,
                  req: new Request('http://x/fail'),
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
