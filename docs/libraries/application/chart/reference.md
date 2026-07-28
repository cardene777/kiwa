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

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>animateChartFrames</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/animation.ts#L20) <code v-pre>packages/chart/src/animation.ts</code>

animation frame 列を生成、 fromValues → toValues を frames 数で補間。 real Recharts / Chart.js の animation stream を mock。

```ts
export declare function animateChartFrames(build: (values: number[]) => ChartNode, opts: AnimateChartOptions): AnimationFrame[];
```

#### <code v-pre>captureLegend</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/legend.ts#L14) <code v-pre>packages/chart/src/legend.ts</code>

rendered chart tree を走査して series 名 + 色 + 表示状態を legend entry 化。 real chart library の Legend component が render する data table 相当。

```ts
export declare function captureLegend(rendered: ChartNode): LegendEntry[];
```

#### <code v-pre>computeAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/axis.ts#L18) <code v-pre>packages/chart/src/axis.ts</code>

numeric data から axis の domain + tick + scale を計算。 real chart library の d3-scale 相当を mock、 nice=true で見栄えの良い round 値に丸める。

```ts
export declare function computeAxis(values: number[], options?: AxisOptions): AxisResult;
```

#### <code v-pre>computeResponsiveDimensions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/animation.ts#L50) <code v-pre>packages/chart/src/animation.ts</code>

viewport width から chart dimensions + breakpoint を導出。 responsive chart の mock、 container width に応じて aspect ratio 調整。

```ts
export declare function computeResponsiveDimensions(containerWidth: number, aspectRatio?: number): ResponsiveDimensions;
```

#### <code v-pre>createChartClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/client.ts#L34) <code v-pre>packages/chart/src/client.ts</code>

provider 別のみ id prefix + 属性 default を持たせる。 全 API 共通 interface で Recharts / Chart.js / D3 / Visx を差し替え可能。

```ts
export declare function createChartClient(options?: CreateChartClientOptions): ChartClient;
```

#### <code v-pre>dispatchTooltip</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/tooltip.ts#L19) <code v-pre>packages/chart/src/tooltip.ts</code>

event 座標に最も近い data node (rect / circle / path) を探して tooltip 内容を決定。 real chart library の hover handler + tooltip content builder 相当。

```ts
export declare function dispatchTooltip(rendered: ChartNode, event: TooltipEvent): TooltipContent;
```

#### <code v-pre>drillDown</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/drilldown.ts#L20) <code v-pre>packages/chart/src/drilldown.ts</code>

chart tree を掘り下げて特定 series + data index の detail node を取得。 real chart lib の onClick → drill-down navigation を mock。

```ts
export declare function drillDown(tree: ChartNode, request: DrillDownRequest): DrillDownResult;
```

#### <code v-pre>exportChart</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/drilldown.ts#L44) <code v-pre>packages/chart/src/drilldown.ts</code>

chart tree を SVG string or PNG mock bytes に変換。 real Chart.js の canvas.toDataURL / Recharts の SVG export を mock。

```ts
export declare function exportChart(tree: ChartNode, options?: ExportOptions): {
    format: 'svg' | 'png';
    content: string;
    bytes: number;
};
```

#### <code v-pre>renderChart</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/render.ts#L39) <code v-pre>packages/chart/src/render.ts</code>

spec を svg-like tree に変換。 real chart library (Recharts / Chart.js / D3 / Visx) の rendered DOM 相当を mock 生成、 kind 別に shape / rect / path / circle を配置。

```ts
export declare function renderChart(spec: ChartSpec): ChartNode;
```

#### <code v-pre>withObservability</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/observability.ts#L19) <code v-pre>packages/chart/src/observability.ts</code>

render 動作を metric として emit、 downstream (Datadog / OTel / console) に渡す hook 経路。 real chart lib の performance measurement 相当。

```ts
export declare function withObservability<T>(fn: () => T, hook: ObservabilityHook, context: {
    operation: string;
    provider: string;
    seriesCount: number;
    now?: () => number;
}): T;
```

### 型

#### <code v-pre>AnimateChartOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/animation.ts#L9) <code v-pre>packages/chart/src/animation.ts</code>

```ts
export interface AnimateChartOptions {
    fromValues: number[];
    toValues: number[];
    frames?: number;
    easing?: 'linear' | 'ease-in-out';
}
```

#### <code v-pre>AnimationFrame</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/animation.ts#L3) <code v-pre>packages/chart/src/animation.ts</code>

```ts
export interface AnimationFrame {
    time: number;
    tree: ChartNode;
    interpolated: boolean;
}
```

#### <code v-pre>AxisOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/axis.ts#L1) <code v-pre>packages/chart/src/axis.ts</code>

```ts
export interface AxisOptions {
    tickCount?: number;
    nice?: boolean;
    scale?: 'linear' | 'log';
}
```

#### <code v-pre>AxisResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/axis.ts#L7) <code v-pre>packages/chart/src/axis.ts</code>

```ts
export interface AxisResult {
    domain: [number, number];
    ticks: number[];
    scale: 'linear' | 'log';
    tickFormat: (value: number) => string;
}
```

#### <code v-pre>ChartClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/client.ts#L15) <code v-pre>packages/chart/src/client.ts</code>

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

#### <code v-pre>ChartDataPoint</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/render.ts#L3) <code v-pre>packages/chart/src/render.ts</code>

```ts
export interface ChartDataPoint {
    x: number | string;
    y: number;
    label?: string;
}
```

#### <code v-pre>ChartKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/render.ts#L1) <code v-pre>packages/chart/src/render.ts</code>

```ts
export type ChartKind = 'bar' | 'line' | 'pie' | 'scatter';
```

#### <code v-pre>ChartNode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/render.ts#L28) <code v-pre>packages/chart/src/render.ts</code>

svg-like tree node — real chart library の rendered element を mock 表現。 type = svg element 名 / attrs = attribute map / children = ネスト tree。

```ts
export interface ChartNode {
    type: string;
    attrs: Record<string, string | number>;
    children: ChartNode[];
    meta?: Record<string, unknown>;
}
```

#### <code v-pre>ChartProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/client.ts#L5) <code v-pre>packages/chart/src/client.ts</code>

```ts
export type ChartProvider = 'recharts' | 'chartjs' | 'd3' | 'visx';
```

#### <code v-pre>ChartSeries</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/render.ts#L9) <code v-pre>packages/chart/src/render.ts</code>

```ts
export interface ChartSeries {
    name: string;
    data: ChartDataPoint[];
    color?: string;
    hidden?: boolean;
}
```

#### <code v-pre>ChartSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/render.ts#L16) <code v-pre>packages/chart/src/render.ts</code>

```ts
export interface ChartSpec {
    kind: ChartKind;
    series: ChartSeries[];
    width?: number;
    height?: number;
    title?: string;
}
```

#### <code v-pre>DrillDownRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/drilldown.ts#L3) <code v-pre>packages/chart/src/drilldown.ts</code>

```ts
export interface DrillDownRequest {
    seriesName: string;
    dataIndex: number;
}
```

#### <code v-pre>DrillDownResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/drilldown.ts#L8) <code v-pre>packages/chart/src/drilldown.ts</code>

```ts
export interface DrillDownResult {
    seriesName: string;
    dataIndex: number;
    value: number | null;
    detailNodes: ChartNode[];
    found: boolean;
}
```

#### <code v-pre>ExportOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/drilldown.ts#L35) <code v-pre>packages/chart/src/drilldown.ts</code>

```ts
export interface ExportOptions {
    format?: 'svg' | 'png';
    scale?: number;
}
```

#### <code v-pre>LegendEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/legend.ts#L3) <code v-pre>packages/chart/src/legend.ts</code>

```ts
export interface LegendEntry {
    name: string;
    color: string;
    dataKey?: string;
    hidden: boolean;
}
```

#### <code v-pre>ObservabilityHook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/observability.ts#L10) <code v-pre>packages/chart/src/observability.ts</code>

```ts
export interface ObservabilityHook {
    onRender?: (metric: RenderMetric) => void;
    onError?: (error: Error, context: Record<string, unknown>) => void;
}
```

#### <code v-pre>RenderedChart</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/client.ts#L7) <code v-pre>packages/chart/src/client.ts</code>

```ts
export interface RenderedChart {
    provider: ChartProvider;
    id: string;
    spec: ChartSpec;
    tree: ChartNode;
    renderedAt: number;
}
```

#### <code v-pre>RenderMetric</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/observability.ts#L1) <code v-pre>packages/chart/src/observability.ts</code>

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

#### <code v-pre>ResponsiveDimensions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/animation.ts#L40) <code v-pre>packages/chart/src/animation.ts</code>

```ts
export interface ResponsiveDimensions {
    width: number;
    height: number;
    breakpoint: 'mobile' | 'tablet' | 'desktop';
}
```

#### <code v-pre>TooltipContent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/tooltip.ts#L8) <code v-pre>packages/chart/src/tooltip.ts</code>

```ts
export interface TooltipContent {
    visible: boolean;
    series?: string;
    value?: number;
    targetType?: string;
}
```

#### <code v-pre>TooltipEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/tooltip.ts#L3) <code v-pre>packages/chart/src/tooltip.ts</code>

```ts
export interface TooltipEvent {
    x: number;
    y: number;
}
```
<!-- kiwa-public-api:end -->
