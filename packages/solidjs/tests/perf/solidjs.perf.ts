import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { baselinePathFor, resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import { renderSolid, h } from '../../src/render.js';
import { mockSignal, mockEffect } from '../../src/signal.js';

const MODULE = 'solidjs';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf/framework', `${MODULE}.md`);
const BASELINE_PATH = baselinePathFor(REPO_ROOT, MODULE, 'framework');

describe(MODULE, () => {
  it(
    '3-layer perf: SSR (renderSolid) + hydration (signal + effect) primary paths',
    async () => {
      // SSR path: renderSolid mounts static component, exposes tree + html.
      // Measures h + tree walk + stringify + effect registration.
      const Comp = ({ name }: { name: string }) => h('span', null, `hello ${name}`);

      const result = await runPerf3Layer({
        moduleName: MODULE,
        requireGc: true,
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

  it(
    'timing baseline: performance.now() 100 回連続で serial p95 < 1ms (perf harness 環境 sanity)',
    () => {
      const N = 100;
      const samples: number[] = [];
      for (let i = 0; i < N; i += 1) {
        const s = performance.now();
        void performance.now();
        samples.push(performance.now() - s);
      }
      samples.sort((a, b) => a - b);
      const p95 = samples[Math.floor(samples.length * 0.95)] ?? 0;
      expect(p95).toBeLessThan(1);
    },
    30_000,
  );

  it(
    'allocation baseline: 小 object 100 回生成の max latency < 5ms (V8 alloc floor)',
    () => {
      const N = 100;
      let maxLatency = 0;
      for (let i = 0; i < N; i += 1) {
        const start = performance.now();
        const obj = { id: i, val: `v${i}`, ts: Date.now() };
        if (obj.id < 0) throw new Error('unreachable');
        const elapsed = performance.now() - start;
        if (elapsed > maxLatency) maxLatency = elapsed;
      }
      expect(maxLatency).toBeLessThan(5);
    },
    30_000,
  );
});
