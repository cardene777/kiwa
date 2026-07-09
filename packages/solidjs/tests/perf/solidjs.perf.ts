import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import { renderSolid, h } from '../../src/render.js';
import { mockSignal, mockEffect } from '../../src/signal.js';

const MODULE = 'solidjs';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf/framework', `${MODULE}.md`);
const BASELINE_PATH = path.join(REPO_ROOT, '.perf-baseline/framework', `${MODULE}.json`);

describe(MODULE, () => {
  it(
    '3-layer perf: SSR (renderSolid) + hydration (signal + effect) primary paths',
    async () => {
      // SSR path: renderSolid mounts static component, exposes tree + html.
      // Measures h + tree walk + stringify + effect registration.
      const Comp = ({ name }: { name: string }) => h('span', null, `hello ${name}`);

      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        baselinePath: BASELINE_PATH,
        ops: [
          {
            // SSR — renderSolid mounts component with props, walks tree,
            // returns html + effects + dispose.
            name: 'renderSolid',
            serialP95CapMs: 5,
            fn: () => {
              const rendered = renderSolid({ component: Comp, props: { name: 'kiwa' } });
              rendered.dispose();
            },
          },
          {
            // Client hydration proxy — mockSignal + mockEffect run the reactive
            // pipeline. Measures signal create + effect subscribe + update.
            name: 'mockSignalEffect',
            serialP95CapMs: 5,
            fn: () => {
              const [get, set] = mockSignal(0);
              let observed = -1;
              const handle = mockEffect(() => {
                observed = get();
              });
              set(1);
              // ensure result is actually consumed so v8 does not elide the read
              if (observed !== 1) throw new Error(`unexpected: ${observed}`);
              handle.dispose();
            },
          },
        ],
      });

      for (const outcome of result.outcomes) {
        expect.soft(outcome.serialGatePassed, `${outcome.name} serial p95`).toBe(true);
        expect.soft(outcome.concurrentGatePassed, `${outcome.name} concurrent p95`).toBe(true);
        expect.soft(outcome.memoryGatePassed, `${outcome.name} memory arrayBuffers`).toBe(true);
      }
      expect(result.allPassed).toBe(true);
    },
    120_000,
  );
});
