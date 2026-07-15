/**
 * integration test v2.1 — 10 case = 統合 workflow (render → legend → tooltip → drill
 * → export) + animation + responsive + observability の end-to-end。
 */
import { describe, expect, it } from 'vitest';
import {
  createChartClient,
  computeAxis,
  animateChartFrames,
  computeResponsiveDimensions,
  drillDown,
  exportChart,
  withObservability,
  renderChart,
  type RenderMetric,
} from '../../src/index.js';

describe('chart integration — dashboard workflow', () => {
  it('T-INT-C-001 render → legend → tooltip の 3 step が同 rendered instance で動く', () => {
    const client = createChartClient({ provider: 'recharts' });
    const rendered = client.renderChart({
      kind: 'bar',
      series: [{ name: 's', data: [{ x: 0, y: 50 }, { x: 1, y: 80 }] }],
    });
    expect(client.captureLegend(rendered).length).toBe(1);
    expect(client.dispatchTooltip(rendered, { x: 20, y: 20 }).series).toBe('s');
  });

  it('T-INT-C-002 provider 4 種で id prefix が異なる', () => {
    const prefixes: Record<string, string> = { recharts: 'rc', chartjs: 'cj', d3: 'd3', visx: 'vx' };
    for (const [provider, prefix] of Object.entries(prefixes)) {
      const c = createChartClient({ provider: provider as 'recharts' });
      const r = c.renderChart({ kind: 'bar', series: [{ name: 's', data: [{ x: 0, y: 1 }] }] });
      expect(r.id.startsWith(prefix)).toBe(true);
    }
  });

  it('T-INT-C-003 computeAxis + render 統合 = tick 数を chart 描画に反映', () => {
    const values = [10, 20, 45, 80, 100];
    const axis = computeAxis(values, { tickCount: 5, nice: true });
    expect(axis.ticks.length).toBe(5);
    const client = createChartClient({ provider: 'd3' });
    const rendered = client.renderChart({ kind: 'line', series: [{ name: 's', data: values.map((y, x) => ({ x, y })) }] });
    expect(rendered.tree.meta?.seriesCount).toBe(1);
  });

  it('T-INT-C-004 hidden series は tree に含まれない', () => {
    const client = createChartClient({ provider: 'chartjs' });
    const rendered = client.renderChart({
      kind: 'bar',
      series: [
        { name: 'a', data: [{ x: 0, y: 10 }] },
        { name: 'b', data: [{ x: 0, y: 20 }], hidden: true },
      ],
    });
    expect(rendered.tree.meta?.seriesCount).toBe(1);
  });

  it('T-INT-C-005 clear 後の renderChart で counter が独立継続', () => {
    const client = createChartClient({ provider: 'visx' });
    client.renderChart({ kind: 'bar', series: [{ name: 's', data: [{ x: 0, y: 1 }] }] });
    client.renderChart({ kind: 'bar', series: [{ name: 's', data: [{ x: 0, y: 1 }] }] });
    client.clear();
    const r = client.renderChart({ kind: 'bar', series: [{ name: 's', data: [{ x: 0, y: 1 }] }] });
    expect(r.id).toBe('vx-3');
  });

  it('T-INT-C-006 animation → drill workflow = 最終 frame から drill 可能', () => {
    const frames = animateChartFrames(
      (values) => renderChart({ kind: 'bar', series: [{ name: 'growth', data: values.map((y, x) => ({ x, y })) }] }),
      { fromValues: [0, 0, 0], toValues: [10, 30, 60], frames: 3 },
    );
    const finalTree = frames[frames.length - 1]!.tree;
    const drill = drillDown(finalTree, { seriesName: 'growth', dataIndex: 2 });
    expect(drill.found).toBe(true);
    expect(drill.value).toBe(60);
  });

  it('T-INT-C-007 responsive → render workflow = breakpoint 別 dimensions で size 反映', () => {
    const mobile = computeResponsiveDimensions(320);
    const desktop = computeResponsiveDimensions(1440);
    const rMobile = renderChart({ kind: 'bar', width: mobile.width, height: mobile.height, series: [{ name: 's', data: [{ x: 0, y: 10 }] }] });
    const rDesktop = renderChart({ kind: 'bar', width: desktop.width, height: desktop.height, series: [{ name: 's', data: [{ x: 0, y: 10 }] }] });
    expect(rMobile.attrs.width).toBe(mobile.width);
    expect(rDesktop.attrs.width).toBe(desktop.width);
  });

  it('T-INT-C-008 export SVG → PNG 両 format で export 可能', () => {
    const rendered = renderChart({ kind: 'pie', series: [{ name: 's', data: [{ x: 0, y: 10 }, { x: 1, y: 20 }] }] });
    const svg = exportChart(rendered, { format: 'svg' });
    const png = exportChart(rendered, { format: 'png' });
    expect(svg.bytes).toBeGreaterThan(0);
    expect(png.bytes).toBeGreaterThan(0);
  });

  it('T-INT-C-009 observability wrap で 5 render の metric が集約', () => {
    const metrics: RenderMetric[] = [];
    const client = createChartClient({ provider: 'recharts' });
    for (let i = 0; i < 5; i++) {
      withObservability(
        () => client.renderChart({ kind: 'bar', series: [{ name: `s${i}`, data: [{ x: 0, y: i * 10 }] }] }),
        { onRender: (m) => metrics.push(m) },
        { operation: 'render', provider: 'recharts', seriesCount: 1 },
      );
    }
    expect(metrics.length).toBe(5);
    expect(metrics.every((m) => m.status === 'ok')).toBe(true);
  });

  it('T-INT-C-010 observability onError = throw 時に error hook が fire', () => {
    let capturedError: Error | null = null;
    expect(() =>
      withObservability(
        () => { throw new Error('boom'); },
        { onError: (e) => { capturedError = e; } },
        { operation: 'render', provider: 'chartjs', seriesCount: 0 },
      ),
    ).toThrow('boom');
    expect(capturedError).not.toBeNull();
  });
});
