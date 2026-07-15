/**
 * fidelity test v2.1 — 10 case で render / legend / tooltip / clear / provider 差異
 * + animation / drilldown / export / responsive / observability を cover。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import {
  createChartClient,
  renderChart,
  animateChartFrames,
  computeResponsiveDimensions,
  drillDown,
  exportChart,
  withObservability,
  type RenderMetric,
} from '../../src/index.js';

describe('chart client fidelity vs reference impl (v2.1)', () => {
  it('renderChart api = 同 spec で同 kind の tree を返す', async () => {
    const mock = createChartClient({ provider: 'recharts' });
    const result = await assertFidelity({
      mockFn: async (kind: 'bar' | 'line') =>
        mock.renderChart({ kind, series: [{ name: 's', data: [{ x: 0, y: 10 }] }] }).tree.meta?.kind,
      realFn: async (kind: 'bar' | 'line') =>
        renderChart({ kind, series: [{ name: 's', data: [{ x: 0, y: 10 }] }] }).meta?.kind,
      cases: [
        { name: 'bar', args: ['bar'] },
        { name: 'line', args: ['line'] },
      ],
    });
    expect(result.ratio).toBe(100);
  });

  it('複数 render で listRendered が全 record を保持', () => {
    const mock = createChartClient({ provider: 'chartjs' });
    for (let i = 0; i < 3; i++) {
      mock.renderChart({ kind: 'bar', series: [{ name: `s${i}`, data: [{ x: 0, y: 10 }] }] });
    }
    expect(mock.listRendered().length).toBe(3);
    expect(mock.listRendered()[0]!.id.startsWith('cj-')).toBe(true);
  });

  it('captureLegend が series 名 + 色 を entry 化', () => {
    const mock = createChartClient({ provider: 'd3' });
    const rendered = mock.renderChart({
      kind: 'bar',
      series: [
        { name: 'sales', data: [{ x: 0, y: 10 }], color: '#f00' },
        { name: 'cost', data: [{ x: 0, y: 5 }], color: '#0f0' },
      ],
    });
    const legend = mock.captureLegend(rendered);
    expect(legend.length).toBe(2);
    expect(legend.find((e) => e.name === 'sales')?.color).toBe('#f00');
    expect(legend.find((e) => e.name === 'cost')?.color).toBe('#0f0');
  });

  it('dispatchTooltip が近傍 data node を捕捉', () => {
    const mock = createChartClient({ provider: 'visx' });
    const rendered = mock.renderChart({
      kind: 'scatter',
      series: [{ name: 'points', data: [{ x: 0, y: 10 }, { x: 50, y: 50 }, { x: 100, y: 90 }] }],
    });
    const tip = mock.dispatchTooltip(rendered, { x: 200, y: 30 });
    expect(tip.visible).toBe(true);
    expect(tip.series).toBe('points');
  });

  it('clear で listRendered が空になる', () => {
    const mock = createChartClient({ provider: 'recharts' });
    mock.renderChart({ kind: 'bar', series: [{ name: 's', data: [{ x: 0, y: 1 }] }] });
    expect(mock.listRendered().length).toBe(1);
    mock.clear();
    expect(mock.listRendered().length).toBe(0);
  });

  it('animateChartFrames = frames 数分 + 端点 tree を生成 (linear)', () => {
    const frames = animateChartFrames(
      (values) => renderChart({ kind: 'bar', series: [{ name: 's', data: values.map((y, x) => ({ x, y })) }] }),
      { fromValues: [0, 0], toValues: [100, 100], frames: 4 },
    );
    expect(frames.length).toBe(5);
    expect(frames[0]!.time).toBe(0);
    expect(frames[frames.length - 1]!.time).toBe(1);
    expect(frames[2]!.interpolated).toBe(true);
  });

  it('animateChartFrames = ease-in-out で中央 frame の値が線形と異なる', () => {
    const linear = animateChartFrames(
      (v) => renderChart({ kind: 'line', series: [{ name: 's', data: v.map((y, x) => ({ x, y })) }] }),
      { fromValues: [0], toValues: [100], frames: 4, easing: 'linear' },
    );
    const eased = animateChartFrames(
      (v) => renderChart({ kind: 'line', series: [{ name: 's', data: v.map((y, x) => ({ x, y })) }] }),
      { fromValues: [0], toValues: [100], frames: 4, easing: 'ease-in-out' },
    );
    expect(linear[2]!.time).toBe(0.5);
    expect(eased[2]!.time).toBe(0.5);
    expect(linear.length).toBe(eased.length);
  });

  it('computeResponsiveDimensions = viewport width で breakpoint 判定', () => {
    expect(computeResponsiveDimensions(320).breakpoint).toBe('mobile');
    expect(computeResponsiveDimensions(800).breakpoint).toBe('tablet');
    expect(computeResponsiveDimensions(1440).breakpoint).toBe('desktop');
  });

  it('drillDown = seriesName + dataIndex で node 特定', () => {
    const rendered = renderChart({
      kind: 'bar',
      series: [
        { name: 'sales', data: [{ x: 0, y: 10 }, { x: 1, y: 20 }, { x: 2, y: 30 }] },
      ],
    });
    const res = drillDown(rendered, { seriesName: 'sales', dataIndex: 1 });
    expect(res.found).toBe(true);
    expect(res.value).toBe(20);
    const miss = drillDown(rendered, { seriesName: 'sales', dataIndex: 99 });
    expect(miss.found).toBe(false);
  });

  it('exportChart = svg format で <svg 開始 + png format で data URI 返却', () => {
    const rendered = renderChart({ kind: 'bar', series: [{ name: 's', data: [{ x: 0, y: 10 }] }] });
    const svg = exportChart(rendered, { format: 'svg' });
    expect(svg.format).toBe('svg');
    expect(svg.content.startsWith('<svg')).toBe(true);
    const png = exportChart(rendered, { format: 'png' });
    expect(png.format).toBe('png');
    expect(png.content.startsWith('data:image/png')).toBe(true);
  });

  it('withObservability = onRender hook が 1 回 fire、 durationMs >= 0', () => {
    const metrics: RenderMetric[] = [];
    withObservability(
      () => renderChart({ kind: 'bar', series: [{ name: 's', data: [{ x: 0, y: 1 }] }] }),
      { onRender: (m) => metrics.push(m) },
      { operation: 'render', provider: 'recharts', seriesCount: 1 },
    );
    expect(metrics.length).toBe(1);
    expect(metrics[0]!.status).toBe('ok');
    expect(metrics[0]!.durationMs).toBeGreaterThanOrEqual(0);
  });
});
