# @kiwa-lab/chart

Chart data + render mock harness for kiwa — Recharts / Chart.js / D3 / Visx を統一 interface で in-process から叩ける test infra。

## Installation

```bash
pnpm add -D @kiwa-lab/chart
# or
npm install -D @kiwa-lab/chart
# or
yarn add -D @kiwa-lab/chart
```

## Supported providers

| Provider | Status | Render model |
|---|---|---|
| Recharts | ✅ Ready | React component tree |
| Chart.js | ✅ Ready | canvas descriptor |
| D3 | ✅ Ready | svg selection |
| Visx | ✅ Ready | React + d3-scale |

## Quick start

```ts
import { describe, expect, it } from 'vitest';
import {
  createChartClient,
  renderChart,
  computeAxis,
  captureLegend,
} from '@kiwa-lab/chart';

describe('bar chart', () => {
  it('data から svg-like tree + axis tick を生成', () => {
    const client = createChartClient({ provider: 'recharts' });
    const spec = {
      kind: 'bar' as const,
      series: [{ name: 's1', data: [{ x: 1, y: 10 }, { x: 2, y: 20 }] }],
    };
    const chart = renderChart(client, spec);
    const axis = computeAxis({ min: 0, max: 20, ticks: 5 });
    const legend = captureLegend(chart);
    expect(chart.nodes.length).toBeGreaterThan(0);
    expect(axis.tickValues).toHaveLength(5);
    expect(legend[0]!.name).toBe('s1');
  });
});
```

## API reference

- `createChartClient({ provider: ChartProvider }): ChartClient` — provider 別 client
- `renderChart(client, spec: ChartSpec): RenderedChart` — bar/line/pie/scatter を tree 化
- `computeAxis(options: AxisOptions): AxisResult` — tick + domain + scale
- `captureLegend(chart: RenderedChart): LegendEntry[]` — legend entry 抽出
- `dispatchTooltip(chart, event: TooltipEvent): TooltipContent` — interaction 経路

## Test integration

vitest + `/kiwa-chart` skill で real canvas / svg render なしで data-to-visual pipeline を高速 verify。

<!-- kiwa-docs:start -->
## Documentation

公開ドキュメントを正本として管理しています。

- [概要](https://cardene777.github.io/kiwa/libraries/application/chart/)
- [はじめる](https://cardene777.github.io/kiwa/libraries/application/chart/quickstart)
- [使い方](https://cardene777.github.io/kiwa/libraries/application/chart/how-to)
- [リファレンス](https://cardene777.github.io/kiwa/libraries/application/chart/reference)

編集元は [docs/libraries/application/chart](../../docs/libraries/application/chart/) です。
<!-- kiwa-docs:end -->

## License

UNLICENSED — see [github.com/cardene777/kiwa](https://github.com/cardene777/kiwa).
