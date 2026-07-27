# @kiwa-lab/chart リファレンス

## spec と描画 tree

`ChartSpec` は `kind` と `series` を必須とし、任意で `width`、`height`、`title` を受け取ります。kind は `bar`、`line`、`pie`、`scatter` です。width と height の既定値は四百と三百です。

`renderChart(spec)` は root `svg` node を返します。node は type、attrs、children、任意の meta を持ちます。hidden series は除外され、root meta の `seriesCount` は表示する series 数です。

## client

`createChartClient(options)` は provider、時刻、id seed を受け取ります。provider の既定値は `recharts` です。client の `renderChart` は `RenderedChart` を記録し、`listRendered` はコピー、`clear` は履歴を消去します。

`captureLegend` と `dispatchTooltip` は `RenderedChart` を受け取る client method と、tree を直接受け取る top-level API の両方があります。

## axis と interaction

`computeAxis(values, options)` は domain、ticks、scale、`tickFormat` を返します。values が空なら domain と ticks は `[0, 1]` です。nice domain はデータの範囲を tick count に基づいて丸めます。

`dispatchTooltip` は最寄りの座標を持つ node を返し、該当しなければ `{ visible: false }` を返します。`drillDown` は series 名とゼロ始まり index から node を探し、見つからなければ `found: false` と value null を返します。

## 拡張 API

`animateChartFrames` は値を補間した tree の frame 列を作ります。`computeResponsiveDimensions` は mobile、tablet、desktop の breakpoint を返します。`exportChart` は SVG string または PNG mock data URL を返します。

`withObservability` は render 処理を観測 hook で包み、`RenderMetric` を扱う helper です。

<!-- kiwa-public-api:start -->
## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/index.ts) から同期しています。各項目は公開名、実際の TypeScript 宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `animateChartFrames`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/animation.ts#L20) `packages/chart/src/animation.ts`

animation frame 列を生成、 fromValues → toValues を frames 数で補間。 real Recharts / Chart.js の animation stream を mock。

```ts
export function animateChartFrames(build: (values: number[]) => ChartNode, opts: AnimateChartOptions): AnimationFrame[];
```

#### `captureLegend`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/legend.ts#L14) `packages/chart/src/legend.ts`

rendered chart tree を走査して series 名 + 色 + 表示状態を legend entry 化。 real chart library の Legend component が render する data table 相当。

```ts
export function captureLegend(rendered: ChartNode): LegendEntry[];
```

#### `computeAxis`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/axis.ts#L18) `packages/chart/src/axis.ts`

numeric data から axis の domain + tick + scale を計算。 real chart library の d3-scale 相当を mock、 nice=true で見栄えの良い round 値に丸める。

```ts
export function computeAxis(values: number[], options: AxisOptions = {}): AxisResult;
```

#### `computeResponsiveDimensions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/animation.ts#L50) `packages/chart/src/animation.ts`

viewport width から chart dimensions + breakpoint を導出。 responsive chart の mock、 container width に応じて aspect ratio 調整。

```ts
export function computeResponsiveDimensions(containerWidth: number, aspectRatio: number = 4 / 3): ResponsiveDimensions;
```

#### `createChartClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/client.ts#L34) `packages/chart/src/client.ts`

provider 別のみ id prefix + 属性 default を持たせる。 全 API 共通 interface で Recharts / Chart.js / D3 / Visx を差し替え可能。

```ts
export function createChartClient(options: CreateChartClientOptions = {}): ChartClient;
```

#### `dispatchTooltip`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/tooltip.ts#L19) `packages/chart/src/tooltip.ts`

event 座標に最も近い data node (rect / circle / path) を探して tooltip 内容を決定。 real chart library の hover handler + tooltip content builder 相当。

```ts
export function dispatchTooltip(rendered: ChartNode, event: TooltipEvent): TooltipContent;
```

#### `drillDown`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/drilldown.ts#L20) `packages/chart/src/drilldown.ts`

chart tree を掘り下げて特定 series + data index の detail node を取得。 real chart lib の onClick → drill-down navigation を mock。

```ts
export function drillDown(tree: ChartNode, request: DrillDownRequest): DrillDownResult;
```

#### `exportChart`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/drilldown.ts#L44) `packages/chart/src/drilldown.ts`

chart tree を SVG string or PNG mock bytes に変換。 real Chart.js の canvas.toDataURL / Recharts の SVG export を mock。

```ts
export function exportChart(tree: ChartNode, options: ExportOptions = {}): { format: 'svg' | 'png'; content: string; bytes: number };
```

#### `renderChart`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/render.ts#L39) `packages/chart/src/render.ts`

spec を svg-like tree に変換。 real chart library (Recharts / Chart.js / D3 / Visx) の rendered DOM 相当を mock 生成、 kind 別に shape / rect / path / circle を配置。

```ts
export function renderChart(spec: ChartSpec): ChartNode;
```

#### `withObservability`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/observability.ts#L19) `packages/chart/src/observability.ts`

render 動作を metric として emit、 downstream (Datadog / OTel / console) に渡す hook 経路。 real chart lib の performance measurement 相当。

```ts
export function withObservability<T>(fn: () => T, hook: ObservabilityHook, context: { operation: string; provider: string; seriesCount: number; now?: () => number }): T;
```

### 型

#### `AnimateChartOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/animation.ts#L9) `packages/chart/src/animation.ts`

```ts
export interface AnimateChartOptions {
  fromValues: number[];
  toValues: number[];
  frames?: number;
  easing?: 'linear' | 'ease-in-out';
}
```

#### `AnimationFrame`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/animation.ts#L3) `packages/chart/src/animation.ts`

```ts
export interface AnimationFrame {
  time: number;
  tree: ChartNode;
  interpolated: boolean;
}
```

#### `AxisOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/axis.ts#L1) `packages/chart/src/axis.ts`

```ts
export interface AxisOptions {
  tickCount?: number;
  nice?: boolean;
  scale?: 'linear' | 'log';
}
```

#### `AxisResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/axis.ts#L7) `packages/chart/src/axis.ts`

```ts
export interface AxisResult {
  domain: [number, number];
  ticks: number[];
  scale: 'linear' | 'log';
  tickFormat: (value: number) => string;
}
```

#### `ChartClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/client.ts#L15) `packages/chart/src/client.ts`

```ts
export interface ChartClient {
  provider: ChartProvider;
  renderChart: (spec: ChartSpec) => RenderedChart;
  captureLegend: (rendered: RenderedChart) => LegendEntry[];
  dispatchTooltip: (rendered: RenderedChart, event: TooltipEvent) => TooltipContent;
  listRendered: () => RenderedChart[];
  clear: () => void;
}
```

#### `ChartDataPoint`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/render.ts#L3) `packages/chart/src/render.ts`

```ts
export interface ChartDataPoint {
  x: number | string;
  y: number;
  label?: string;
}
```

#### `ChartKind`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/render.ts#L1) `packages/chart/src/render.ts`

```ts
export type ChartKind = 'bar' | 'line' | 'pie' | 'scatter';
```

#### `ChartNode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/render.ts#L28) `packages/chart/src/render.ts`

svg-like tree node — real chart library の rendered element を mock 表現。 type = svg element 名 / attrs = attribute map / children = ネスト tree。

```ts
export interface ChartNode {
  type: string;
  attrs: Record<string, string | number>;
  children: ChartNode[];
  meta?: Record<string, unknown>;
}
```

#### `ChartProvider`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/client.ts#L5) `packages/chart/src/client.ts`

```ts
export type ChartProvider = 'recharts' | 'chartjs' | 'd3' | 'visx';
```

#### `ChartSeries`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/render.ts#L9) `packages/chart/src/render.ts`

```ts
export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
  hidden?: boolean;
}
```

#### `ChartSpec`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/render.ts#L16) `packages/chart/src/render.ts`

```ts
export interface ChartSpec {
  kind: ChartKind;
  series: ChartSeries[];
  width?: number;
  height?: number;
  title?: string;
}
```

#### `DrillDownRequest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/drilldown.ts#L3) `packages/chart/src/drilldown.ts`

```ts
export interface DrillDownRequest {
  seriesName: string;
  dataIndex: number;
}
```

#### `DrillDownResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/drilldown.ts#L8) `packages/chart/src/drilldown.ts`

```ts
export interface DrillDownResult {
  seriesName: string;
  dataIndex: number;
  value: number | null;
  detailNodes: ChartNode[];
  found: boolean;
}
```

#### `ExportOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/drilldown.ts#L35) `packages/chart/src/drilldown.ts`

```ts
export interface ExportOptions {
  format?: 'svg' | 'png';
  scale?: number;
}
```

#### `LegendEntry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/legend.ts#L3) `packages/chart/src/legend.ts`

```ts
export interface LegendEntry {
  name: string;
  color: string;
  dataKey?: string;
  hidden: boolean;
}
```

#### `ObservabilityHook`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/observability.ts#L10) `packages/chart/src/observability.ts`

```ts
export interface ObservabilityHook {
  onRender?: (metric: RenderMetric) => void;
  onError?: (error: Error, context: Record<string, unknown>) => void;
}
```

#### `RenderedChart`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/client.ts#L7) `packages/chart/src/client.ts`

```ts
export interface RenderedChart {
  provider: ChartProvider;
  id: string;
  spec: ChartSpec;
  tree: ChartNode;
  renderedAt: number;
}
```

#### `RenderMetric`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/observability.ts#L1) `packages/chart/src/observability.ts`

```ts
export interface RenderMetric {
  operation: string;
  provider: string;
  durationMs: number;
  seriesCount: number;
  timestamp: number;
  status: 'ok' | 'error';
}
```

#### `ResponsiveDimensions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/animation.ts#L40) `packages/chart/src/animation.ts`

```ts
export interface ResponsiveDimensions {
  width: number;
  height: number;
  breakpoint: 'mobile' | 'tablet' | 'desktop';
}
```

#### `TooltipContent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/tooltip.ts#L8) `packages/chart/src/tooltip.ts`

```ts
export interface TooltipContent {
  visible: boolean;
  series?: string;
  value?: number;
  targetType?: string;
}
```

#### `TooltipEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/tooltip.ts#L3) `packages/chart/src/tooltip.ts`

```ts
export interface TooltipEvent {
  x: number;
  y: number;
}
```
<!-- kiwa-public-api:end -->
