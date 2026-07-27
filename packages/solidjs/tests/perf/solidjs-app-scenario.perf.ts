/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderSolid, h } from '../../src/render.js';
import { mockSignal, mockEffect } from '../../src/signal.js';

const MODULE = 'solidjs-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('solidjs app scenario perf (real workload)', () => {
  it('3-layer perf: render workflow / signal reactive batch / error handling', async () => {
    const Card = ({ id, name }: { id: number; name: string }) =>
      h('div', { class: 'card' }, h('span', null, `#${id}`), h('span', null, name));

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
          name: 'render_workflow (10 renderSolid)',
          fn: () => {
            for (let i = 0; i < 10; i++) {
              const rendered = renderSolid({ component: Card, props: { id: i, name: `kiwa-${i}` } });
              rendered.dispose();
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'signal_reactive_batch (5 signal+effect update chains)',
          fn: () => {
            for (let i = 0; i < 5; i++) {
              const [get, set] = mockSignal(0);
              let observed = -1;
              const handle = mockEffect(() => {
                observed = get();
              });
              set(i + 1);
              if (observed !== i + 1) throw new Error(`unexpected: ${observed}`);
              handle.dispose();
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'render_error_handling (5 throw + catch in component)',
          fn: () => {
            for (let i = 0; i < 5; i++) {
              try {
                const Broken = () => { throw new Error('boom'); };
                const rendered = renderSolid({ component: Broken, props: {} });
                rendered.dispose();
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
