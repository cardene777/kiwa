---
title: "@kiwa-lab/chart client の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/chart</code> <code v-pre>client</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/client.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createChartClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/client.ts#L34) <code v-pre>packages/chart/src/client.ts</code>

provider 別のみ id prefix + 属性 default を持たせる。 全 API 共通 interface で Recharts / Chart.js / D3 / Visx を差し替え可能。

```ts
export declare function createChartClient(options?: CreateChartClientOptions): ChartClient;
```

### 型

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

#### <code v-pre>ChartProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/client.ts#L5) <code v-pre>packages/chart/src/client.ts</code>

```ts
export type ChartProvider = 'recharts' | 'chartjs' | 'd3' | 'visx';
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
