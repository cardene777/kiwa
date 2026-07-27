import { expect, it } from 'vitest';
import {
  computeResponsiveDimensions,
  createChartClient,
  drillDown,
  exportChart,
  renderChart,
} from '../src/index.js';

it('documents recorded revenue and an explicit empty result', () => {
  const client = createChartClient({ provider: 'recharts', now: () => 1_000 });
  const revenue = client.renderChart({
    kind: 'bar', title: '売上', width: 200, height: 100,
    series: [{ name: 'sales', color: '#2563eb', data: [{ x: 'Jan', y: 10 }, { x: 'Feb', y: 20 }] }],
  });
  const empty = client.renderChart({ kind: 'bar', series: [] });
  expect(revenue).toMatchObject({ id: 'rc-1', renderedAt: 1_000, tree: { meta: { seriesCount: 1 } } });
  expect(revenue.tree.children).toHaveLength(2);
  expect(empty.tree.meta?.seriesCount).toBe(0);
  expect(client.captureLegend(empty)).toEqual([]);
});

it('documents series selection, interactions, responsive dimensions, and export', () => {
  const client = createChartClient({ provider: 'd3' });
  const interactive = client.renderChart({
    kind: 'scatter', width: 100, height: 100,
    series: [
      { name: 'orders', data: [{ x: 10, y: 25 }] },
      { name: 'internal', data: [{ x: 10, y: 80 }], hidden: true },
    ],
  });
  expect(client.captureLegend(interactive).map(entry => entry.name)).toEqual(['orders']);
  expect(client.dispatchTooltip(interactive, { x: 10, y: 75 })).toMatchObject({ series: 'orders', value: 25 });
  expect(drillDown(interactive.tree, { seriesName: 'orders', dataIndex: 0 })).toMatchObject({ found: true, value: 25 });

  const size = computeResponsiveDimensions(320);
  const exported = exportChart(renderChart({
    kind: 'bar', width: size.width, height: size.height,
    series: [{ name: 'orders', data: [{ x: 0, y: 10 }] }],
  }));
  expect(size).toMatchObject({ width: 320, breakpoint: 'mobile' });
  expect(exported).toMatchObject({ format: 'svg' });
  expect(exported.content).toContain('<svg');
});
