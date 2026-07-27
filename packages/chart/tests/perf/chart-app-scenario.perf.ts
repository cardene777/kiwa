/// <reference types="vitest/globals" />
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createChartClient,
  computeAxis,
  animateChartFrames,
  drillDown,
  exportChart,
  renderChart,
  type ChartKind,
} from '../../src/index.js';

const MODULE = 'chart-app-scenario';
const REPORT_PATH = path.join(resolveKiwaRepoRoot(process.cwd()), 'docs/quality-reports/perf', `${MODULE}.md`);

describe('chart app scenario perf v2.1 (real workload)', () => {
  it('5-op perf: dashboard / axis / animation / drill / export', async () => {
    const kinds: ChartKind[] = ['bar', 'line', 'pie', 'scatter'];

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
          name: 'animation_frame_burst (5 series x 10 frames)',
          fn: async () => {
            for (let s = 0; s < 5; s++) {
              const frames = animateChartFrames(
                (values) => renderChart({ kind: 'line', series: [{ name: `s${s}`, data: values.map((y, x) => ({ x, y })) }] }),
                { fromValues: [0, 20, 40], toValues: [80, 60, 40], frames: 10, easing: 'ease-in-out' },
              );
              if (frames.length !== 11) throw new Error('unexpected frame count');
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'drilldown_batch (5 hit + 5 miss)',
          fn: async () => {
            const rendered = renderChart({
              kind: 'bar',
              series: [{ name: 'items', data: Array.from({ length: 20 }, (_, k) => ({ x: k, y: k * 3 })) }],
            });
            for (let i = 0; i < 5; i++) {
              const hit = drillDown(rendered, { seriesName: 'items', dataIndex: i });
              const miss = drillDown(rendered, { seriesName: 'ghost', dataIndex: i });
              if (!hit.found || miss.found) throw new Error('drilldown result mismatch');
            }
          },
          serialP95CapMs: 100,
        },
        {
          name: 'export_batch (3 SVG + 3 PNG)',
          fn: async () => {
            const rendered = renderChart({ kind: 'pie', series: [{ name: 's', data: [{ x: 0, y: 10 }, { x: 1, y: 20 }, { x: 2, y: 30 }] }] });
            for (let i = 0; i < 3; i++) {
              const svg = exportChart(rendered, { format: 'svg', scale: 1 + i * 0.5 });
              const png = exportChart(rendered, { format: 'png', scale: 1 + i * 0.5 });
              if (svg.bytes === 0 || png.bytes === 0) throw new Error('export empty');
            }
          },
          serialP95CapMs: 100,
        },
      ],
    });
    expect(result).toBeDefined();
  });
});
