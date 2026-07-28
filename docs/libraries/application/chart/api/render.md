---
title: "@kiwa-lab/chart render の API 契約"
---

# <code v-pre>@kiwa-lab/chart</code> <code v-pre>render</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/render.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>renderChart</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/chart/src/render.ts#L39) <code v-pre>packages/chart/src/render.ts</code>

spec を svg-like tree に変換。 real chart library (Recharts / Chart.js / D3 / Visx) の rendered DOM 相当を mock 生成、 kind 別に shape / rect / path / circle を配置。

```ts
export declare function renderChart(spec: ChartSpec): ChartNode;
```

### 型

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
