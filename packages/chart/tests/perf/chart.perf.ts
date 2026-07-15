import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import {
  createChartClient,
  computeAxis,
  captureLegend,
  dispatchTooltip,
} from '../../src/index.js';

const MODULE = 'chart';
const REPO_ROOT = resolveKiwaRepoRoot(process.cwd());
const REPORT_PATH = path.join(REPO_ROOT, 'docs/quality-reports/perf', `${MODULE}.md`);
const BASELINE_PATH = path.join(REPO_ROOT, '.perf-baseline', `${MODULE}.json`);

describe(MODULE, () => {
  it(
    '3-layer perf: render + axis + legend + tooltip primary paths',
    async () => {
      const client = createChartClient({ provider: 'recharts' });
      const spec = {
        kind: 'bar' as const,
        series: [{ name: 's1', data: [{ x: 0, y: 30 }, { x: 1, y: 50 }, { x: 2, y: 80 }] }],
      };
      const rendered = client.renderChart(spec);

      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        baselinePath: BASELINE_PATH,
        ops: [
          {
            name: 'renderChart',
            serialP95CapMs: 5,
            fn: async () => {
              client.renderChart(spec);
            },
          },
          {
            name: 'computeAxis',
            serialP95CapMs: 5,
            fn: async () => {
              computeAxis([10, 20, 30, 40, 50]);
            },
          },
          {
            name: 'captureLegend',
            serialP95CapMs: 5,
            fn: async () => {
              captureLegend(rendered.tree);
            },
          },
          {
            name: 'dispatchTooltip',
            serialP95CapMs: 5,
            fn: async () => {
              dispatchTooltip(rendered.tree, { x: 10, y: 10 });
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
    'timing baseline: performance.now() 100 回連続で serial p95 < 1ms',
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
    'allocation baseline: 小 object 100 回生成の max latency < 5ms',
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
