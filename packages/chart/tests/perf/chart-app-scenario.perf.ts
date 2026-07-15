/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createChartClient,
  computeAxis,
  type ChartKind,
} from '../../src/index.js';

const MODULE = 'chart-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('chart app scenario perf (real workload)', () => {
  it('3-layer perf: dashboard_render_workflow / axis_recompute_batch / tooltip_hover_error', async () => {
    const kinds: ChartKind[] = ['bar', 'line', 'pie', 'scatter'];

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
          name: 'dashboard_render_workflow (10 chart across 4 kinds x 4 providers)',
          fn: async () => {
            const providers = ['recharts', 'chartjs', 'd3', 'visx'] as const;
            for (let i = 0; i < 10; i++) {
              const client = createChartClient({ provider: providers[i % 4] });
              client.renderChart({
                kind: kinds[i % 4]!,
                series: [
                  { name: `s${i}a`, data: Array.from({ length: 12 }, (_, k) => ({ x: k, y: 20 + (k * 7 + i) % 80 })) },
                  { name: `s${i}b`, data: Array.from({ length: 12 }, (_, k) => ({ x: k, y: 30 + (k * 5 + i) % 70 })) },
                ],
              });
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'axis_recompute_batch (5 dataset で computeAxis)',
          fn: async () => {
            const client = createChartClient({ provider: 'd3' });
            for (let i = 0; i < 5; i++) {
              const values = Array.from({ length: 20 }, (_, k) => 10 + (k * 7 + i) % 90);
              const axis = computeAxis(values, { tickCount: 5, nice: true });
              client.renderChart({
                kind: 'line',
                series: [{ name: `axis-${i}`, data: values.map((y, x) => ({ x, y })) }],
              });
              if (axis.ticks.length !== 5) throw new Error('unexpected tick count');
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'tooltip_hover_error_handling (5 out-of-bounds hover)',
          fn: async () => {
            const client = createChartClient({ provider: 'visx' });
            const rendered = client.renderChart({
              kind: 'scatter',
              series: [{ name: 'noise', data: [{ x: 0, y: 0 }] }],
            });
            for (let i = 0; i < 5; i++) {
              try {
                const bad = { x: NaN, y: NaN };
                const tip = client.dispatchTooltip(rendered, bad as unknown as { x: number; y: number });
                if (tip.visible !== true && tip.visible !== false) throw new Error('unexpected visible flag');
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
