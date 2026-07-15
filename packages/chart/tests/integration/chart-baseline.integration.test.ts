/**
 * integration test — chart domain の end-to-end workflow (render → axis → legend → tooltip)
 * を 5 case で cover。
 */
import { describe, expect, it } from 'vitest';
import {
  createChartClient,
  computeAxis,
} from '../../src/index.js';

describe('chart integration — render → axis → legend → tooltip workflow', () => {
  it('T-INT-C-001 bar chart render → legend で 2 series 検出', () => {
    const client = createChartClient({ provider: 'recharts' });
    const rendered = client.renderChart({
      kind: 'bar',
      series: [
        { name: 'sales', data: [{ x: 0, y: 30 }, { x: 1, y: 50 }] },
        { name: 'cost', data: [{ x: 0, y: 10 }, { x: 1, y: 20 }] },
      ],
    });
    const legend = client.captureLegend(rendered);
    expect(legend.length).toBe(2);
    expect(legend.map((e) => e.name)).toEqual(expect.arrayContaining(['sales', 'cost']));
  });

  it('T-INT-C-002 line chart render → axis 計算 → domain が data の min/max を含む', () => {
    const values = [10, 25, 40, 55, 70];
    const client = createChartClient({ provider: 'chartjs' });
    const rendered = client.renderChart({
      kind: 'line',
      series: [{ name: 'trend', data: values.map((y, x) => ({ x, y })) }],
    });
    const axis = computeAxis(values, { tickCount: 4 });
    expect(rendered.tree.meta?.kind).toBe('line');
    expect(axis.domain[0]).toBeLessThanOrEqual(10);
    expect(axis.domain[1]).toBeGreaterThanOrEqual(70);
  });

  it('T-INT-C-003 pie chart render → 各 slice に ratio が計算される', () => {
    const client = createChartClient({ provider: 'd3' });
    const rendered = client.renderChart({
      kind: 'pie',
      series: [{ name: 'share', data: [{ x: 'a', y: 30 }, { x: 'b', y: 30 }, { x: 'c', y: 40 }] }],
    });
    const totalRatio = rendered.tree.children
      .map((c) => (typeof c.meta?.ratio === 'number' ? c.meta.ratio : 0))
      .reduce((a, b) => a + b, 0);
    expect(totalRatio).toBeCloseTo(1, 5);
  });

  it('T-INT-C-004 scatter tooltip hover で最寄り point を返す', () => {
    const client = createChartClient({ provider: 'visx' });
    const rendered = client.renderChart({
      kind: 'scatter',
      series: [{ name: 'points', data: [{ x: 10, y: 20 }, { x: 90, y: 80 }] }],
    });
    const tip = client.dispatchTooltip(rendered, { x: 40, y: 240 });
    expect(tip.visible).toBe(true);
    expect(tip.series).toBe('points');
  });

  it('T-INT-C-005 provider 別で id prefix が異なる', () => {
    const rc = createChartClient({ provider: 'recharts' });
    const vx = createChartClient({ provider: 'visx' });
    const r = rc.renderChart({ kind: 'bar', series: [{ name: 's', data: [{ x: 0, y: 1 }] }] });
    const v = vx.renderChart({ kind: 'bar', series: [{ name: 's', data: [{ x: 0, y: 1 }] }] });
    expect(r.id.startsWith('rc-')).toBe(true);
    expect(v.id.startsWith('vx-')).toBe(true);
  });
});
