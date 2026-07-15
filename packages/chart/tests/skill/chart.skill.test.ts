/**
 * skill test — chart skill が主要 5 API (createChartClient / renderChart / computeAxis /
 * captureLegend / dispatchTooltip) を全て公開している + 4 provider 差分で動作分岐する
 * ことを skill-test primitive 経由で assertion する。
 */
import { describe, expect, it } from 'vitest';
import {
  createChartClient,
  renderChart,
  computeAxis,
  captureLegend,
  dispatchTooltip,
} from '../../src/index.js';

describe('chart skill assertions', () => {
  it('createChartClient を 4 provider (recharts/chartjs/d3/visx) 全てで instantiate 可能', () => {
    for (const provider of ['recharts', 'chartjs', 'd3', 'visx'] as const) {
      const client = createChartClient({ provider });
      expect(client.provider).toBe(provider);
    }
  });

  it('renderChart が kind 4 種 (bar/line/pie/scatter) で tree を返す', () => {
    for (const kind of ['bar', 'line', 'pie', 'scatter'] as const) {
      const tree = renderChart({
        kind,
        series: [{ name: 's', data: [{ x: 0, y: 10 }, { x: 1, y: 20 }] }],
      });
      expect(tree.type).toBe('svg');
      expect(tree.meta?.kind).toBe(kind);
      expect(tree.children.length).toBeGreaterThan(0);
    }
  });

  it('computeAxis が tick + domain + tickFormat を返す', () => {
    const axis = computeAxis([1, 5, 10, 50, 100], { tickCount: 5, nice: true });
    expect(axis.ticks.length).toBe(5);
    expect(axis.domain[0]).toBeLessThanOrEqual(1);
    expect(axis.domain[1]).toBeGreaterThanOrEqual(100);
    expect(typeof axis.tickFormat(1)).toBe('string');
  });

  it('captureLegend が hidden series を色情報付きで無視', () => {
    const tree = renderChart({
      kind: 'bar',
      series: [
        { name: 'visible', data: [{ x: 0, y: 10 }], color: '#f00' },
        { name: 'hidden', data: [{ x: 0, y: 20 }], color: '#0f0', hidden: true },
      ],
    });
    const legend = captureLegend(tree);
    const names = legend.map((e) => e.name);
    expect(names).toContain('visible');
    expect(names).not.toContain('hidden');
  });

  it('dispatchTooltip が空 tree で visible=false を返す', () => {
    const empty = renderChart({ kind: 'scatter', series: [] });
    const tip = dispatchTooltip(empty, { x: 0, y: 0 });
    expect(tip.visible).toBe(false);
  });
});
