# @kiwa-lab/chart API reference

## Overview

`@kiwa-lab/chart` は Recharts / Chart.js / D3 / Visx 4 lib を統一 interface で mock する chart data + render test infra。 data → axis / legend / tooltip の各 stage を real DOM 不要で叩ける。

## Supported providers

| provider | chart kinds | interaction | responsive |
|---|---|---|---|
| recharts | bar/line/pie/scatter/area/radar | tooltip / brush | ResponsiveContainer |
| chartjs | bar/line/pie/scatter/bubble | tooltip / hover | responsive prop |
| d3 | (fully custom) | full custom | manual resize |
| visx | full primitives | full custom | scale-based |

## Main API

### `createChartClient(options): ChartClient`

provider 別 mock client、 default theme + tooltip formatter を config。

### `renderChart(client, spec: ChartSpec): RenderedChart`

`{ kind, series, xAxis?, yAxis?, legend? }` を受け取り、 svg-like tree (`ChartNode`) + `bbox` を返す。 実 DOM 生成せずに data → visual mapping を verify。

### `computeAxis(series, options: AxisOptions): AxisResult`

tick / domain / scale を計算、 `{ ticks, domain, scale }`。 axis の tick 数 / 範囲を単独 verify する主経路。

### `captureLegend(rendered: RenderedChart): LegendEntry[]`

rendered chart から legend を抽出、 `[{ label, color, series }]`。

### `dispatchTooltip(rendered, event: TooltipEvent): TooltipContent`

hover / click event を dispatch、 tooltip content を capture、 `{ x, y, series, values }`。

## Types

- `ChartProvider = 'recharts' | 'chartjs' | 'd3' | 'visx'`
- `ChartKind = 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'radar' | 'bubble'`
- `ChartSeries` = `{ name, data: ChartDataPoint[], color? }`
- `ChartDataPoint` = `{ x: number | string | Date, y: number, [key: string]: unknown }`
- `LegendEntry` = `{ label, color, series }`

## Usage examples

### Bar chart data → axis compute

```typescript
import { createChartClient, renderChart, computeAxis } from '@kiwa-lab/chart';
import { describe, expect, it } from 'vitest';

describe('sales bar chart', () => {
  it('7 day sales で x tick 7 個 + y max = 1200', () => {
    const client = createChartClient({ provider: 'recharts' });
    const series = [
      {
        name: 'sales',
        data: [
          { x: 'Mon', y: 800 }, { x: 'Tue', y: 950 }, { x: 'Wed', y: 1100 },
          { x: 'Thu', y: 700 }, { x: 'Fri', y: 1200 }, { x: 'Sat', y: 400 }, { x: 'Sun', y: 550 },
        ],
      },
    ];
    const chart = renderChart(client, { kind: 'bar', series });
    const yAxis = computeAxis(series, { orient: 'y' });
    expect(yAxis.ticks).toHaveLength(7);
    expect(yAxis.domain[1]).toBe(1200);
    expect(chart.bbox).toBeDefined();
  });
});
```

### Tooltip dispatch

```typescript
import { createChartClient, renderChart, dispatchTooltip } from '@kiwa-lab/chart';

const client = createChartClient({ provider: 'chartjs' });
const rendered = renderChart(client, {
  kind: 'line',
  series: [{ name: 'revenue', data: [{ x: '2026-01', y: 100 }, { x: '2026-02', y: 150 }] }],
});
const tip = dispatchTooltip(rendered, { x: 50, y: 30, type: 'hover' });
expect(tip.values[0].y).toBeDefined();
```

## Related skills

- [`/kiwa-chart`](../skills/kiwa-chart) — chart test 生成 skill
