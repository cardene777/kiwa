/**
 * fidelity test — createChartClient (kiwa mock) が reference impl (単純 spec → tree 変換)
 * と同じ挙動を示すことを検証。 5 case で render / legend / tooltip / clear / provider 差異 cover。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { createChartClient, renderChart } from '../../src/index.js';

describe('chart client fidelity vs reference impl', () => {
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
});
